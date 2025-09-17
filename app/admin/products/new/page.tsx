async function getCategories() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const res = await fetch(`${base}/api/admin/categories`, { cache: 'no-store' })
  if (!res.ok) return []
  const j = await res.json()
  return j.data ?? []
}

export default async function AdminProductNewPage() {
  const categories = await getCategories()

  async function create(formData: FormData) {
    'use server'
    const { prisma } = await import('@/lib/prisma')
    const name = String(formData.get('name') || '')
    const price = Math.round(Number(formData.get('price') || 0) * 100)
    const category_id = String(formData.get('category_id') || '') || null
    const status = String(formData.get('status') || 'available')
    const description = String(formData.get('description') || '') || null
    const image_url = String(formData.get('image_url') || '') || null
    await prisma.product.create({
      data: {
        name,
        priceCents: price,
        categoryId: category_id || undefined,
        status,
        description,
        imageUrl: image_url
      }
    })
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-semibold">Add Product</h1>
      <form action={create} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input name="name" className="w-full rounded border px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Price (₱)</label>
          <input type="number" step="0.01" name="price" className="w-full rounded border px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Category</label>
          <select name="category_id" className="w-full rounded border px-3 py-2">
            <option value="">None</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Status</label>
            <select name="status" className="w-full rounded border px-3 py-2">
              <option value="available">available</option>
              <option value="out_of_stock">out_of_stock</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Image URL</label>
            <input name="image_url" className="w-full rounded border px-3 py-2" placeholder="https://..." />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea name="description" className="w-full rounded border px-3 py-2" rows={3} />
        </div>
        <div className="flex gap-2">
          <button className="rounded border px-4 py-2 hover:bg-neutral-50" type="submit">Save</button>
          <a className="rounded border px-4 py-2 hover:bg-neutral-50" href="/admin/products">Cancel</a>
        </div>
      </form>
    </div>
  )
}


