export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all orders for cashier view
    const orders = await prisma.order.findMany({
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
      take: 50 // Get latest 50 orders
    })

    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalCents,
      paymentMethod: order.paymentMethod,
      orderType: order.orderType,
      createdAt: order.orderedAt,
      items: order.items.map(item => ({
        id: item.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        totalCents: item.totalCents
      }))
    }))

    return NextResponse.json({ ok: true, data: formattedOrders })
  } catch (e: unknown) {
    console.error('Error fetching orders for cashier:', e)
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { orderId, status, staffId } = body

    if (!orderId || !status) {
      return NextResponse.json({ ok: false, error: 'Order ID and status are required' }, { status: 400 })
    }

    const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ ok: false, error: 'Invalid status' }, { status: 400 })
    }

    // Update order status and assign to staff if not already assigned
    const updateData: Record<string, unknown> = { status }
    
    // If this is the first time a staff member touches this order, assign them
    if (staffId) {
      const currentOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: { processedById: true }
      })
      
      if (!currentOrder?.processedById) {
        updateData.processedById = staffId
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: true
      }
    })

    // Log the status change
    const { logActivity } = await import('@/lib/activityLogger')
    await logActivity({
      action: 'UPDATE',
      entityType: 'ORDER',
      entityId: updatedOrder.id,
      entityName: `Order #${updatedOrder.orderNumber}`,
      description: `Order status changed to ${status}`,
      metadata: {
        previousStatus: updatedOrder.status,
        newStatus: status,
        staffId: staffId || 'unknown',
        orderType: updatedOrder.orderType
      }
    })

    return NextResponse.json({ ok: true, order: updatedOrder })
  } catch (e: unknown) {
    console.error('Error updating order status:', e)
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}
