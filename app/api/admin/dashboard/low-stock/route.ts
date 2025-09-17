export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all inventory items with low stock thresholds
    const allItems = await prisma.inventoryItem.findMany({
      where: {
        lowStockThreshold: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        quantity: true,
        lowStockThreshold: true
      }
    })

    // Filter items where quantity <= lowStockThreshold and sort by quantity
    const filteredItems = allItems
      .filter(item => item.lowStockThreshold !== null && item.quantity <= item.lowStockThreshold)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5)

    const data = filteredItems.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity.toString(),
      low_stock_threshold: (item.lowStockThreshold || 0).toString()
    }))

    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    console.error('Dashboard low-stock error:', err)
    return NextResponse.json({ ok: false, error: err?.message ?? 'error' }, { status: 500 })
  }
}





