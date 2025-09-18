export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PAYMENTS_SERVICE_URL = process.env.PAYMENTS_SERVICE_URL || 'http://localhost:8081'
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, paymentMethod } = body as { orderId: string, paymentMethod?: string }

    if (!orderId) {
      return NextResponse.json({ ok: false, error: 'orderId is required' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } }
    })

    if (!order) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 })
    }

    const line_items = order.items.map((item) => ({
      name: item.product.name,
      amount: item.unitPriceCents,
      currency: 'PHP',
      quantity: item.quantity,
    }))

    // Ensure total in PayMongo matches order total (add a tax/fees line if needed)
    const sumItems = order.items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0)
    const delta = order.totalCents - sumItems
    if (delta > 0) {
      line_items.push({ name: 'Tax & Fees', amount: delta, currency: 'PHP', quantity: 1 })
    }

    // After returning from PayMongo, go back to kiosk modal flow (confirm/track)
    const success_url = `${APP_BASE_URL}/?paid=1&orderId=${encodeURIComponent(order.id)}&orderNumber=${encodeURIComponent(order.orderNumber)}`
    const cancel_url = `${APP_BASE_URL}/?cancelled=1`

    const payload = {
      order_id: order.id,
      order_number: order.orderNumber,
      line_items,
      success_url,
      cancel_url,
      payment_method_types: paymentMethod === 'card' ? ['card'] : paymentMethod === 'ewallet' || paymentMethod === 'gcash' ? ['gcash'] : ['gcash', 'card']
    }

    const resp = await fetch(`${PAYMENTS_SERVICE_URL}/paymongo/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const data = await resp.json().catch(async () => ({ ok: false, error: await resp.text() }))
    if (!resp.ok || data?.ok === false || !data?.checkout_url) {
      const message = typeof data === 'string' ? data : data?.error || 'Checkout init failed'
      return NextResponse.json({ ok: false, error: message }, { status: 400 })
    }
    return NextResponse.json({ ok: true, checkoutUrl: data.checkout_url })
  } catch (error) {
    console.error('Create checkout error', error)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}


