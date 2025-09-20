import { InventoryPageClient } from './InventoryPageClient'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getItems() {
  const itemsRaw = await prisma.inventoryItem.findMany({
    include: {
      recipeIngredients: {
        include: {
          recipe: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  const items = itemsRaw.map((it) => {
    const usedByMap = new Map<string, { id: string; name: string; category: string | null }>()
    for (const ri of it.recipeIngredients) {
      const product = ri.recipe.product
      if (product) {
        usedByMap.set(product.id, {
          id: product.id,
          name: product.name,
          category: product.category?.name ?? null,
        })
      }
    }

    return {
      id: it.id,
      name: it.name,
      unit: it.unit,
      quantity: Number(it.quantity),
      lowStockThreshold: it.lowStockThreshold === null ? null : Number(it.lowStockThreshold),
      usedBy: Array.from(usedByMap.values()),
    }
  })

  return items
}

export default async function AdminInventoryPage() {
  const items = await getItems()
  return <InventoryPageClient items={items} />
}

