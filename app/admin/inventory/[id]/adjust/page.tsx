import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export default async function AdjustStockPage({ params }: Params) {
  const { id } = await params
  async function adjust(formData: FormData) {
    'use server'
    const change = Number(formData.get('change') || 0)
    const reason = String(formData.get('reason') || 'manual_adjustment')
    await prisma.$transaction(async (tx) => {
      await tx.inventoryItem.update({
        where: { id },
        data: { quantity: { increment: change } }
      })
      await tx.stockMovement.create({
        data: { inventoryItemId: id, change, reason }
      })
    })
    redirect('/admin/inventory')
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-xl font-semibold">Adjust Stock</h1>
      <form action={adjust} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Change</label>
          <input type="number" step="any" name="change" className="w-full rounded border px-3 py-2" placeholder="e.g. 10 or -5" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Reason</label>
          <input name="reason" className="w-full rounded border px-3 py-2" defaultValue="manual_adjustment" />
        </div>
        <div className="flex gap-2">
          <button className="rounded border px-4 py-2 hover:bg-neutral-50" type="submit">Apply</button>
          <a className="rounded border px-4 py-2 hover:bg-neutral-50" href="/admin/inventory">Cancel</a>
        </div>
      </form>
    </div>
  )
}


