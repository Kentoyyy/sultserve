'use client'

// import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
// import OrderingModal from '@/components/OrderingModal'

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

interface BestSeller {
  id: string
  name: string
  description?: string
  priceCents: number
  imageUrl?: string | null
  status: string
  category: string
  totalSold: number
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
  // const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  // const [currentTime, setCurrentTime] = useState('')
  // const [lastUpdate, setLastUpdate] = useState<number>(Date.now())
  const [lastServerUpdate, setLastServerUpdate] = useState<number>(0)
  const [lastBestSellersUpdate, setLastBestSellersUpdate] = useState<number>(0)
  const [isOrderingModalOpen, setIsOrderingModalOpen] = useState(false)
  const [cart, setCart] = useState<Array<{product: Product, quantity: number, size: string}>>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('cash')
  const [currentStep, setCurrentStep] = useState<'menu' | 'checkout' | 'confirmation' | 'customize' | 'track' | 'receipt'>('menu')
  const [orderNumber, setOrderNumber] = useState<string>('')
  // const [lastOrderId, setLastOrderId] = useState<string>('')
  const [lastReceipt, setLastReceipt] = useState<{
    items: Array<{ name: string, quantity: number, price: number, total: number }>
    subtotal: number
    tax: number
    total: number
    paymentMethod: string
  } | null>(null)
  const [orderStatus, setOrderStatus] = useState<'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'>('pending')
  const [trackingInterval, setTrackingInterval] = useState<NodeJS.Timeout | null>(null)

  // Smooth scroll function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  useEffect(() => {
    const updateTime = () => {
      // setCurrentTime(new Date().toLocaleTimeString('en-US', {
      //   hour12: true,
      //   hour: '2-digit',
      //   minute: '2-digit'
      // }))
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchData()
    
    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout, forcing page to load')
        setLoading(false)
      }
    }, 10000) // 10 second timeout
    
    return () => clearTimeout(timeout)
  }, [loading])

  // Handle return from PayMongo success URL
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const paid = params.get('paid')
    const orderId = params.get('orderId')
    const orderNumber = params.get('orderNumber')
    if (paid === '1' && orderId && orderNumber) {
      // Clear query params from URL without reload
      const url = new URL(window.location.href)
      url.search = ''
      window.history.replaceState({}, '', url.toString())

      // Update payment status to paid since payment was successful
      // But keep order status as pending for cashier to manage
      fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          paymentStatus: 'paid',
          eventType: 'manual_confirmation'
        })
      }).catch(error => {
        console.error('Failed to confirm payment:', error)
      })

      // Open confirmation step and start tracking
      // These setters exist earlier in this component
      setOrderNumber(orderNumber)
      // setLastOrderId(orderId)
      setOrderStatus('pending')
      setIsOrderingModalOpen(true)
      setCurrentStep('confirmation')
      startOrderTracking(orderId)

      // Load order details for accurate receipt later
      ;(async () => {
        try {
          const res = await fetch(`/api/orders?orderId=${orderId}`)
          if (res.ok) {
            const data = await res.json()
            if (data?.ok) {
              const items = (data.order.items || []).map((i: { productName: string; quantity: number; unitPriceCents: number; totalCents: number }) => ({
                name: i.productName,
                quantity: i.quantity,
                price: i.unitPriceCents / 100,
                total: i.totalCents / 100,
              }))
              const subtotal = items.reduce((s: number, it: { total: number }) => s + it.total, 0)
              const total = data.order.totalCents / 100
              const tax = Math.max(0, total - subtotal)
              setLastReceipt({ items, subtotal, tax, total, paymentMethod: data.order.paymentMethod || 'online' })
            }
          }
        } catch (e: unknown) {
          console.error('Error loading receipt:', e)
          // ignore
        }
      })()
    }
  }, [])

  // Real-time updates - check for product changes every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [menuRes, bestSellersRes] = await Promise.all([
          fetch('/api/menu'),
          fetch('/api/bestsellers')
        ])
        
        if (menuRes.ok) {
          const menuData = await menuRes.json()
          const newProducts = menuData.data || []
          const serverTimestamp = menuData.lastModified || 0
          
          // Check if server data is newer than our last update
          if (serverTimestamp > lastServerUpdate) {
            setProducts(newProducts)
            // setLastUpdate(Date.now())
            setLastServerUpdate(serverTimestamp)
          }
        }

        if (bestSellersRes.ok) {
          const bestSellersData = await bestSellersRes.json()
          const newBestSellers = bestSellersData.data || []
          const bestSellersTimestamp = bestSellersData.lastModified || 0
          
          // Check if best sellers data is newer than our last update
          if (bestSellersTimestamp > lastBestSellersUpdate) {
            setBestSellers(newBestSellers)
            setLastBestSellersUpdate(bestSellersTimestamp)
          }
        } else {
          console.warn('Best sellers polling failed, keeping existing data')
        }
      } catch (error) {
        console.error('Error checking for updates:', error)
      }
    }, 3000) // Check every 3 seconds

    return () => clearInterval(interval)
  }, [products, bestSellers, lastServerUpdate, lastBestSellersUpdate])

  // Cleanup tracking interval on unmount
  useEffect(() => {
    return () => {
      if (trackingInterval) {
        clearInterval(trackingInterval)
      }
    }
  }, [trackingInterval])

  // Disable body scroll when modal is open and close on Escape
  useEffect(() => {
    const originalOverflow = typeof window !== 'undefined' ? document.body.style.overflow : ''

    if (isOrderingModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = originalOverflow
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOrderingModalOpen(false)
        resetOrder()
      }
    }

    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [isOrderingModalOpen, resetOrder])

  const fetchData = async () => {
    try {
      const [categoriesRes, menuRes, bestSellersRes] = await Promise.all([
        fetch('/api/admin/categories'),
        fetch('/api/menu'),
        fetch('/api/bestsellers')
      ])

      // Handle categories
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData)
      }

      // Handle menu
      if (menuRes.ok) {
        const menuData = await menuRes.json()
        setProducts(menuData.data || [])
        setLastServerUpdate(menuData.lastModified || 0)
      }

      // Handle best sellers (optional - don't block loading if this fails)
      if (bestSellersRes.ok) {
        const bestSellersData = await bestSellersRes.json()
        setBestSellers(bestSellersData.data || [])
        setLastBestSellersUpdate(bestSellersData.lastModified || 0)
      } else {
        console.warn('Best sellers API failed, using empty array')
        setBestSellers([])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      // Set empty arrays as fallback
      setCategories([])
      setProducts([])
      setBestSellers([])
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

  const getBestSellerImagePath = (bestSeller: BestSeller) => {
    const slug = bestSeller.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '_')
    return bestSeller.imageUrl || `/menu_${slug}.jpg`
  }

  // Cart functions
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id)
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { product, quantity: 1, size: 'Regular' }])
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(cart.map(item => 
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ))
    }
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.product.priceCents * item.quantity), 0)
  }

  const getTax = () => {
    return Math.round(getTotalPrice() * 0.12) // 12% VAT
  }

  const getFinalTotal = () => {
    return getTotalPrice() + getTax()
  }

  const isInCart = (productId: string) => {
    return cart.some(item => item.product.id === productId)
  }

  const placeOrder = async () => {
    if (cart.length === 0) return

    try {
      // Prepare order data
      const orderItems = cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.priceCents,
        specialNotes: `Regular size`
      }))

      // Create real order in database
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: orderItems,
          paymentMethod: selectedPaymentMethod,
          totalAmount: getFinalTotal(),
          orderType: 'kiosk'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create order')
      }

      const result = await response.json()
      
      if (result.ok) {
        // If online payment, initiate PayMongo checkout and redirect
        if (['card', 'ewallet', 'gcash'].includes(selectedPaymentMethod)) {
          const orderId = result.order.id
          // setLastOrderId(orderId)
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

        // Cash or offline methods: keep existing behavior
        setOrderNumber(result.order.orderNumber)
        setOrderStatus('pending')
        setCurrentStep('confirmation')
        startOrderTracking(result.order.id)
      } else {
        throw new Error(result.error || 'Failed to create order')
      }

    } catch (error) {
      console.error('Error placing order:', error)
      alert('Failed to place order. Please try again.')
    }
  }

  const startOrderTracking = (orderId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/orders?orderId=${orderId}`)
        if (response.ok) {
          const result = await response.json()
          if (result.ok) {
            setOrderStatus(result.order.status)
            
            // If order is completed, go to receipt
            if (result.order.status === 'completed') {
              clearInterval(interval)
              setTrackingInterval(null)
              setCurrentStep('receipt')
            }
            // If order is cancelled, stay on track step
            if (result.order.status === 'cancelled') {
              clearInterval(interval)
              setTrackingInterval(null)
              setCurrentStep('track')
            }
          }
        }
      } catch (error) {
        console.error('Error tracking order:', error)
      }
    }, 3000) // Check every 3 seconds

    // Store interval ID for cleanup
    setTrackingInterval(interval)
    return interval
  }

  const resetOrder = useCallback(() => {
    // Clear tracking interval if active
    if (trackingInterval) {
      clearInterval(trackingInterval)
      setTrackingInterval(null)
    }
    
    setCart([])
    setCurrentStep('menu')
    setOrderNumber('')
    setOrderStatus('pending')
    setSelectedPaymentMethod('cash')
  }, [trackingInterval])

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
    <div className="min-h-screen bg-slate-50 scroll-smooth">
      <style jsx global>{`
        /* Custom Scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #f59e0b, #d97706);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #d97706, #b45309);
        }
        /* Firefox */
        * {
          scrollbar-width: thin;
          scrollbar-color: #f59e0b #f1f5f9;
        }
      `}</style>
      {/* Header - Minimalist Supabase Style */}
      <div className="bg-white/80 backdrop-blur-md border-b border-amber-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo (use favicon image) */}
            <div className="flex items-center gap-3">
              <Image src="/images/landing_image.png" alt="SulitServe logo" width={32} height={32} className="w-8 h-8 rounded-lg object-cover shadow-sm" />
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-slate-900">SulitServe</h1>
                <p className="text-xs text-amber-600 font-medium">Café</p>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <button 
                onClick={() => scrollToSection('home')}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-all duration-300 hover:scale-105"
              >
                Bahay
              </button>
              <button 
                onClick={() => scrollToSection('offer')}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-all duration-300 hover:scale-105"
              >
                Pinakasikat
              </button>
              <button 
                onClick={() => scrollToSection('menu')}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-all duration-300 hover:scale-105"
              >
                Menu
              </button>
              <button 
                onClick={() => scrollToSection('service')}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-all duration-300 hover:scale-105"
              >
                Serbisyo
              </button>
              <button 
                onClick={() => scrollToSection('about')}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-all duration-300 hover:scale-105"
              >
                Tungkol
              </button>
            </nav>

            {/* CTA Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => scrollToSection('how-to-order')}
                className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-all duration-300 hover:scale-105"
              >
                Paano Mag-order
              </button>
              <button
                onClick={() => setIsOrderingModalOpen(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Mag-order
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero - White with Coffee Theme */}
      <div id="home" className="bg-white">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Copy */}
            <div>
              <div className="inline-flex items-center gap-2 text-sm text-amber-600 font-medium mb-4">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                Dito, Laging Sulit ang Iyong Kape Break
              </div>
              <h2 className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
                Sarap ng Kape
                <br className="hidden md:block" /> Hatid
                <span className="text-amber-600"> SulitServe</span>
              </h2>
              <p className="text-slate-600 mb-8 max-w-xl text-lg leading-relaxed">
                Ginagawa naming espesyal ang bawat kape at pastry. Sulit ang lasa, sulit ang karanasan.
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={() => scrollToSection('how-to-order')}
                  className="bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-amber-700 hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                >
                  Paano Mag-order
                </button>
                <button
                  onClick={() => scrollToSection('menu')}
                  className="text-amber-600 hover:text-amber-700 font-medium flex items-center gap-2 transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                >
                  Tingnan ang Menu
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <Image
                src="/images/landing_image.png"
                alt="Delicious coffee and pastries"
                width={600}
                height={400}
                className="w-full max-w-md sm:max-w-lg mx-auto drop-shadow-2xl rounded-3xl"
              />
              <div className="hidden md:block absolute -top-4 -right-4 w-20 sm:w-24 h-20 sm:h-24 bg-amber-200 rounded-full blur-2xl opacity-60"></div>
            </div>
          </div>
        </div>

        {/* Features Bar */}
        <div className="px-6 -mt-12">
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg border border-amber-100 p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">🚚</div>
              <div>
                <div className="font-semibold text-slate-900 mb-1">Mabilis na Hatid</div>
                <div className="text-sm text-slate-500">Ihahatid sa iyong bahay sa loob ng 1-2 oras pagkatapos umorder.</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">☕</div>
              <div>
                <div className="font-semibold text-slate-900 mb-1">Sariwang Kape</div>
                <div className="text-sm text-slate-500">100% sariwa; gumagamit lang kami ng de-kalidad na beans.</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">💳</div>
              <div>
                <div className="font-semibold text-slate-900 mb-1">Madaling Pagbayad</div>
                <div className="text-sm text-slate-500">Bayaran gamit ang cash, card, o digital wallet.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Best Sellers */}
      <div id="offer" className="bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Pinaka<span className="text-amber-600">sikat</span>
            </h3>
            <p className="text-slate-600 max-w-2xl mx-auto flex items-center justify-center gap-2">
              Ang aming pinakasikat na produkto ayon sa kategorya. Real-time na update batay sa aktwal na benta.
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" title="Live best sellers"></span>
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bestSellers.length > 0 ? (
              bestSellers.slice(0, 3).map((bestSeller, index) => (
                <div key={bestSeller.id} className="bg-white rounded-2xl border border-amber-100 p-6 text-center hover:shadow-lg hover:border-amber-200 transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-2">
                  <div className="relative mx-auto w-28 h-28 sm:w-40 sm:h-40 mb-4">
                    <Image
                      src={getBestSellerImagePath(bestSeller) || getPlaceholderImage(bestSeller.category)}
                      alt={bestSeller.name}
                      width={160}
                      height={160}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                    {bestSeller.totalSold > 0 && (
                      <div className="absolute -top-2 -right-2 bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        #{index + 1}
                      </div>
                    )}
                  </div>
                  {bestSeller.totalSold > 0 && (
                    <div className="text-xs text-slate-500 mb-3">{bestSeller.totalSold} sold</div>
                  )}
                  <button
                    onClick={() => setIsOrderingModalOpen(true)}
                    className="text-sm text-amber-600 font-semibold hover:text-amber-700 hover:underline"
                  >
                    Umorder →
                  </button>
                </div>
              ))
            ) : (
              // Fallback cards when no best sellers data
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-white rounded-2xl border border-amber-100 p-6 text-center hover:shadow-lg transition">
                  <div className="relative mx-auto w-28 h-28 sm:w-40 sm:h-40 mb-4 bg-amber-50 rounded-2xl flex items-center justify-center">
                    <div className="text-4xl text-amber-300">☕</div>
                  </div>
                  <div className="font-semibold text-slate-900 mb-1">Loading...</div>
                  <div className="text-xs text-slate-500 mb-2">Best Seller</div>
                  <div className="text-lg text-amber-600 font-bold mb-2">₱0.00</div>
                  <button
                    onClick={() => setIsOrderingModalOpen(true)}
                    className="text-sm text-amber-600 font-semibold hover:text-amber-700 hover:underline"
                  >
                    Order Now →
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>


      {/* Menu Section */}
      <div id="menu" className="bg-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-12 left-6 w-20 h-20 sm:w-32 sm:h-32 bg-amber-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-12 right-6 w-28 h-28 sm:w-40 sm:h-40 bg-amber-300 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36 sm:w-60 sm:h-60 bg-amber-100 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 py-16 relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-amber-600 font-medium mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Aming Menu
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Tuklasin ang Aming <span className="text-amber-600">Masarap</span> na Handog</h3>
            <div className="flex items-center justify-center gap-2 text-slate-500">
              <span className="text-lg">{products.length} mga item na available</span>
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" title="Live updates"></span>
              <span className="text-amber-600 font-medium">Live</span>
            </div>
          </div>

          {/* Category chips */}
          <div className="flex items-center justify-center gap-3 overflow-x-auto mb-12">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 hover:scale-105 ${
                selectedCategory === 'all'
                  ? 'bg-amber-100 text-amber-700 border border-amber-200 shadow-lg'
                  : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50 border border-transparent hover:shadow-md'
              }`}
            >
              Lahat
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={`px-6 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 hover:scale-105 ${
                  selectedCategory.toLowerCase() === category.name.toLowerCase()
                    ? 'bg-amber-100 text-amber-700 border border-amber-200 shadow-lg'
                    : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50 border border-transparent hover:shadow-md'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product, index) => (
                <div 
                  key={product.id} 
                  className="bg-white rounded-2xl border border-amber-100 p-6 text-center hover:shadow-xl hover:border-amber-200 transition-all duration-500 hover:scale-105 animate-in fade-in-0 slide-in-from-bottom-2 group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative mx-auto w-28 h-28 sm:w-40 sm:h-40 mb-4 overflow-hidden rounded-2xl">
                    <Image
                      src={getMenuImagePath(product) || getPlaceholderImage(product.category)}
                      alt={product.name}
                      width={160}
                      height={160}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="font-semibold text-slate-900 mb-1 group-hover:text-amber-700 transition-colors duration-300">{product.name}</div>
                  {product.category && (
                    <div className="text-xs text-slate-500 mb-2">{product.category}</div>
                  )}
                  <div className="text-lg text-amber-600 font-bold group-hover:text-amber-700 transition-colors duration-300">₱{(product.priceCents / 100).toFixed(2)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4 text-amber-300">☕</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No items available</h3>
              <p className="text-slate-500">No products are currently available.</p>
            </div>
          )}
        </div>
      </div>

      {/* Service Section */}
      <div id="service" className="bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Our <span className="text-amber-600">Services</span></h3>
            <p className="text-slate-600 max-w-2xl mx-auto">We provide exceptional service to make your coffee experience memorable.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl border border-amber-100 p-8 text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">🏪</div>
              <div className="font-semibold text-slate-900 mb-2 text-lg">Dine-in & Takeout</div>
              <div className="text-sm text-slate-500">Order at the kiosk or counter, pick up fast.</div>
            </div>
            <div className="bg-white rounded-2xl border border-amber-100 p-8 text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">🛵</div>
              <div className="font-semibold text-slate-900 mb-2 text-lg">Delivery</div>
              <div className="text-sm text-slate-500">Fast delivery partners in your area.</div>
            </div>
            <div className="bg-white rounded-2xl border border-amber-100 p-8 text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">🎉</div>
              <div className="font-semibold text-slate-900 mb-2 text-lg">Catering</div>
              <div className="text-sm text-slate-500">Events, meetings, and special occasions.</div>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div id="about" className="bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">About <span className="text-amber-600">SulitServe</span></h3>
              <p className="text-slate-600 mb-6 text-lg leading-relaxed">We brew quality coffee and serve comfort food with a smile. Our minimalist kiosk-first experience lets customers order quickly while keeping things simple.</p>
              <div className="flex items-center gap-4">
                <button onClick={() => setIsOrderingModalOpen(true)} className="bg-amber-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-amber-700 shadow-lg hover:shadow-xl transition-all">Explore Menu</button>
                <a href="#service" className="px-8 py-4 rounded-xl font-semibold border border-amber-200 text-amber-700 hover:bg-amber-50 transition-all">Our Services</a>
              </div>
            </div>
            <div>
              <Image src="https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop" alt="About image" width={600} height={400} className="rounded-2xl w-full object-cover shadow-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* How to Order Section */}
      <div id="how-to-order" className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Paano <span className="text-amber-600">Mag-order</span>
            </h3>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">
              Madali at mabilis mag-order sa SulitServe. Sundan ang mga simpleng hakbang para makuha ang paborito mong kape at pastry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📱</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">1. Tumingin ng Menu</h4>
              <p className="text-slate-600">
                I-click ang &quot;Paano Mag-order&quot; o mag-scroll pababa para makita ang buong menu kasama ang presyo at kategorya.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🛒</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">2. Ilagay sa Cart</h4>
              <p className="text-slate-600">
                Piliin ang paborito mong items at ilagay sa cart. Pwede mong baguhin ang dami kung kinakailangan.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">💳</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">3. Bayaran</h4>
              <p className="text-slate-600">
                Suriin ang iyong order, piliin ang paraan ng pagbabayad, at i-place ang order. Ihahanda namin ito ng sariwa para sa iyo!
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => setIsOrderingModalOpen(true)}
              className="bg-amber-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-amber-700 transition-all hover:shadow-xl"
            >
              Start Ordering Now
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Image src="/images/landing_image.png" alt="SulitServe logo" width={40} height={40} className="w-10 h-10 rounded-xl object-cover shadow-lg" />
              <div>
                <div className="font-bold text-xl">SulitServe Café</div>
                <div className="text-amber-200">Quality Coffee & Fresh Pastries</div>
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="text-amber-200 font-medium mb-1">Operating Hours: 6:00 AM - 10:00 PM</div>
              <div className="text-slate-400 text-sm">© 2024 SulitServe Café. All rights reserved.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ordering Modal - Minimalist Theme */}
      {isOrderingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
          {/* Light translucent backdrop + blur; placed as a sibling so it doesn't darken the modal */}
          <div
            aria-hidden
            onClick={() => {
              setIsOrderingModalOpen(false)
              resetOrder()
            }}
            className="absolute inset-0 bg-white/40 backdrop-blur-md"
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white w-full max-w-[95vw] sm:max-w-5xl max-h-[95vh] sm:max-h-[85vh] rounded-none sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-200"
          >
            
            {/* Step Navigation - Minimalist */}
            <div className="bg-slate-50 px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {[
                    { step: 'menu', label: 'Menu', number: 1 },
                    { step: 'checkout', label: 'Checkout', number: 2 },
                    { step: 'confirmation', label: 'Confirm', number: 3 },
                    { step: 'track', label: 'Track', number: 4 },
                    { step: 'receipt', label: 'Receipt', number: 5 }
                  ].map((item, index) => (
                    <div key={item.step} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                        currentStep === item.step 
                          ? 'bg-slate-900 text-white shadow-md' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {item.number}
                      </div>
                      <span className={`text-sm font-medium transition-colors duration-300 ${
                        currentStep === item.step ? 'text-slate-900' : 'text-slate-600'
                      }`}>
                        {item.label}
                      </span>
                      {index < 4 && (
                        <div className={`w-8 h-px transition-colors duration-300 ${
                          currentStep === item.step ? 'bg-slate-900' : 'bg-slate-300'
                        }`}></div>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setIsOrderingModalOpen(false)
                    resetOrder()
                  }}
                  className="p-2 hover:bg-slate-100 rounded-full transition-all duration-300 text-slate-500 hover:text-slate-700 hover:scale-110"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-4 sm:p-8 max-h-[85vh] sm:max-h-[calc(85vh-140px)] overflow-y-auto overscroll-contain scroll-smooth">
              
              {/* Step 1: Menu Selection */}
              {currentStep === 'menu' && (
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900">Piliin ang Iyong Order</h2>
                      <p className="text-slate-500 mt-2">Piliin ang mga item mula sa aming menu</p>
                    </div>
                    {cart.length > 0 && (
                      <button
                        onClick={() => setCurrentStep('checkout')}
                        className="bg-slate-900 text-white px-3 py-2 sm:px-6 sm:py-3 rounded-2xl font-semibold hover:bg-slate-800 transition-all duration-300 flex items-center gap-2 sm:gap-3 shadow-lg hover:shadow-xl hover:scale-105 text-sm sm:text-base"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                        </svg>
                        <span className="whitespace-nowrap">Cart ({cart.length})</span>
                      </button>
                    )}
                  </div>

                  {/* Categories - Minimalist */}
                  <div className="mb-8">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        <button
                          onClick={() => setSelectedCategory('all')}
                          className={`px-6 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-300 hover:scale-105 ${
                            selectedCategory === 'all'
                              ? 'bg-slate-900 text-white shadow-lg'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          ☕ Lahat ng Item
                        </button>
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.name)}
                          className={`px-6 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-300 hover:scale-105 ${
                            selectedCategory.toLowerCase() === category.name.toLowerCase()
                              ? 'bg-slate-900 text-white shadow-lg'
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

                  {/* Products Grid - Fixed Height Container */}
                  <div className="min-h-[280px] sm:min-h-[400px]">
                    {filteredProducts.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredProducts.map((product) => (
                          <div key={product.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-xl hover:border-slate-300 transition-all group">
                            <div className="relative mb-4">
                              <Image
                                src={getMenuImagePath(product) || getPlaceholderImage(product.category)}
                                alt={product.name}
                                width={144}
                                height={144}
                                className="w-full h-36 object-cover rounded-xl"
                              />
                            </div>
                            
                            <h4 className="font-bold text-slate-900 mb-2 text-base">{product.name}</h4>
                            <p className="text-lg font-bold text-slate-700 mb-4">₱{(product.priceCents / 100).toFixed(2)}</p>
                            
                            <button 
                              onClick={() => addToCart(product)}
                              className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                                isInCart(product.id)
                                  ? 'bg-slate-900 text-white shadow-lg'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white hover:shadow-lg'
                              }`}
                            >
                              {isInCart(product.id) ? 'Nailagay ✓' : 'Ilagay sa Cart'}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] sm:h-[400px]">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">Currently Not Available</h3>
                          <p className="text-slate-500 text-sm">No products available in this category at the moment.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Checkout */}
              {currentStep === 'checkout' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Review Your Order</h2>
                      <p className="text-slate-500 text-sm mt-1">Confirm your items and payment method</p>
                    </div>
                    <button
                      onClick={() => setCurrentStep('menu')}
                      className="text-slate-600 hover:text-slate-800 text-sm font-medium"
                    >
                      ← Back to Menu
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Cart Items */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Items</h3>
                      <div className="space-y-3">
                        {cart.map((item, index) => (
                          <div key={`${item.product.id}-${index}`} className="bg-slate-50 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                              <Image
                                src={getMenuImagePath(item.product) || getPlaceholderImage(item.product.category)}
                                alt={item.product.name}
                                width={48}
                                height={48}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium text-slate-900 text-sm">{item.product.name}</h4>
                                <p className="text-slate-600 text-sm font-medium">₱{(item.product.priceCents / 100).toFixed(2)} each</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                  className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                  </svg>
                                </button>
                                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                  className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Summary & Payment */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h3>
                      <div className="bg-slate-50 rounded-xl p-4 space-y-3 mb-6">
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
                          <span className="text-slate-900">₱{(getFinalTotal() / 100).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div className="mb-6">
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
                              className={`p-3 rounded-xl border text-center transition-all ${
                                selectedPaymentMethod === method.id
                                  ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                                  : 'border-slate-200 hover:border-slate-300 bg-white'
                              }`}
                            >
                              <div className="text-xl mb-1">{method.icon}</div>
                              <div className="text-xs font-medium">{method.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button 
                        onClick={placeOrder}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl"
                      >
                        Place Order
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Order Confirmation */}
              {currentStep === 'confirmation' && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Order Confirmed!</h2>
                  <p className="text-slate-600 mb-4">Your order has been placed successfully</p>
                  <div className="bg-slate-50 rounded-xl p-6 mb-6">
                    <p className="text-sm text-slate-600 mb-2">Order Number</p>
                    <p className="text-2xl font-bold text-slate-900">{orderNumber}</p>
                    <p className="text-sm text-slate-500 mt-2">Estimated time: 15-20 minutes</p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setCurrentStep('track')}
                      className="bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-all"
                    >
                      Track Order
                    </button>
                    <button
                      onClick={() => {
                        setIsOrderingModalOpen(false)
                        resetOrder()
                      }}
                      className="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-200 transition-all"
                    >
                      New Order
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Order Tracking */}
              {currentStep === 'track' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Track Your Order</h2>
                      <p className="text-slate-500 text-sm mt-1">Order #{orderNumber}</p>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => {
                          setIsOrderingModalOpen(false)
                          resetOrder()
                        }}
                        className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 transition-all"
                      >
                        New Order
                      </button>
                      {orderStatus === 'completed' && (
                        <button
                          onClick={() => setCurrentStep('receipt')}
                          className="bg-rose-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-rose-600 transition-all"
                        >
                          View Receipt
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-w-md mx-auto">
                    {/* Order Status */}
                    <div className="bg-slate-50 rounded-xl p-6 mb-6">
                      <div className="text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                          orderStatus === 'pending' ? 'bg-yellow-100' :
                          orderStatus === 'confirmed' ? 'bg-blue-100' :
                          orderStatus === 'preparing' ? 'bg-orange-100' :
                          orderStatus === 'ready' ? 'bg-green-100' :
                          orderStatus === 'completed' ? 'bg-green-100' :
                          orderStatus === 'cancelled' ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          {orderStatus === 'pending' && <span className="text-2xl">⏳</span>}
                          {orderStatus === 'confirmed' && <span className="text-2xl">✅</span>}
                          {orderStatus === 'preparing' && <span className="text-2xl">👨‍🍳</span>}
                          {orderStatus === 'ready' && <span className="text-2xl">🍽️</span>}
                          {orderStatus === 'completed' && <span className="text-2xl">🎉</span>}
                          {orderStatus === 'cancelled' && <span className="text-2xl">❌</span>}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                          {orderStatus === 'pending' && 'Order Received'}
                          {orderStatus === 'confirmed' && 'Order Confirmed'}
                          {orderStatus === 'preparing' && 'Preparing Your Order'}
                          {orderStatus === 'ready' && 'Order Ready for Pickup'}
                          {orderStatus === 'completed' && 'Order Completed'}
                          {orderStatus === 'cancelled' && 'Order Cancelled'}
                        </h3>
                        <p className="text-slate-600">
                          {orderStatus === 'pending' && 'We have received your order. Waiting for cashier confirmation.'}
                          {orderStatus === 'confirmed' && 'Your order has been confirmed by the cashier and will be prepared soon.'}
                          {orderStatus === 'preparing' && 'Our team is preparing your delicious order.'}
                          {orderStatus === 'ready' && 'Your order is ready! Please come to the counter to pick it up.'}
                          {orderStatus === 'completed' && 'Thank you for your order! Enjoy your meal!'}
                          {orderStatus === 'cancelled' && 'Your order has been cancelled. Please contact the cashier if you have any questions.'}
                        </p>
                      </div>
                    </div>

                    {/* Order Items Summary */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                      <h4 className="font-semibold text-slate-900 mb-3">Order Summary</h4>
                      <div className="space-y-2">
                        {cart.map((item, index) => (
                          <div key={`${item.product.id}-${index}`} className="flex justify-between text-sm">
                            <span className="text-slate-600">{item.product.name} x{item.quantity}</span>
                            <span className="font-medium">₱{((item.product.priceCents * item.quantity) / 100).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="border-t border-slate-200 pt-2 mt-2">
                          <div className="flex justify-between font-bold">
                            <span>Total</span>
                            <span className="text-amber-700">₱{(getFinalTotal() / 100).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: QR Receipt */}
              {currentStep === 'receipt' && (
                <div className="text-center">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Order Completed!</h2>
                  <p className="text-slate-600 mb-8">Your order has been successfully completed</p>
                  
                  {/* Order Summary */}
                  <div className="bg-slate-50 rounded-2xl p-6 mb-8 max-w-md mx-auto">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Order #{orderNumber}</h3>
                    
                      <div className="space-y-2 mb-4">
                        {(lastReceipt?.items || cart.map((item)=>({
                          name: item.product.name,
                          quantity: item.quantity,
                          price: item.product.priceCents / 100,
                          total: (item.product.priceCents * item.quantity) / 100
                        }))).map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-slate-600">{item.name} x{item.quantity}</span>
                          <span className="font-medium">₱{(item.total).toFixed(2)}</span>
                        </div>
                        ))}
                    </div>
                    
                    <div className="border-t border-slate-200 pt-3 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Subtotal</span>
                        <span className="font-medium">₱{(lastReceipt ? lastReceipt.subtotal : (getTotalPrice() - getTax()) / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Tax (10%)</span>
                        <span className="font-medium">₱{(lastReceipt ? lastReceipt.tax : getTax() / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-2">
                        <span>Total</span>
                        <span className="text-amber-700">₱{(lastReceipt ? lastReceipt.total : getFinalTotal() / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Receipt Info */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 max-w-sm mx-auto">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Digital Receipt</h3>
                    <p className="text-sm text-slate-600 mb-4">Click &quot;View Receipt&quot; to see your order details</p>
                    
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-500">
                      Payment: {(lastReceipt?.paymentMethod || selectedPaymentMethod).replace('ewallet','E-Wallet (GCash)').replace('gcash','E-Wallet (GCash)').replace('card','Card').replace('cash','Cash')} • {new Date().toLocaleDateString()}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => {
                        setIsOrderingModalOpen(false)
                        resetOrder()
                      }}
                      className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl"
                    >
                      New Order
                    </button>
                    <button
                      onClick={() => {
                        // Store receipt data in localStorage for the receipt page
                        const receiptData = {
                          orderNumber,
                          items: cart.map(item => ({
                            name: item.product.name,
                            quantity: item.quantity,
                            price: item.product.priceCents / 100,
                            total: (item.product.priceCents * item.quantity) / 100
                          })),
                          subtotal: (getTotalPrice() - getTax()) / 100,
                          tax: getTax() / 100,
                          total: getFinalTotal() / 100,
                          paymentMethod: selectedPaymentMethod,
                          orderDate: new Date().toLocaleDateString(),
                          timestamp: new Date().toISOString()
                        }
                        
                        localStorage.setItem(`receipt-${orderNumber}`, JSON.stringify(receiptData))
                        
                        // Open receipt in new tab
                        window.open(`/receipt/${orderNumber}`, '_blank')
                      }}
                      className="bg-slate-100 text-slate-700 px-6 py-4 rounded-2xl font-semibold hover:bg-slate-200 transition-all"
                    >
                      View Receipt
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  )
}