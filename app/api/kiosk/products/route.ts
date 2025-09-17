export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all active products with stock information for customer kiosk
    const rows = await prisma.product.findMany({
      where: { 
        isArchived: false,
        status: 'available' // Only show available products to customers
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
      
      // Only return products that can be made (have stock)
      if (hasRecipe && canMake === 0) {
        return null // Filter out products with no stock
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
        canMake: hasRecipe ? canMake : 999, // If no recipe, assume unlimited
        limitingIngredient
      }
    }).filter(Boolean) // Remove null values
    
    return NextResponse.json({ ok: true, data: products })
  } catch (e: any) {
    console.error('Error fetching products for kiosk:', e)
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}



