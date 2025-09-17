export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all active products with detailed stock information for menu display
    const rows = await prisma.product.findMany({
      where: { 
        isArchived: false
      },
      include: { 
        category: { select: { name: true } },
        recipe: {
          include: {
            ingredients: {
              include: {
                inventoryItem: true
              }
            }
          }
        }
      },
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { name: 'asc' }
      ]
    })
    
    const products = rows.map((p) => {
      // Calculate availability based on recipe
      let canMake = 0
      let hasRecipe = !!p.recipe
      let limitingIngredient = null
      let stockStatus = 'available' // available, low_stock, out_of_stock
      
      if (p.recipe && p.recipe.ingredients.length > 0) {
        canMake = Math.min(...p.recipe.ingredients.map(ing => {
          const available = Number(ing.inventoryItem.quantity)
          const needed = Number(ing.quantityNeeded)
          return needed > 0 ? Math.floor(available / needed) : Infinity
        }))
        
        // Find limiting ingredient
        const limitingIng = p.recipe.ingredients.find(ing => {
          const available = Number(ing.inventoryItem.quantity)
          const needed = Number(ing.quantityNeeded)
          return needed > 0 && Math.floor(available / needed) === canMake
        })
        limitingIngredient = limitingIng?.inventoryItem.name || null
        
        // Determine stock status
        if (canMake === 0) {
          stockStatus = 'out_of_stock'
        } else if (canMake <= 5) {
          stockStatus = 'low_stock'
        } else {
          stockStatus = 'available'
        }
      } else {
        // No recipe = assume always available
        canMake = 999
        stockStatus = 'available'
      }
      
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category?.name ?? null,
        priceCents: p.priceCents,
        status: p.status,
        hasRecipe,
        canMake,
        limitingIngredient,
        stockStatus, // New field for display
        isOrderable: stockStatus !== 'out_of_stock' && p.status === 'available'
      }
    })
    
    return NextResponse.json({ ok: true, data: products })
  } catch (e: any) {
    console.error('Error fetching menu data:', e)
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}

