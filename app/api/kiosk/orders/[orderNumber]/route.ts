export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ orderNumber: string }> }

export async function GET(_: Request, { params }: Params) {
  const { orderNumber } = await params
  
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
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
      }
    })

    if (!order) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, data: order })
  } catch (e: unknown) {
    console.error('Error fetching order:', e)
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}














