export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

// Get product recipe
export async function GET(_: Request, { params }: Params) {
  const { id } = await params
  
  try {
    const recipe = await prisma.productRecipe.findUnique({
      where: { productId: id },
      include: {
        ingredients: {
          include: {
            inventoryItem: true
          }
        }
      }
    })
    
    return NextResponse.json({ ok: true, data: recipe })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}

// Create or update product recipe
export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  
  try {
    const body = await request.json()
    const { ingredients } = body
    
    if (!ingredients || !Array.isArray(ingredients)) {
      return NextResponse.json({ ok: false, error: 'Invalid ingredients data' }, { status: 400 })
    }
    
    // Validate that the product exists
    const product = await prisma.product.findUnique({
      where: { id }
    })
    
    if (!product) {
      return NextResponse.json({ ok: false, error: 'Product not found' }, { status: 404 })
    }
    
    // Delete existing recipe if it exists
    await prisma.productRecipe.deleteMany({
      where: { productId: id }
    })
    
    // Create new recipe
    const recipe = await prisma.productRecipe.create({
      data: {
        productId: id,
        ingredients: {
          create: ingredients.map((ing: any) => ({
            inventoryItemId: ing.inventoryItemId,
            quantityNeeded: ing.quantityNeeded,
            unit: ing.unit
          }))
        }
      },
      include: {
        ingredients: {
          include: {
            inventoryItem: true
          }
        }
      }
    })
    
    return NextResponse.json({ ok: true, data: recipe })
  } catch (e: any) {
    console.error('Error creating recipe:', e)
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}

// Delete product recipe
export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params
  
  try {
    await prisma.productRecipe.deleteMany({
      where: { productId: id }
    })
    
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}



