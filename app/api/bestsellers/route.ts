export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get bestselling products from order items (same logic as admin dashboard)
    const orderItems = await prisma.orderItem.findMany({
      include: {
        product: {
          include: {
            category: { select: { name: true, sortOrder: true } }
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
      const productId = item.product.id
      if (!acc[productId]) {
        acc[productId] = {
          product: item.product,
          totalSold: 0
        }
      }
      acc[productId].totalSold += item.quantity
      return acc
    }, {} as Record<string, { product: { id: string; name: string; description: string | null; priceCents: number; imageUrl: string | null; status: string; category: { name: string } | null }, totalSold: number }>)

    // Convert to array and sort by quantity, take top 3
    const bestSellers = Object.values(productSales)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 3)
      .map(item => ({
        id: item.product.id,
        name: item.product.name,
        description: item.product.description,
        priceCents: item.product.priceCents,
        imageUrl: item.product.imageUrl,
        status: item.product.status,
        category: item.product.category?.name || 'Uncategorized',
        totalSold: item.totalSold
      }))

    // If no sales data, get first 3 available products as fallback
    if (bestSellers.length === 0) {
      const fallbackProducts = await prisma.product.findMany({
        where: { 
          isArchived: false,
          status: 'available'
        },
        include: { 
          category: { select: { name: true, sortOrder: true } }
        },
        orderBy: [
          { category: { sortOrder: 'asc' } },
          { name: 'asc' }
        ],
        take: 3
      })

      const fallback = fallbackProducts.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        priceCents: product.priceCents,
        imageUrl: product.imageUrl,
        status: product.status,
        category: product.category?.name || 'Uncategorized',
        totalSold: 0
      }))

      return NextResponse.json({ 
        ok: true, 
        data: fallback,
        lastModified: Date.now()
      })
    }

    return NextResponse.json({ 
      ok: true, 
      data: bestSellers,
      lastModified: Date.now()
    })
  } catch (e: unknown) {
    console.error('Error fetching best sellers:', e)
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}
