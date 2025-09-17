'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface CartItem {
  id: string
  name: string
  priceCents: number
  quantity: number
}

export default function KioskMenuPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/kiosk/products')
      if (response.ok) {
        const result = await response.json()
        setProducts(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      if (response.ok) {
        const result = await response.json()
        setCategories(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const filteredProducts = selectedCategory 
    ? products.filter((p: any) => p.category === selectedCategory)
    : products

  const availableProducts = filteredProducts.filter((p: any) => 
    p.status === 'available' && (!p.hasRecipe || p.canMake > 0)
  )

  const addToCart = (product: any) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id)
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        return [...prevCart, {
          id: product.id,
          name: product.name,
          priceCents: product.priceCents,
          quantity: 1
        }]
      }
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === productId)
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(item =>
          item.id === productId 
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      } else {
        return prevCart.filter(item => item.id !== productId)
      }
    })
  }

  const getCartItemQuantity = (productId: string) => {
    const item = cart.find(item => item.id === productId)
    return item ? item.quantity : 0
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.priceCents * item.quantity), 0)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const proceedToCheckout = () => {
    if (cart.length === 0) return
    
    // Store cart in localStorage
    localStorage.setItem('kioskCart', JSON.stringify(cart))
    router.push('/kiosk/checkout')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/kiosk')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="w-8 h-8 bg-amber-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Menu</h1>
              <p className="text-sm text-slate-500">Choose your favorites</p>
            </div>
          </div>
          
          {/* Cart Summary */}
          {cart.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-lg font-semibold text-slate-900">
                  ₱{(getTotalPrice() / 100).toFixed(2)}
                </div>
                <div className="text-sm text-slate-500">
                  {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}
                </div>
              </div>
              <button 
                onClick={proceedToCheckout}
                className="bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-700 transition-colors shadow-sm"
              >
                Continue →
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Category Filters */}
          <div className="mb-8">
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors border ${
                  selectedCategory === '' 
                    ? 'bg-amber-600 text-white border-amber-600' 
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                All Items
                <span className="ml-2 text-xs opacity-75">({availableProducts.length})</span>
              </button>
              {categories.map((category: any) => {
                const categoryProducts = products.filter((p: any) => 
                  p.category === category.name && 
                  p.status === 'available' && 
                  (!p.hasRecipe || p.canMake > 0)
                )
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors border ${
                      selectedCategory === category.name 
                        ? 'bg-amber-600 text-white border-amber-600' 
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {category.name}
                    <span className="ml-2 text-xs opacity-75">({categoryProducts.length})</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableProducts.map((product: any) => {
              const cartQuantity = getCartItemQuantity(product.id)
              return (
                <div key={product.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-amber-200 transition-colors shadow-sm">
                  {/* Product Image */}
                  <div className="h-40 bg-slate-50 flex items-center justify-center border-b border-slate-100">
                    <div className="text-4xl">
                      {product.category === 'Coffee' ? '☕' : 
                       product.category === 'Milk Tea & Tea' ? '🧋' :
                       product.category === 'Pastries & Baked Goods' ? '🥐' :
                       product.category === 'Snacks & Food' ? '🍟' : '🍽️'}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-5">
                    <div className="mb-4">
                      <h3 className="font-semibold text-slate-900 text-lg mb-1">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-slate-500 line-clamp-2">{product.description}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-5">
                      <span className="text-xl font-bold text-slate-900">
                        ₱{(product.priceCents / 100).toFixed(2)}
                      </span>
                      
                      {product.hasRecipe && product.canMake < 10 && (
                        <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                          {product.canMake} left
                        </span>
                      )}
                    </div>

                    {/* Add to Cart Controls */}
                    {cartQuantity === 0 ? (
                      <button
                        onClick={() => addToCart(product)}
                        className="w-full bg-amber-600 text-white py-3 rounded-lg font-medium hover:bg-amber-700 transition-colors"
                      >
                        Add to Cart
                      </button>
                    ) : (
                      <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="w-9 h-9 bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-300 transition-colors"
                        >
                          −
                        </button>
                        <span className="text-lg font-semibold text-slate-900 min-w-[2rem] text-center">
                          {cartQuantity}
                        </span>
                        <button
                          onClick={() => addToCart(product)}
                          disabled={product.hasRecipe && cartQuantity >= product.canMake}
                          className="w-9 h-9 bg-amber-600 text-white rounded-lg flex items-center justify-center hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {availableProducts.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="text-4xl mb-4 text-slate-300">☕</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No items available</h3>
              <p className="text-slate-500 text-sm">
                {selectedCategory ? 
                  `No available items in "${selectedCategory}" category right now.` : 
                  'No items are currently available. Please check back later.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Cart Button for Mobile */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6 md:hidden z-50">
          <button 
            onClick={proceedToCheckout}
            className="bg-amber-600 text-white p-4 rounded-xl shadow-lg hover:bg-amber-700 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6.5M7 13h10M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            {getTotalItems()}
          </button>
        </div>
      )}
    </div>
  )
}


