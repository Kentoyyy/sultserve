export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all active products with stock information
    const rows = await prisma.product.findMany({
      where: { isArchived: false },
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
      const hasRecipe = !!p.recipe
      let limitingIngredient = null
      
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
      }
      
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category?.name ?? null,
        priceCents: p.priceCents,
        status: p.status,
        imageUrl: p.imageUrl,
        hasRecipe,
        canMake,
        limitingIngredient,
        recipe: p.recipe ? {
          id: p.recipe.id,
          ingredients: p.recipe.ingredients.map(ing => ({
            id: ing.id,
            quantityNeeded: Number(ing.quantityNeeded),
            unit: ing.unit,
            inventoryItem: {
              id: ing.inventoryItem.id,
              name: ing.inventoryItem.name,
              quantity: Number(ing.inventoryItem.quantity),
              unit: ing.inventoryItem.unit
            }
          }))
        } : null
      }
    })
    
    return NextResponse.json({ ok: true, data: products })
  } catch (e: unknown) {
    console.error('Error fetching products for cashier:', e)
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}



