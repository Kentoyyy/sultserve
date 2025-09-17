export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isArchived: false },
      include: { category: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    })
    
    const data = products.map((p) => ({
      id: p.id,
      name: p.name,
      price_cents: p.priceCents,
      status: p.status,
      image_url: p.imageUrl,
      category: p.category?.name ?? null
    }))
    
    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Received body:', body)
    
    const { name, description = null, image_url = null, price_cents, category_id = null, status = 'available' } = body ?? {}
    
    console.log('Parsed values:', { name, description, image_url, price_cents, category_id, status })
    
    if (!name || typeof price_cents !== 'number') {
      return NextResponse.json({ ok: false, error: `name and numeric price_cents required. Got name: ${name}, price_cents: ${price_cents} (type: ${typeof price_cents})` }, { status: 400 })
    }
    
    const product = await prisma.product.create({
      data: {
        name,
        description,
        imageUrl: image_url,
        priceCents: price_cents,
        categoryId: category_id,
        status,
        isArchived: false
      }
    })
    
    console.log('Created product:', product)
    
    // Log the activity
    const { logProductActivity } = await import('@/lib/activityLogger')
    await logProductActivity(
      'CREATE',
      product.id,
      product.name,
      `Created new product "${product.name}" with price ₱${(product.priceCents / 100).toFixed(2)}`,
      {
        price_cents,
        category_id,
        status,
        description
      }
    )
    
    return NextResponse.json({ ok: true, id: product.id })
  } catch (e: any) {
    console.error('Error creating product:', e)
    return NextResponse.json({ ok: false, error: e?.message, details: e }, { status: 500 })
  }
}



