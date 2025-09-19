import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Find orders from the last 24 hours that are pending but should be paid
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const ordersToUpdate = await prisma.order.findMany({
      where: {
        orderedAt: {
          gte: oneDayAgo
        },
        paymentStatus: 'pending',
        paymentMethod: {
          in: ['card', 'ewallet', 'gcash']
        }
      }
    })

    console.log(`Found ${ordersToUpdate.length} recent orders with pending payment status`)

    // Update all these orders to paid but keep order status as is
    const updatedOrders = await prisma.order.updateMany({
      where: {
        orderedAt: {
          gte: oneDayAgo
        },
        paymentStatus: 'pending',
        paymentMethod: {
          in: ['card', 'ewallet', 'gcash']
        }
      },
      data: {
        paymentStatus: 'paid'
        // Don't update order status - let cashier manage it
      }
    })

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedOrders.count} recent orders to paid status`,
      updatedCount: updatedOrders.count,
      orders: ordersToUpdate.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        paymentMethod: order.paymentMethod,
        status: order.status,
        paymentStatus: order.paymentStatus,
        orderedAt: order.orderedAt
      }))
    })

  } catch (error) {
    console.error('Error fixing recent payments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fix recent payments' },
      { status: 500 }
    )
  }
}
