'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  description?: string
  priceCents: number
  status: string
  category: string | null
  imageUrl?: string | null
  isOrderable?: boolean
}

interface Category {
  id: string
  name: string
}

function getMenuImagePath(product: Product): string {
  const slug = product.name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
  return product.imageUrl || `/menu_${slug}.jpg`
}

export default function CashierProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuRes, catRes] = await Promise.all([
          fetch('/api/menu'),
          fetch('/api/admin/categories')
        ])
        if (menuRes.ok) {
          const data = await menuRes.json()
          setProducts(data.data || [])
        }
        if (catRes.ok) {
          const cats = await catRes.json()
          setCategories(cats || [])
        }
      } catch (e) {
        console.error('Failed to load products:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter(p => {
      const inCategory = category === 'all' || (p.category || '').toLowerCase() === category.toLowerCase()
      const inSearch = !q || p.name.toLowerCase().includes(q)
      return inCategory && inSearch
    })
  }, [products, search, category])

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
  <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-md">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full px-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filtered.map((product, index) => (
          <div
            key={product.id}
            className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-6 text-center hover:shadow-lg transition-all duration-300 animate-in fade-in-0"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="relative mx-auto w-28 h-28 sm:w-36 sm:h-36 mb-4 overflow-hidden rounded-2xl bg-slate-50 flex items-center justify-center">
              <Image
                src={getMenuImagePath(product)}
                alt={product.name}
                width={144}
                height={144}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="font-semibold text-slate-900 mb-1">{product.name}</div>
            {product.category && (
              <div className="text-xs text-slate-500 mb-2">{product.category}</div>
            )}
            <div className="text-lg text-amber-600 font-bold">₱{(product.priceCents / 100).toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}