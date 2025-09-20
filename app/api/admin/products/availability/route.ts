export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all active products with their recipes and current inventory levels
    const products = await prisma.product.findMany({
      where: { 
        isArchived: false,
        recipe: {
          isNot: null // Only products that have recipes
        }
      },
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
    
    const availability = products.map(product => {
      if (!product.recipe) {
        return {
          productId: product.id,
          productName: product.name,
          available: false,
          reason: 'No recipe defined',
          maxServings: 0
        }
      }
      
      // Calculate how many servings can be made based on available ingredients
      let maxServings = Infinity
      let limitingIngredient = null
      
      for (const ingredient of product.recipe.ingredients) {
        const availableQuantity = Number(ingredient.inventoryItem.quantity)
        const neededQuantity = Number(ingredient.quantityNeeded)
        
        if (neededQuantity <= 0) continue
        
        const possibleServings = Math.floor(availableQuantity / neededQuantity)
        
        if (possibleServings < maxServings) {
          maxServings = possibleServings
          limitingIngredient = ingredient.inventoryItem.name
        }
      }
      
      return {
        productId: product.id,
        productName: product.name,
        available: maxServings > 0,
        maxServings: maxServings === Infinity ? 0 : maxServings,
        limitingIngredient,
        reason: maxServings === 0 ? `Out of ${limitingIngredient}` : null
      }
    })
    
    return NextResponse.json({ ok: true, data: availability })
  } catch (e: unknown) {
    console.error('Error checking product availability:', e)
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}














