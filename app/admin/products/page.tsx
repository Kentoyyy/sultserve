import { ProductsPageClient } from './ProductsPageClient'
import { prisma } from '@/lib/prisma'

async function getProducts() {
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
    orderBy: { createdAt: 'desc' }
  })
  
  return rows.map((p) => {
    // Calculate availability based on recipe
    let canMake = 0
    let hasRecipe = !!p.recipe
    let limitingIngredient = null
    const ingredients = p.recipe?.ingredients.map((ing) => ({
      id: ing.id,
      inventoryItemId: ing.inventoryItem.id,
      name: ing.inventoryItem.name,
      quantityNeeded: Number(ing.quantityNeeded),
      unit: ing.unit,
      available: Number(ing.inventoryItem.quantity)
    })) || []
    
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
      imageUrl: p.imageUrl,
      category: p.category?.name ?? null,
      priceCents: p.priceCents,
      status: p.status,
      hasRecipe,
      canMake,
      limitingIngredient,
      ingredients
    }
  })
}

async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' }
  })
}

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(), 
    getCategories()
  ])
  return <ProductsPageClient products={products} categories={categories} />
}


