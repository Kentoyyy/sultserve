'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface CartItem {
  id: string
  name: string
  priceCents: number
  quantity: number
}

export default function KioskCheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedPayment, setSelectedPayment] = useState<string>('')
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('kioskCart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    } else {
      // No cart, redirect back to menu
      router.push('/kiosk/menu')
    }
  }, [router])

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.priceCents * item.quantity), 0)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const handlePaymentSelect = (paymentMethod: string) => {
    setSelectedPayment(paymentMethod)
    setError('')
  }

  const placeOrder = async () => {
    if (!selectedPayment) {
      setError('Please select a payment method')
      return
    }

    if (cart.length === 0) {
      setError('Your cart is empty')
      return
    }

    setIsPlacingOrder(true)
    setError('')

    try {
      const orderData = {
        items: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.priceCents
        })),
        totalAmount: getTotalPrice(),
        paymentMethod: selectedPayment
      }

      const response = await fetch('/api/kiosk/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (result.ok) {
        // Clear cart
        localStorage.removeItem('kioskCart')
        
        // Store order info for confirmation page
        localStorage.setItem('lastOrder', JSON.stringify({
          orderNumber: result.order.orderNumber,
          totalAmount: result.order.totalAmount,
          items: cart,
          paymentMethod: selectedPayment
        }))
        
        // Redirect to confirmation
        router.push('/kiosk/confirmation')
      } else {
        setError(result.error || 'Failed to place order')
      }
    } catch (error) {
      console.error('Error placing order:', error)
      setError('Failed to place order. Please try again.')
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const goBack = () => {
    router.push('/kiosk/menu')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button 
            onClick={goBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Menu
          </button>
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Checkout</h1>
            <p className="text-sm text-slate-500">Review and complete your order</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-slate-100">
                  <div>
                    <div className="font-medium text-slate-900">{item.name}</div>
                    <div className="text-sm text-slate-600">Qty: {item.quantity}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">
                      ₱{((item.priceCents * item.quantity) / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-600">Total Items:</span>
                <span className="font-medium">{getTotalItems()}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold text-slate-900">
                <span>Total Amount:</span>
                <span className="text-emerald-600">₱{(getTotalPrice() / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Payment Method</h2>
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handlePaymentSelect('cash')}
                className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                  selectedPayment === 'cash' 
                    ? 'border-emerald-600 bg-emerald-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">💵</div>
                  <div>
                    <div className="font-semibold text-slate-900">Cash</div>
                    <div className="text-sm text-slate-600">Pay with cash at the counter</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handlePaymentSelect('gcash')}
                className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                  selectedPayment === 'gcash' 
                    ? 'border-emerald-600 bg-emerald-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📱</div>
                  <div>
                    <div className="font-semibold text-slate-900">GCash</div>
                    <div className="text-sm text-slate-600">Pay with GCash mobile wallet</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handlePaymentSelect('card')}
                className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                  selectedPayment === 'card' 
                    ? 'border-emerald-600 bg-emerald-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">💳</div>
                  <div>
                    <div className="font-semibold text-slate-900">Credit/Debit Card</div>
                    <div className="text-sm text-slate-600">Pay with your card</div>
                  </div>
                </div>
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="text-red-800 text-sm">{error}</div>
              </div>
            )}

            <button
              onClick={placeOrder}
              disabled={!selectedPayment || isPlacingOrder || cart.length === 0}
              className="w-full bg-emerald-600 text-white py-4 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlacingOrder ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Placing Order...
                </div>
              ) : (
                `Place Order - ₱${(getTotalPrice() / 100).toFixed(2)}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


