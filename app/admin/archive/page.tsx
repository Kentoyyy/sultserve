import { ArchivePageClient } from './ArchivePageClient'
import { prisma } from '@/lib/prisma'

async function getArchivedProducts() {
  const rows = await prisma.product.findMany({
    where: { isArchived: true },
    include: { category: { select: { name: true } } },
    orderBy: { archivedAt: 'desc' }
  })
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category?.name ?? null,
    priceCents: p.priceCents,
    status: p.status,
    archivedAt: p.archivedAt
  }))
}

export default async function AdminArchivePage() {
  const archivedProducts = await getArchivedProducts()
  return <ArchivePageClient archivedProducts={archivedProducts} />
}


