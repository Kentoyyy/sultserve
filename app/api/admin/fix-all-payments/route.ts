import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Find all completed orders that still have pending payment status
    const ordersToUpdate = await prisma.order.findMany({
      where: {
        status: 'completed',
        paymentStatus: 'pending'
      }
    })

    console.log(`Found ${ordersToUpdate.length} completed orders with pending payment status`)

    // Update payment status to paid for all completed orders
    const updatedOrders = await prisma.order.updateMany({
      where: {
        status: 'completed',
        paymentStatus: 'pending'
      },
      data: {
        paymentStatus: 'paid'
      }
    })

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedOrders.count} completed orders to paid status`,
      updatedCount: updatedOrders.count,
      orders: ordersToUpdate.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        paymentMethod: order.paymentMethod,
        status: order.status,
        paymentStatus: order.paymentStatus
      }))
    })

  } catch (error) {
    console.error('Error fixing all payments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fix all payments' },
      { status: 500 }
    )
  }
}



