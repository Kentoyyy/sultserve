export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Params) {
  const { id } = await params
  try {
    const product = await prisma.product.findUnique({ where: { id } })
    return NextResponse.json({ ok: true, data: product })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  try {
    const body = await request.json()
    
    // Get original product for logging
    const originalProduct = await prisma.product.findUnique({ where: { id } })
    
    const updateData: any = {}
    if ('name' in body) updateData.name = body.name
    if ('description' in body) updateData.description = body.description
    if ('imageUrl' in body) updateData.imageUrl = body.imageUrl
    if ('priceCents' in body) updateData.priceCents = body.priceCents
    if ('categoryId' in body) updateData.categoryId = body.categoryId
    if ('status' in body) updateData.status = body.status
    
    const updatedProduct = await prisma.product.update({ where: { id }, data: updateData })
    
    // Log the activity
    if (originalProduct) {
      const { logProductActivity } = await import('@/lib/activityLogger')
      const changes: any = {}
      
      if (originalProduct.name !== updateData.name && updateData.name) {
        changes.name = { from: originalProduct.name, to: updateData.name }
      }
      if (originalProduct.priceCents !== updateData.priceCents && updateData.priceCents) {
        changes.price = { from: `₱${(originalProduct.priceCents / 100).toFixed(2)}`, to: `₱${(updateData.priceCents / 100).toFixed(2)}` }
      }
      if (originalProduct.status !== updateData.status && updateData.status) {
        changes.status = { from: originalProduct.status, to: updateData.status }
      }
      
      await logProductActivity(
        'UPDATE',
        updatedProduct.id,
        updatedProduct.name,
        `Updated product "${updatedProduct.name}"`,
        { changes }
      )
    }
    
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params
  try {
    const product = await prisma.product.findUnique({ where: { id } })
    
    await prisma.product.update({ 
      where: { id }, 
      data: { 
        isArchived: true, 
        archivedAt: new Date(),
        status: 'out_of_stock' // Also mark as out of stock when archived
      } 
    })
    
    // Log the activity
    if (product) {
      const { logProductActivity } = await import('@/lib/activityLogger')
      await logProductActivity(
        'ARCHIVE',
        product.id,
        product.name,
        `Archived product "${product.name}"`,
        { originalStatus: product.status }
      )
    }
    
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}


