export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { items, paymentMethod = 'cash', totalAmount } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: 'Items are required' }, { status: 400 })
    }

    if (!totalAmount || typeof totalAmount !== 'number') {
      return NextResponse.json({ ok: false, error: 'Total amount is required' }, { status: 400 })
    }

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber: `ORD${Date.now()}`, // Generate unique order number
          orderType: 'kiosk',
          totalCents: totalAmount,
          paymentMethod,
          paymentStatus: paymentMethod === 'cash' ? 'paid' : 'pending',
        }
      })

      // Create order items
      for (const item of items) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPriceCents: item.unitPrice,
            totalCents: item.quantity * item.unitPrice,
          }
        })

        // Deduct inventory if product has recipe
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: {
            recipe: {
              include: {
                ingredients: true
              }
            }
          }
        })

        if (product?.recipe) {
          for (const ingredient of product.recipe.ingredients) {
            const deductionAmount = Number(ingredient.quantityNeeded) * item.quantity
            
            // Update inventory quantity
            await tx.inventoryItem.update({
              where: { id: ingredient.inventoryItemId },
              data: { 
                quantity: { 
                  decrement: deductionAmount 
                } 
              }
            })
            
            // Log the stock movement
            await tx.stockMovement.create({
              data: {
                inventoryItemId: ingredient.inventoryItemId,
                change: -deductionAmount,
                reason: `Order #${newOrder.orderNumber}: ${item.quantity}x ${item.productName}`,
                referenceId: newOrder.id
              }
            })
          }
        }
      }

      return newOrder
    })

    // Log the order activity
    const { logActivity } = await import('@/lib/activityLogger')
    await logActivity({
      action: 'CREATE',
      entityType: 'ORDER',
      entityId: order.id,
      entityName: `Order #${order.orderNumber}`,
      description: `New order placed via kiosk - ${items.length} items, Total: ₱${(totalAmount / 100).toFixed(2)}`,
      metadata: {
        orderType: 'kiosk',
        itemCount: items.length,
        totalAmount,
        paymentMethod,
        items: items.map(item => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      }
    })

    return NextResponse.json({ 
      ok: true, 
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalCents
      }
    })

  } catch (e: any) {
    console.error('Error creating order:', e)
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get recent orders for customer reference
    const orders = await prisma.order.findMany({
      where: { orderType: 'kiosk' },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                priceCents: true
              }
            }
          }
        }
      },
      orderBy: { orderedAt: 'desc' },
      take: 10
    })

    return NextResponse.json({ ok: true, data: orders })
  } catch (e: any) {
    console.error('Error fetching orders:', e)
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}
