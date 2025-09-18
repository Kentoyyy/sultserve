'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface OrderItem {
  name: string
  quantity: number
  price: number
  total: number
}

interface ReceiptData {
  orderNumber: string
  items: OrderItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  orderDate: string
  timestamp: string
}

export default function ReceiptPage() {
  const params = useParams()
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      const orderNumber = params.orderNumber as string
      try {
        const res = await fetch(`/api/orders/by-number?orderNumber=${encodeURIComponent(orderNumber)}`)
        if (!res.ok) {
          setLoading(false)
          return
        }
        const { ok, order } = await res.json()
        if (!ok) {
          setLoading(false)
          return
        }

        // Transform to ReceiptData shape
        const items = order.items.map((i: any) => ({
          name: i.productName,
          quantity: i.quantity,
          price: i.unitPriceCents / 100,
          total: i.totalCents / 100,
        }))
        const subtotal = items.reduce((s: number, it: any) => s + it.total, 0)
        const total = order.totalCents / 100
        const tax = Math.max(0, total - subtotal)

        setReceiptData({
          orderNumber: order.orderNumber,
          items,
          subtotal,
          tax,
          total,
          paymentMethod: order.paymentMethod || 'online',
          orderDate: new Date(order.createdAt).toLocaleDateString(),
          timestamp: order.createdAt,
        })
      } catch (e) {
        console.error('Failed to load receipt', e)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [params.orderNumber])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading receipt...</p>
        </div>
      </div>
    )
  }

  if (!receiptData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Receipt Not Found</h2>
          <p className="text-slate-600">The receipt you're looking for could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 text-center">
          <div className="w-16 h-16 bg-white bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3 overflow-hidden">
            <img src="/images/landing_image.png" alt="Logo" className="w-12 h-12 object-cover rounded-full" />
          </div>
          <h1 className="text-xl font-bold">SulitServe Café</h1>
          <p className="text-amber-200 text-sm">Digital Receipt</p>
        </div>

        {/* Receipt Content */}
        <div className="p-6">
          {/* Order Info */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-slate-900">Order #{receiptData.orderNumber}</h2>
            <p className="text-slate-500 text-sm">{receiptData.orderDate}</p>
          </div>

          {/* Items */}
          <div className="space-y-3 mb-6">
            {receiptData.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-slate-100">
                <div>
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-900">₱{item.total.toFixed(2)}</p>
                  <p className="text-sm text-slate-500">₱{item.price.toFixed(2)} each</p>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-medium">₱{receiptData.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Tax (10%)</span>
              <span className="font-medium">₱{receiptData.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-2">
              <span>Total</span>
              <span className="text-amber-700">₱{receiptData.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Payment Method</span>
              <span className="font-medium">
                {receiptData.paymentMethod === 'ewallet' ? 'E-Wallet (GCash)' :
                 receiptData.paymentMethod === 'gcash' ? 'E-Wallet (GCash)' :
                 receiptData.paymentMethod === 'card' ? 'Card' :
                 receiptData.paymentMethod === 'cash' ? 'Cash' :
                 'Online'}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-slate-600">Order Time</span>
              <span className="font-medium">{new Date(receiptData.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-slate-500">
            <p>Thank you for your order!</p>
            <p className="mt-1">Visit us again soon</p>
          </div>
        </div>
      </div>
    </div>
  )
}





