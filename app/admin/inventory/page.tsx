import { InventoryPageClient } from './InventoryPageClient'
import { prisma } from '@/lib/prisma'

async function getItems() {
  const itemsRaw = await prisma.inventoryItem.findMany({
    select: { id: true, name: true, unit: true, quantity: true, lowStockThreshold: true },
    orderBy: { name: 'asc' }
  })
  const items = itemsRaw.map((it) => ({
    id: it.id,
    name: it.name,
    unit: it.unit,
    quantity: Number(it.quantity),
    lowStockThreshold: it.lowStockThreshold === null ? null : Number(it.lowStockThreshold)
  }))
  return items
}

export default async function AdminInventoryPage() {
  const items = await getItems()
  return <InventoryPageClient items={items} />
}

