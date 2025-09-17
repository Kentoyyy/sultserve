import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export default async function AdminProductEditPage({ params }: Params) {
  const { id } = await params
  
  const product = await prisma.product.findUnique({ where: { id } })
  const groups = await prisma.productOptionGroup.findMany({
    where: { productId: id },
    include: { options: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { createdAt: 'asc' }
  })

  async function save(formData: FormData) {
    'use server'
    const { prisma } = await import('@/lib/prisma')
    const payload = {
      name: String(formData.get('name') || ''),
      priceCents: Math.round(Number(formData.get('price') || 0) * 100),
      status: String(formData.get('status') || 'available'),
      description: String(formData.get('description') || '') || null,
      imageUrl: String(formData.get('image_url') || '') || null
    }
    await prisma.product.update({ where: { id }, data: payload })
  }

  async function addGroup(formData: FormData) {
    'use server'
    const { prisma } = await import('@/lib/prisma')
    await prisma.productOptionGroup.create({
      data: {
        productId: id,
        name: String(formData.get('group_name') || ''),
        type: String(formData.get('group_type') || 'single'),
        required: Boolean(formData.get('group_required')),
        maxSelect: formData.get('group_max') ? Number(formData.get('group_max')) : null
      }
    })
  }

  return (
    <div className="space-y-8">
      <div className="max-w-xl space-y-4">
        <h1 className="text-xl font-semibold">Edit Product</h1>
        <form action={save} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input name="name" defaultValue={product?.name ?? ''} className="w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Price (₱)</label>
            <input type="number" step="0.01" name="price" defaultValue={product ? (product.priceCents/100).toFixed(2) : ''} className="w-full rounded border px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Status</label>
              <select name="status" defaultValue={product?.status ?? 'available'} className="w-full rounded border px-3 py-2">
                <option value="available">available</option>
                <option value="out_of_stock">out_of_stock</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Image URL</label>
              <input name="image_url" defaultValue={product?.imageUrl ?? ''} className="w-full rounded border px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Description</label>
            <textarea name="description" defaultValue={product?.description ?? ''} className="w-full rounded border px-3 py-2" rows={3} />
          </div>
          <div className="flex gap-2">
            <button className="rounded border px-4 py-2 hover:bg-neutral-50" type="submit">Save</button>
            <a className="rounded border px-4 py-2 hover:bg-neutral-50" href="/admin/products">Back</a>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Option Groups</h2>
        <form action={addGroup} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input name="group_name" className="w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Type</label>
            <select name="group_type" className="w-full rounded border px-3 py-2">
              <option value="single">single</option>
              <option value="multiple">multiple</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Max Select</label>
            <input type="number" name="group_max" className="w-full rounded border px-3 py-2" />
            <label className="inline-flex items-center gap-2 mt-2 text-sm"><input type="checkbox" name="group_required" /> required</label>
          </div>
          <button className="rounded border px-4 py-2 hover:bg-neutral-50" type="submit">Add Group</button>
        </form>

        <div className="space-y-3">
          {groups.map((g: any) => (
            <div key={g.id} className="border rounded p-3">
              <div className="font-medium mb-2">{g.name} <span className="text-xs text-neutral-500">({g.type}{g.required ? ', required' : ''}{g.maxSelect ? ', max ' + g.maxSelect : ''})</span></div>
              <ul className="text-sm">
                {g.options?.map((o: any) => (
                  <li key={o.id} className="flex justify-between border-t first:border-t-0 py-1">
                    <span>{o.name}</span>
                    <span>+₱{(Number(o.priceDeltaCents)/100).toFixed(2)}</span>
                  </li>
                ))}
                {(!g.options || g.options.length === 0) && <li className="text-neutral-500">No options</li>}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


