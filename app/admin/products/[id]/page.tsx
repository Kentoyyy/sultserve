import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

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
              <label className="block text-sm mb-1">Image</label>
              <div className="flex items-center gap-3">
                <Image src={product?.imageUrl || '/placeholder.png'} alt="preview" width={64} height={64} className="w-16 h-16 rounded object-cover border" />
                <input name="image_url" defaultValue={product?.imageUrl ?? ''} className="hidden" />
                <button
                  type="button"
                  className="rounded border px-3 py-2 hover:bg-neutral-50"
                  onClick={async (e) => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = async () => {
                      const file = input.files?.[0]
                      if (!file) return
                      const fd = new FormData()
                      fd.append('file', file)
                      const res = await fetch('/api/upload', { method: 'POST', body: fd })
                      const result = await res.json()
                      if (res.ok) {
                        const form = (e.currentTarget as HTMLButtonElement).form as HTMLFormElement
                        const hidden = form.querySelector('input[name="image_url"]') as HTMLInputElement
                        hidden.value = result.url
                        alert('Image uploaded! Click Save to apply.')
                      } else {
                        alert(result.error || 'Upload failed')
                      }
                    }
                    input.click()
                  }}
                >
                  Replace Image
                </button>
                {product?.imageUrl && (
                  <button
                    type="button"
                    className="rounded border px-3 py-2 hover:bg-neutral-50"
                    onClick={(e) => {
                      const form = (e.currentTarget as HTMLButtonElement).form as HTMLFormElement
                      const hidden = form.querySelector('input[name="image_url"]') as HTMLInputElement
                      hidden.value = ''
                      alert('Image will be removed after saving.')
                    }}
                  >
                    Remove Image
                  </button>
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Description</label>
            <textarea name="description" defaultValue={product?.description ?? ''} className="w-full rounded border px-3 py-2" rows={3} />
          </div>
          <div className="flex gap-2">
            <button className="rounded border px-4 py-2 hover:bg-neutral-50" type="submit">Save</button>
            <Link className="rounded border px-4 py-2 hover:bg-neutral-50" href="/admin/products">Back</Link>
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
          {groups.map((g: { id: string; name: string; type: string; required: boolean; maxSelect: number | null; options: { id: string; name: string; priceDeltaCents: number }[] }) => (
            <div key={g.id} className="border rounded p-3">
              <div className="font-medium mb-2">{g.name} <span className="text-xs text-neutral-500">({g.type}{g.required ? ', required' : ''}{g.maxSelect ? ', max ' + g.maxSelect : ''})</span></div>
              <ul className="text-sm">
                {g.options?.map((o: { id: string; name: string; priceDeltaCents: number }) => (
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


