import { prisma } from '@/lib/prisma'
export default function AdminInventoryNewPage() {
  async function createItem(formData: FormData) {
    'use server'
    const name = String(formData.get('name') || '')
    const unit = String(formData.get('unit') || '')
    const quantity = Number(formData.get('quantity') || 0)
    const low = formData.get('low_stock_threshold') ? Number(formData.get('low_stock_threshold')) : null
    await prisma.inventoryItem.create({ data: { name, unit, quantity, lowStockThreshold: low } })
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-xl font-semibold">Add Inventory Item</h1>
      <form action={createItem} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input name="name" className="input" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Unit</label>
          <input name="unit" className="input" placeholder="pcs / L / kg" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Quantity</label>
            <input type="number" step="any" name="quantity" defaultValue={0} className="input" />
          </div>
          <div>
            <label className="block text-sm mb-1">Threshold (Low Stock at or below)</label>
            <input type="number" step="any" name="low_stock_threshold" className="input" placeholder="e.g. 5" />
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn" type="submit">Save</button>
          <a className="btn" href="/admin/inventory">Cancel</a>
        </div>
      </form>
    </div>
  )
}


