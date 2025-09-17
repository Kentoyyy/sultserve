export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get daily sales for the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const orders = await prisma.order.findMany({
      where: {
        orderedAt: {
          gte: sevenDaysAgo
        },
        status: {
          in: ['completed', 'ready']
        }
      },
      select: {
        orderedAt: true,
        totalCents: true
      }
    })

    // Group by day
    const salesByDay = orders.reduce((acc, order) => {
      const day = order.orderedAt.toISOString().split('T')[0]
      if (!acc[day]) {
        acc[day] = { total_cents: 0, orders_count: 0 }
      }
      acc[day].total_cents += order.totalCents
      acc[day].orders_count += 1
      return acc
    }, {} as Record<string, { total_cents: number; orders_count: number }>)

    const data = Object.entries(salesByDay)
      .map(([day, stats]) => ({
        day,
        total_cents: stats.total_cents.toString(),
        orders_count: stats.orders_count.toString()
      }))
      .sort((a, b) => b.day.localeCompare(a.day))
      .slice(0, 7)

    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    console.error('Dashboard sales error:', err)
    return NextResponse.json({ ok: false, error: err?.message ?? 'error' }, { status: 500 })
  }
}





