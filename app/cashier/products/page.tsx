'use client'

import { useEffect, useState } from 'react'

interface Product {
  id: string
  name: string
  description?: string
  priceCents: number
  status: string
  category: string | null
  hasRecipe: boolean
  canMake: number
  limitingIngredient?: string | null
  stockStatus: 'available' | 'low_stock' | 'out_of_stock'
  isOrderable: boolean
}

interface Category {
  id: string
  name: string
  sortOrder: number
}

export default function CashierProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'available' | 'all'>('available')
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/menu'),
        fetch('/api/admin/categories')
      ])

      if (productsRes.ok && categoriesRes.ok) {
        const productsData = await productsRes.json()
        const categoriesData = await categoriesRes.json()
        
        setProducts(productsData.data || [])
        setCategories(categoriesData)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStockInfo = (product: Product) => {
    switch (product.stockStatus) {
      case 'available':
        return {
          badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          icon: '✅',
          label: `Available (${product.canMake})`
        }
      case 'low_stock':
        return {
          badge: 'bg-amber-100 text-amber-700 border-amber-200',
          icon: '⚠️',
          label: `Low Stock (${product.canMake})`
        }
      case 'out_of_stock':
        return {
          badge: 'bg-red-100 text-red-700 border-red-200',
          icon: '❌',
          label: 'Out of Stock'
        }
    }
  }

  const filteredProducts = products.filter(product => {
    // Tab filter
    if (activeTab === 'available' && !product.isOrderable) return false
    
    // Category filter
    if (selectedCategory !== 'all' && product.category !== selectedCategory) return false
    
    // Search filter
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    
    return true
  })

  const availableProducts = products.filter(p => p.isOrderable)
  const totalProducts = products.length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Products Menu</h1>
              <p className="text-slate-600 mt-1">View menu items and stock availability</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-600">{availableProducts.length} available</span>
              </div>
              <div className="text-xs text-slate-400">
                {totalProducts} total products
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg mb-6">
            <button
              onClick={() => setActiveTab('available')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === 'available'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Available Products ({availableProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Products ({totalProducts})
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-slate-700">Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="text-sm text-slate-500">
                {filteredProducts.length} products
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const stockInfo = getStockInfo(product)
              return (
                <div key={product.id} className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 ${
                  product.stockStatus === 'out_of_stock' 
                    ? 'border-red-200 opacity-75' 
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'
                }`}>
                  {/* Product Image */}
                  <div className="relative">
                    <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      <div className={`text-4xl ${product.stockStatus === 'out_of_stock' ? 'text-slate-300' : 'text-slate-400'}`}>
                        {product.category === 'Coffee' ? '☕' :
                         product.category === 'Milk Tea & Tea' ? '🧋' :
                         product.category === 'Pastries & Baked Goods' ? '🥐' :
                         product.category === 'Snacks & Food' ? '🍕' : '🍽️'}
                      </div>
                      
                      {/* Stock Badge */}
                      <div className="absolute top-3 right-3">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${stockInfo.badge}`}>
                          {stockInfo.icon} {stockInfo.label}
                        </div>
                      </div>
                    </div>

                    {/* Out of Stock Overlay */}
                    {product.stockStatus === 'out_of_stock' && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                          Currently Unavailable
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-6">
                    <div className="mb-3">
                      <h3 className={`font-bold text-lg leading-tight ${
                        product.stockStatus === 'out_of_stock' ? 'text-slate-500' : 'text-slate-900'
                      }`}>
                        {product.name}
                      </h3>
                      {product.category && (
                        <div className="text-xs text-slate-500 mt-1">
                          {product.category}
                        </div>
                      )}
                    </div>

                    {product.description && (
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-2xl font-bold ${
                          product.stockStatus === 'out_of_stock' ? 'text-slate-400' : 'text-emerald-600'
                        }`}>
                          ₱{(product.priceCents / 100).toFixed(2)}
                        </div>
                        {product.limitingIngredient && product.stockStatus !== 'available' && (
                          <div className={`text-xs mt-1 ${
                            product.stockStatus === 'low_stock' ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {product.stockStatus === 'low_stock' ? 'Limited by:' : 'Out of:'} {product.limitingIngredient}
                          </div>
                        )}
                      </div>

                      <div className="text-center">
                        {product.isOrderable ? (
                          <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Orderable
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-500 text-sm font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Unavailable
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="text-6xl mb-4 text-slate-300">🔍</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No products found</h3>
            <p className="text-slate-600">
              {searchTerm ? `No products match "${searchTerm}"` :
               selectedCategory !== 'all' ? `No products in "${selectedCategory}" category` :
               activeTab === 'available' ? 'No products are currently available' :
               'No products have been added yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}