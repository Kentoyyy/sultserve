'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

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

export default function Home() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour12: true,
        hour: '2-digit',
        minute: '2-digit'
      }))
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [categoriesRes, menuRes] = await Promise.all([
        fetch('/api/admin/categories'),
        fetch('/api/menu')
      ])

      if (categoriesRes.ok && menuRes.ok) {
        const categoriesData = await categoriesRes.json()
        const menuData = await menuRes.json()
        
        setCategories(categoriesData)
        setProducts(menuData.data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category?.toLowerCase() === selectedCategory.toLowerCase())

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">SulitServe Café</h1>
                <p className="text-sm text-slate-500">Fresh Coffee • Delicious Pastries • Quality Service</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right hidden md:block">
                <div className="text-lg font-semibold text-slate-900">{currentTime}</div>
                <div className="text-sm text-slate-500">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <button
                onClick={() => router.push('/kiosk/menu')}
                className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Start Ordering
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">Welcome to Our Café</h2>
            <p className="text-xl text-emerald-100 mb-6">Discover our freshly brewed coffee and delicious treats</p>
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm">
              <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></span>
              Now Open • Fresh Daily
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-[73px] z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              All Items
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory.toLowerCase() === category.name.toLowerCase()
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 group ${
                product.stockStatus === 'out_of_stock' 
                  ? 'border-red-200 opacity-75' 
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'
              }`}>
                {/* Stock Status Badge */}
                <div className="relative">
                  <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative">
                    <div className={`text-4xl ${product.stockStatus === 'out_of_stock' ? 'text-slate-300' : 'text-slate-400'}`}>
                      {product.category === 'Coffee' ? '☕' :
                       product.category === 'Milk Tea & Tea' ? '🧋' :
                       product.category === 'Pastries & Baked Goods' ? '🥐' :
                       product.category === 'Snacks & Food' ? '🍕' : '🍽️'}
                    </div>
                    
                    {/* Stock Status Badge */}
                    <div className="absolute top-3 right-3">
                      {product.stockStatus === 'available' && (
                        <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                          Available
                        </div>
                      )}
                      {product.stockStatus === 'low_stock' && (
                        <div className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                          Low Stock ({product.canMake} left)
                        </div>
                      )}
                      {product.stockStatus === 'out_of_stock' && (
                        <div className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                          Out of Stock
                        </div>
                      )}
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
                </div>
                
                {/* Product Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-semibold text-lg leading-tight transition-colors ${
                      product.stockStatus === 'out_of_stock' 
                        ? 'text-slate-500' 
                        : 'text-slate-900 group-hover:text-emerald-600'
                    }`}>
                      {product.name}
                    </h3>
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
                      {product.category && (
                        <div className="text-sm text-slate-500 mt-1">
                          {product.category}
                        </div>
                      )}
                      {product.limitingIngredient && product.stockStatus === 'low_stock' && (
                        <div className="text-xs text-amber-600 mt-1">
                          Limited by: {product.limitingIngredient}
                        </div>
                      )}
                      {product.limitingIngredient && product.stockStatus === 'out_of_stock' && (
                        <div className="text-xs text-red-600 mt-1">
                          Out of: {product.limitingIngredient}
                        </div>
                      )}
                    </div>
                    
                    {/* Order Status */}
                    <div className="text-center">
                      {product.isOrderable ? (
                        <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Can Order
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
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4 text-slate-300">☕</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No items available</h3>
            <p className="text-slate-500">
              {selectedCategory === 'all' 
                ? 'No products are currently available.' 
                : `No items in "${selectedCategory}" category right now.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Ready to Order?</h3>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
              Browse our menu, add your favorites to cart, and enjoy fresh café items made just for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/kiosk/menu')}
                className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Order Now
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="bg-slate-100 text-slate-700 px-8 py-4 rounded-xl font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Staff Portal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div>
                <div className="font-semibold">SulitServe Café</div>
                <div className="text-sm text-slate-400">Quality Coffee & Fresh Pastries</div>
              </div>
            </div>
            <div className="text-sm text-slate-400 text-center md:text-right">
              <div>Operating Hours: 6:00 AM - 10:00 PM</div>
              <div className="mt-1">© 2024 SulitServe Café. All rights reserved.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}