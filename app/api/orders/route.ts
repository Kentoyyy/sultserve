export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { items, paymentMethod = 'cash', totalAmount, orderType = 'kiosk' } = body

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
          orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
          orderType,
          totalCents: totalAmount,
          paymentMethod,
          status: 'pending'
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
            specialNotes: item.specialNotes || null
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
      description: `New order created via ${orderType}`,
      metadata: {
        orderType,
        paymentMethod,
        totalCents: order.totalCents,
        itemCount: items.length
      }
    })

    return NextResponse.json({ 
      ok: true, 
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalCents: order.totalCents,
        paymentMethod: order.paymentMethod,
        createdAt: order.orderedAt
      }
    })
  } catch (e: any) {
    console.error('Error creating order:', e)
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ ok: false, error: 'Order ID is required' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                imageUrl: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      ok: true, 
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalCents: order.totalCents,
        paymentMethod: order.paymentMethod,
        createdAt: order.orderedAt,
        items: order.items.map(item => ({
          id: item.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          totalCents: item.totalCents,
          imageUrl: item.product.imageUrl
        }))
      }
    })
  } catch (e: any) {
    console.error('Error fetching order:', e)
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}





