import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Find orders that are completed but should be pending (recent orders with online payments)
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const ordersToReset = await prisma.order.findMany({
      where: {
        orderedAt: {
          gte: oneDayAgo
        },
        status: 'completed',
        paymentMethod: {
          in: ['card', 'ewallet', 'gcash']
        },
        paymentStatus: 'paid'
      }
    })

    console.log(`Found ${ordersToReset.length} orders to reset to pending status`)

    // Reset order status to pending for cashier to manage
    const updatedOrders = await prisma.order.updateMany({
      where: {
        orderedAt: {
          gte: oneDayAgo
        },
        status: 'completed',
        paymentMethod: {
          in: ['card', 'ewallet', 'gcash']
        },
        paymentStatus: 'paid'
      },
      data: {
        status: 'pending'
      }
    })

    return NextResponse.json({
      success: true,
      message: `Reset ${updatedOrders.count} orders to pending status for cashier management`,
      updatedCount: updatedOrders.count,
      orders: ordersToReset.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        status: order.status
      }))
    })

  } catch (error) {
    console.error('Error resetting order status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset order status' },
      { status: 500 }
    )
  }
}



