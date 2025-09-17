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
  imageUrl?: string | null
}

interface Category {
  id: string
  name: string
  sortOrder: number
}

function getPlaceholderImage(category: string | null): string {
  const key = (category || '').toLowerCase()
  if (key.includes('coffee')) {
    return 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=800&auto=format&fit=crop'
  }
  if (key.includes('milk') || key.includes('tea')) {
    return 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop'
  }
  if (key.includes('pastr')) {
    return 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop'
  }
  if (key.includes('snack') || key.includes('food')) {
    return 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop'
  }
  return 'https://images.unsplash.com/photo-1551782450-17144c3a09a7?q=80&w=800&auto=format&fit=crop'
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

  const getMenuImagePath = (product: Product) => {
    const slug = product.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '_')
    return product.imageUrl || `/menu_${slug}.jpg`
  }

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
            <div className="hidden md:flex items-center gap-6 text-sm">
              <a href="#home" className="text-slate-700 hover:text-emerald-600 font-medium">Home</a>
              <a href="#offer" className="text-slate-700 hover:text-emerald-600 font-medium">Offer</a>
              <a href="#service" className="text-slate-700 hover:text-emerald-600 font-medium">Service</a>
              <a href="#menu" className="text-slate-700 hover:text-emerald-600 font-medium">Menu</a>
              <a href="#about" className="text-slate-700 hover:text-emerald-600 font-medium">About</a>
              <button
                onClick={() => router.push('/kiosk/menu')}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-emerald-700 transition-colors"
              >
                Order Now
              </button>
            </div>
            <div className="md:hidden">
              <button
                onClick={() => router.push('/kiosk/menu')}
                className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold"
              >
                Order
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero (Foodle-style) */}
      <div id="home" className="bg-rose-50">
        <div className="max-w-7xl mx-auto px-6 pt-10 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Copy */}
            <div>
              <div className="inline-flex items-center gap-2 text-sm text-rose-500 font-semibold mb-3">
                <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                All Fast Food is Available at <span className="underline decoration-rose-400">Foodle</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
                All Fast Food is
                <br className="hidden md:block" /> Available at
                <span className="text-rose-500"> SulitServe</span>
              </h2>
              <p className="text-slate-600 mb-6 max-w-xl">
                We are just a click away when you crave for delicious fast food and fresh café items.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/kiosk/menu')}
                  className="bg-rose-500 text-white px-6 py-3 rounded-full font-semibold shadow-sm hover:bg-rose-600 transition"
                >
                  Buy Now
                </button>
                <button
                  onClick={() => router.push('/kiosk/checkout')}
                  className="bg-white text-slate-700 px-5 py-3 rounded-full font-semibold border border-slate-200 hover:bg-slate-50 transition"
                >
                  How To Order
                </button>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop"
                alt="Delicious sandwich"
                className="w-full max-w-lg mx-auto drop-shadow-xl rounded-3xl"
              />
              <div className="hidden md:block absolute -top-4 -right-4 w-24 h-24 bg-rose-200 rounded-full blur-2xl opacity-70"></div>
            </div>
          </div>
        </div>

        {/* Features Bar */}
        <div className="px-6 -mt-8">
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-md border border-slate-100 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">🚚</div>
              <div>
                <div className="font-semibold text-slate-900">Fast Delivery</div>
                <div className="text-xs text-slate-500">Delivered to your home within 1-2 hours of ordering.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">🥗</div>
              <div>
                <div className="font-semibold text-slate-900">Fresh Food</div>
                <div className="text-xs text-slate-500">100% fresh; we don’t deliver stale food.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">💸</div>
              <div>
                <div className="font-semibold text-slate-900">Free Delivery</div>
                <div className="text-xs text-slate-500">Delivery is included for qualifying orders.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Best Delivered Categories */}
      <div id="offer" className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
            <div>
              <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                Best <span className="text-rose-500">Delivered</span> Categories
              </h3>
            </div>
            <p className="text-slate-500 text-sm max-w-md">
              Here are some of our most ordered categories. Order now and enjoy.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center hover:shadow-md transition">
              <div className="relative mx-auto w-40 h-40 mb-4">
                <img
                  src="https://images.unsplash.com/photo-1551782450-17144c3a09a7?q=80&w=800&auto=format&fit=crop"
                  alt="Chicken Burger"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
              <div className="font-semibold text-slate-900">Chicken Burger</div>
              <button
                onClick={() => router.push('/kiosk/menu')}
                className="mt-2 text-sm text-rose-500 font-semibold hover:underline"
              >
                Order Now →
              </button>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center hover:shadow-md transition">
              <div className="relative mx-auto w-40 h-40 mb-4">
                <img
                  src="https://images.unsplash.com/photo-1548365328-9f547fb09530?q=80&w=800&auto=format&fit=crop"
                  alt="Chicken Pizza"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
              <div className="font-semibold text-slate-900">Chicken Pizza</div>
              <button
                onClick={() => router.push('/kiosk/menu')}
                className="mt-2 text-sm text-rose-500 font-semibold hover:underline"
              >
                Order Now →
              </button>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center hover:shadow-md transition">
              <div className="relative mx-auto w-40 h-40 mb-4">
                <img
                  src="https://images.unsplash.com/photo-1585238342028-4bbc0f3a972e?q=80&w=800&auto=format&fit=crop"
                  alt="French Fries"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
              <div className="font-semibold text-slate-900">French Fries</div>
              <button
                onClick={() => router.push('/kiosk/menu')}
                className="mt-2 text-sm text-rose-500 font-semibold hover:underline"
              >
                Order Now →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Section (all products as minimalist cards) */}
      <div id="menu" className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-end justify-between">
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900">Our Regular Menu</h3>
            <div className="text-xs text-slate-500">{products.length} items</div>
          </div>

          {/* Category chips */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
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

      {/* Products Grid as minimalist cards */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl border border-slate-200 p-5 text-center hover:shadow-md transition">
                <div className="relative mx-auto w-40 h-40 mb-4">
                  <img
                    src={getMenuImagePath(product) || getPlaceholderImage(product.category)}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                </div>
                <div className="font-semibold text-slate-900">{product.name}</div>
                {product.category && (
                  <div className="text-xs text-slate-500 mt-1">{product.category}</div>
                )}
                <div className="text-sm text-emerald-600 mt-1 font-semibold">₱{(product.priceCents / 100).toFixed(2)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4 text-slate-300">☕</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No items available</h3>
            <p className="text-slate-500">No products are currently available.</p>
          </div>
        )}
      </div>

      {/* Service Section */}
      <div id="service" className="bg-emerald-50/50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h3 className="text-2xl font-extrabold text-slate-900 mb-6">Our Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="text-3xl mb-3">🏪</div>
              <div className="font-semibold text-slate-900 mb-1">Dine-in & Takeout</div>
              <div className="text-sm text-slate-600">Order at the kiosk or counter, pick up fast.</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="text-3xl mb-3">🛵</div>
              <div className="font-semibold text-slate-900 mb-1">Delivery</div>
              <div className="text-sm text-slate-600">Fast delivery partners in your area.</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="text-3xl mb-3">🎉</div>
              <div className="font-semibold text-slate-900 mb-1">Catering</div>
              <div className="text-sm text-slate-600">Events, meetings, and special occasions.</div>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div id="about" className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">About SulitServe</h3>
              <p className="text-slate-600 mb-4">We brew quality coffee and serve comfort food with a smile. Our minimalist kiosk-first experience lets customers order quickly while keeping things simple.</p>
              <div className="flex items-center gap-3">
                <button onClick={() => router.push('/kiosk/menu')} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700">Explore Menu</button>
                <a href="#service" className="px-6 py-3 rounded-xl font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50">Our Services</a>
              </div>
            </div>
            <div>
              <img src="https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop" alt="About image" className="rounded-2xl w-full object-cover" />
            </div>
          </div>
        </div>
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