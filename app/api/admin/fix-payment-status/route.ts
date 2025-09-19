import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Find orders that are completed but have pending payment status
    const ordersToUpdate = await prisma.order.findMany({
      where: {
        status: 'completed',
        paymentStatus: 'pending'
      }
    })

    console.log(`Found ${ordersToUpdate.length} orders to update`)

    // Update payment status to paid for completed orders
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
      message: `Updated ${updatedOrders.count} orders`,
      updatedCount: updatedOrders.count
    })

  } catch (error) {
    console.error('Error fixing payment status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fix payment status' },
      { status: 500 }
    )
  }
}



