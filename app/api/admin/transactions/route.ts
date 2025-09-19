import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '5')
    const search = searchParams.get('search') || ''
    const paymentMethod = searchParams.get('paymentMethod') || ''
    const status = searchParams.get('status') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { 
          customer: {
            name: { contains: search, mode: 'insensitive' }
          }
        },
        { 
          customer: {
            phone: { contains: search, mode: 'insensitive' }
          }
        }
      ]
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod
    }

    if (status) {
      where.status = status
    }

    if (dateFrom || dateTo) {
      where.orderedAt = {}
      if (dateFrom) {
        where.orderedAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.orderedAt.lte = new Date(dateTo + 'T23:59:59.999Z')
      }
    }

    // Get transactions with pagination
    const [transactions, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              name: true,
              phone: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  imageUrl: true
                }
              }
            }
          }
        },
        orderBy: {
          orderedAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ])

    // Calculate totals for each transaction
    const transactionsWithTotals = transactions.map(transaction => {
      const subtotal = transaction.items.reduce((sum, item) => {
        const itemTotal = item.quantity * (item.unitPriceCents / 100)
        return sum + itemTotal
      }, 0)

      const tax = subtotal * 0.12 // 12% VAT
      const total = subtotal + tax

      return {
        ...transaction,
        customerName: transaction.customer?.name || null,
        customerPhone: transaction.customer?.phone || null,
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100,
        createdAt: transaction.orderedAt // Map orderedAt to createdAt for frontend
      }
    })

    // Get summary statistics
    const summary = await prisma.order.aggregate({
      where: {
        ...where,
        status: { not: 'cancelled' }
      },
      _sum: {
        totalCents: true
      },
      _count: {
        id: true
      }
    })

    const totalRevenue = (summary._sum.totalCents || 0) / 100
    const totalOrders = summary._count.id || 0

    return NextResponse.json({
      success: true,
      data: {
        transactions: transactionsWithTotals,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        summary: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalOrders
        }
      }
    })

  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
