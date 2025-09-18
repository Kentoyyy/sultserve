export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, paymentStatus, eventType } = body

    if (!orderId) {
      return NextResponse.json({ ok: false, error: 'orderId required' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 })
    }

    const nextPaymentStatus = typeof paymentStatus === 'string' ? paymentStatus : 'unknown'
    const status = nextPaymentStatus === 'paid' ? 'confirmed' : order.status

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: nextPaymentStatus,
        status,
      },
    })

    return NextResponse.json({ ok: true, order: updated, eventType })
  } catch (error) {
    console.error('Confirm payment error', error)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}


