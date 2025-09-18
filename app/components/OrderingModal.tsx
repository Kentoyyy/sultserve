'use client'

import { useState, useEffect } from 'react'

interface Product {
  id: string
  name: string
  description?: string
  priceCents: number
  status: string
  category: string | null
  imageUrl?: string | null
}

interface Category {
  id: string
  name: string
  sortOrder: number
}

interface CartItem {
  product: Product
  quantity: number
  size: string
}

interface OrderingModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function OrderingModal({ isOpen, onClose }: OrderingModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('cash')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  // Lock body scroll when modal is open and handle Escape to close
  useEffect(() => {
    if (!isOpen) return

    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = original
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, onClose])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [categoriesRes, menuRes] = await Promise.all([
        fetch('/api/admin/categories'),
        fetch('/api/menu')
      ])

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData)
      }

      if (menuRes.ok) {
        const menuData = await menuRes.json()
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

  const getProductImagePath = (product: Product) => {
    const slug = product.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '_')
    return product.imageUrl || `/menu_${slug}.jpg`
  }

  const getPlaceholderImage = (category: string | null): string => {
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

  const addToCart = (product: Product, size: string = 'M') => {
    const existingItem = cart.find(item => item.product.id === product.id && item.size === size)
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === product.id && item.size === size
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { product, quantity: 1, size }])
    }
  }

  const removeFromCart = (productId: string, size: string) => {
    setCart(cart.filter(item => !(item.product.id === productId && item.size === size)))
  }

  const updateQuantity = (productId: string, size: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, size)
    } else {
      setCart(cart.map(item => 
        item.product.id === productId && item.size === size
          ? { ...item, quantity: newQuantity }
          : item
      ))
    }
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.product.priceCents * item.quantity), 0)
  }

  const getTax = () => {
    return Math.round(getTotalPrice() * 0.1) // 10% tax
  }

  const getFinalTotal = () => {
    return getTotalPrice() + getTax()
  }

  const isInCart = (productId: string, size: string) => {
    return cart.some(item => item.product.id === productId && item.size === size)
  }

  const getCartQuantity = (productId: string, size: string) => {
    const item = cart.find(item => item.product.id === productId && item.size === size)
    return item ? item.quantity : 0
  }

  const placeOrder = async () => {
    if (cart.length === 0) return

    try {
      const orderItems = cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.priceCents,
        specialNotes: `Size: ${item.size}`
      }))

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderItems,
          paymentMethod: selectedPaymentMethod,
          totalAmount: getFinalTotal(),
          orderType: 'kiosk'
        })
      })

      if (!response.ok) throw new Error('Failed to create order')

      const result = await response.json()
      if (!result?.ok) throw new Error(result?.error || 'Failed to create order')

      const orderId = result.order.id

      // For online methods, initiate PayMongo checkout and redirect
      if (['card', 'ewallet', 'gcash'].includes(selectedPaymentMethod)) {
        const checkoutResp = await fetch('/api/payments/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, paymentMethod: selectedPaymentMethod })
        })
        if (!checkoutResp.ok) {
          const text = await checkoutResp.text()
          throw new Error(text || 'Failed to start checkout')
        }
        const data = await checkoutResp.json()
        if (!data?.checkoutUrl) {
          console.error('Checkout init failed:', data)
          throw new Error(data?.error || 'No checkout URL returned')
        }
        window.location.href = data.checkoutUrl
        return
      }

      // Cash fallback - simple success message
      alert(`Order ${result.order.orderNumber} placed. Pay at counter.`)
      onClose()
    } catch (err) {
      console.error('Error placing order:', err)
      alert('Failed to place order. Please try again.')
    }
  }

  if (!isOpen) return null

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div aria-hidden className="absolute inset-0 bg-white/40 backdrop-blur-md" onClick={onClose} />
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl w-full max-w-6xl h-[90vh] flex overflow-hidden shadow-2xl relative">
        {/* Left Panel - Menu */}
        <div className="flex-1 p-8 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Choose Your Order</h2>
              <p className="text-slate-500 text-sm mt-1">Select items from our menu</p>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Categories */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-900">Choose Category</h3>
              <span className="text-sm text-slate-500">{categories.length}+ Category</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  selectedCategory === 'all'
                    ? 'bg-rose-500 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🍔 All Items
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                    selectedCategory.toLowerCase() === category.name.toLowerCase()
                      ? 'bg-rose-500 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {category.name === 'Coffee' && '☕'}
                  {category.name === 'Tea' && '🍵'}
                  {category.name === 'Pastries' && '🥐'}
                  {category.name === 'Snacks' && '🍟'}
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:border-rose-200 transition-all group">
                  <div className="relative mb-4">
                    <img
                      src={getProductImagePath(product) || getPlaceholderImage(product.category)}
                      alt={product.name}
                      className="w-full h-40 object-cover rounded-xl"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-xl transition-all"></div>
                  </div>
                  
                  <h4 className="font-semibold text-slate-900 mb-2 text-lg">{product.name}</h4>
                  <p className="text-lg font-bold text-slate-900 mb-4">₱{(product.priceCents / 100).toFixed(2)}</p>
                  
                  {/* Size Options */}
                  <div className="flex gap-2 mb-4">
                    {['S', 'M', 'L'].map((size) => (
                      <button
                        key={size}
                        className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                          isInCart(product.id, size)
                            ? 'bg-rose-500 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                        onClick={() => addToCart(product, size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => addToCart(product, 'M')}
                    className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
                      isInCart(product.id, 'M')
                        ? 'bg-rose-500 text-white shadow-lg'
                        : 'bg-slate-100 text-slate-700 hover:bg-rose-500 hover:text-white hover:shadow-lg'
                    }`}
                  >
                    {isInCart(product.id, 'M') ? 'Added ✓' : 'Add to Cart'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - Order Bill */}
        <div className="w-80 bg-slate-50 border-l border-slate-200 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Order Bill</h3>
              <p className="text-sm text-slate-500">{new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}</p>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                  </svg>
                </div>
                <p className="text-slate-500 font-medium">Your cart is empty</p>
                <p className="text-slate-400 text-sm mt-1">Add items to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item, index) => (
                  <div key={`${item.product.id}-${item.size}-${index}`} className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <img
                        src={getProductImagePath(item.product) || getPlaceholderImage(item.product.category)}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 text-sm">{item.product.name}</h4>
                        <p className="text-slate-500 text-xs">Size: {item.size} • ₱{(item.product.priceCents / 100).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                          className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                          className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id, item.size)}
                        className="text-slate-700 hover:text-slate-900 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          {cart.length > 0 && (
            <div className="mt-6 space-y-6">
              <div className="bg-white rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Sub Total</span>
                  <span className="font-medium">₱{(getTotalPrice() / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tax 10% (VAT Included)</span>
                  <span className="font-medium">₱{(getTax() / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-3">
                  <span>Total</span>
                  <span className="text-amber-700">₱{(getFinalTotal() / 100).toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Payment Method</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cash', label: 'Cash', icon: '💰' },
                    { id: 'card', label: 'Card', icon: '💳' },
                    { id: 'ewallet', label: 'E-Wallet', icon: '📱' }
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        selectedPaymentMethod === method.id
                          ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="text-2xl mb-2">{method.icon}</div>
                      <div className="text-xs font-medium">{method.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Place Order Button */}
              <button onClick={placeOrder} className="w-full bg-rose-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-rose-600 transition-all shadow-lg hover:shadow-xl">
                Place Order
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}