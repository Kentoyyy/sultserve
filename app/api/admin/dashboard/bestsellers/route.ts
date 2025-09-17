export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get bestselling products from order items
    const orderItems = await prisma.orderItem.findMany({
      include: {
        product: {
          select: {
            name: true
          }
        },
        order: {
          select: {
            status: true
          }
        }
      },
      where: {
        order: {
          status: {
            in: ['completed', 'ready']
          }
        }
      }
    })

    // Group by product and sum quantities
    const productSales = orderItems.reduce((acc, item) => {
      const productName = item.product.name
      if (!acc[productName]) {
        acc[productName] = 0
      }
      acc[productName] += item.quantity
      return acc
    }, {} as Record<string, number>)

    // Convert to array and sort by quantity
    const data = Object.entries(productSales)
      .map(([name, qty]) => ({
        name,
        qty: qty.toString()
      }))
      .sort((a, b) => Number(b.qty) - Number(a.qty))
      .slice(0, 5)

    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    console.error('Dashboard bestsellers error:', err)
    return NextResponse.json({ ok: false, error: err?.message ?? 'error' }, { status: 500 })
  }
}





