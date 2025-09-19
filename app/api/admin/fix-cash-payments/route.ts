import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Find completed orders with cash payment that still have pending payment status
    const ordersToUpdate = await prisma.order.findMany({
      where: {
        status: 'completed',
        paymentMethod: 'cash',
        paymentStatus: 'pending'
      }
    })

    console.log(`Found ${ordersToUpdate.length} cash orders to update`)

    // Update payment status to paid for completed cash orders
    const updatedOrders = await prisma.order.updateMany({
      where: {
        status: 'completed',
        paymentMethod: 'cash',
        paymentStatus: 'pending'
      },
      data: {
        paymentStatus: 'paid'
      }
    })

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedOrders.count} cash orders to paid status`,
      updatedCount: updatedOrders.count
    })

  } catch (error) {
    console.error('Error fixing cash payments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fix cash payments' },
      { status: 500 }
    )
  }
}



