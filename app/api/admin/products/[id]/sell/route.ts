export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  
  try {
    const body = await request.json()
    const { quantity = 1 } = body
    
    if (quantity <= 0) {
      return NextResponse.json({ ok: false, error: 'Invalid quantity' }, { status: 400 })
    }
    
    // Get product with recipe
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        recipe: {
          include: {
            ingredients: {
              include: {
                inventoryItem: true
              }
            }
          }
        }
      }
    })
    
    if (!product) {
      return NextResponse.json({ ok: false, error: 'Product not found' }, { status: 404 })
    }
    
    if (!product.recipe) {
      return NextResponse.json({ ok: false, error: 'No recipe defined for this product' }, { status: 400 })
    }
    
    // Check if enough ingredients are available
    for (const ingredient of product.recipe.ingredients) {
      const available = Number(ingredient.inventoryItem.quantity)
      const needed = Number(ingredient.quantityNeeded) * quantity
      
      if (available < needed) {
        return NextResponse.json({ 
          ok: false, 
          error: `Insufficient ${ingredient.inventoryItem.name}. Need ${needed} ${ingredient.unit}, have ${available} ${ingredient.unit}` 
        }, { status: 400 })
      }
    }
    
    // Process the sale in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct ingredients from inventory
      for (const ingredient of product.recipe!.ingredients) {
        const deductionAmount = Number(ingredient.quantityNeeded) * quantity
        
        // Update inventory quantity
        await tx.inventoryItem.update({
          where: { id: ingredient.inventoryItemId },
          data: { 
            quantity: { 
              decrement: deductionAmount 
            } 
          }
        })
        
        // Log the stock movement
        await tx.stockMovement.create({
          data: {
            inventoryItemId: ingredient.inventoryItemId,
            change: -deductionAmount,
            reason: `Sale: ${quantity}x ${product.name}`,
            referenceId: id
          }
        })
      }
      
      return { success: true }
    })
    
    // Log the sale activity
    const { logProductActivity } = await import('@/lib/activityLogger')
    await logProductActivity(
      'SELL',
      product.id,
      product.name,
      `Sold ${quantity}x "${product.name}" - auto-deducted ingredients from inventory`,
      {
        quantity,
        totalPrice: (product.priceCents * quantity) / 100,
        ingredientsDeducted: product.recipe.ingredients.map(ing => ({
          item: ing.inventoryItem.name,
          amountDeducted: Number(ing.quantityNeeded) * quantity,
          unit: ing.unit
        }))
      }
    )
    
    return NextResponse.json({ 
      ok: true, 
      message: `Successfully sold ${quantity}x ${product.name}`,
      data: result
    })
    
  } catch (e: unknown) {
    console.error('Error processing sale:', e)
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}
