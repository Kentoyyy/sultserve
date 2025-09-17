'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface OrderDetails {
  orderNumber: string
  totalAmount: number
  items: Array<{
    id: string
    name: string
    priceCents: number
    quantity: number
  }>
  paymentMethod: string
}

export default function KioskConfirmationPage() {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Load order details from localStorage
    const lastOrder = localStorage.getItem('lastOrder')
    if (lastOrder) {
      setOrderDetails(JSON.parse(lastOrder))
      // Don't clear the order immediately - keep it for the session
    } else {
      // No order details, redirect to kiosk home
      router.push('/kiosk')
    }
  }, [router])

  const startNewOrder = () => {
    // Clear the stored order when starting a new order
    localStorage.removeItem('lastOrder')
    router.push('/kiosk')
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Order Confirmation</h1>
            <p className="text-sm text-slate-500">Your order has been placed successfully</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Success Header */}
            <div className="bg-emerald-50 text-center p-8 border-b border-emerald-100">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Order Placed!</h2>
              <p className="text-slate-600">Thank you for your order</p>
            </div>

            {/* Order Details */}
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="text-sm text-slate-600 mb-2">Your Order Number</div>
                <div className="text-4xl font-bold text-slate-900 font-mono">
                  #{orderDetails.orderNumber}
                </div>
                <div className="text-sm text-slate-600 mt-2">
                  Please keep this number for reference
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h3>
                
                <div className="space-y-3 mb-6">
                  {orderDetails.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2">
                      <div>
                        <div className="font-medium text-slate-900">{item.name}</div>
                        <div className="text-sm text-slate-600">Qty: {item.quantity}</div>
                      </div>
                      <div className="font-semibold text-slate-900">
                        ₱{((item.priceCents * item.quantity) / 100).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 pt-4 mb-6">
                  <div className="flex justify-between items-center text-xl font-bold text-slate-900">
                    <span>Total Paid:</span>
                    <span className="text-emerald-600">₱{(orderDetails.totalAmount / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-slate-600 mt-1">
                    <span>Payment Method:</span>
                    <span className="capitalize">{orderDetails.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Status and Instructions */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="text-amber-600 text-xl">⏳</div>
                  <div>
                    <div className="font-semibold text-amber-800">Order Status: Pending</div>
                    <div className="text-sm text-amber-700 mt-1">
                      Your order has been sent to our kitchen. Please wait for your order number to be called.
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push(`/kiosk/track/${orderDetails.orderNumber}`)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  📱 Track My Order
                </button>
                <button
                  onClick={startNewOrder}
                  className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                >
                  🛒 Place New Order
                </button>
              </div>

              {/* Footer Info */}
              <div className="text-center mt-8 text-sm text-slate-500">
                <p>Please proceed to the counter for payment if you selected cash.</p>
                <p className="mt-1">Estimated preparation time: 10-15 minutes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}