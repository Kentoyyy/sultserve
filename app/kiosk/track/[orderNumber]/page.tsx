'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Order {
  id: string
  orderNumber: string
  status: string
  totalCents: number
  paymentMethod: string
  orderedAt: string
  items: Array<{
    id: string
    quantity: number
    totalCents: number
    product: {
      name: string
    }
  }>
}

export default function OrderTrackingPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const loadOrder = async () => {
      const { orderNumber } = await params
      fetchOrder(orderNumber)
    }
    loadOrder()

    // Set up auto-refresh every 10 seconds
    const interval = setInterval(async () => {
      const { orderNumber } = await params
      fetchOrder(orderNumber)
    }, 10000)

    return () => clearInterval(interval)
  }, [params])

  const fetchOrder = async (orderNumber: string) => {
    try {
      const response = await fetch(`/api/kiosk/orders/${orderNumber}`)
      if (response.ok) {
        const result = await response.json()
        setOrder(result.data)
        setError('')
      } else {
        setError('Order not found')
      }
    } catch (error) {
      console.error('Failed to fetch order:', error)
      setError('Failed to load order')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: '⏳',
          text: 'Order Received',
          description: 'Your order has been received and is waiting to be prepared',
          color: 'border-yellow-500 bg-yellow-50',
          textColor: 'text-yellow-800'
        }
      case 'preparing':
        return {
          icon: '👨‍🍳',
          text: 'Preparing',
          description: 'Your order is being prepared by our kitchen staff',
          color: 'border-blue-500 bg-blue-50',
          textColor: 'text-blue-800'
        }
      case 'ready':
        return {
          icon: '🔔',
          text: 'Ready for Pickup',
          description: 'Your order is ready! Please proceed to the counter',
          color: 'border-green-500 bg-green-50',
          textColor: 'text-green-800'
        }
      case 'completed':
        return {
          icon: '✅',
          text: 'Order Complete',
          description: 'Thank you! Your order has been completed',
          color: 'border-emerald-500 bg-emerald-50',
          textColor: 'text-emerald-800'
        }
      case 'cancelled':
        return {
          icon: '❌',
          text: 'Order Cancelled',
          description: 'Your order has been cancelled',
          color: 'border-red-500 bg-red-50',
          textColor: 'text-red-800'
        }
      default:
        return {
          icon: '📋',
          text: 'Processing',
          description: 'Your order is being processed',
          color: 'border-gray-500 bg-gray-50',
          textColor: 'text-gray-800'
        }
    }
  }

  const getEstimatedTime = (status: string, orderedAt: string) => {
    const orderTime = new Date(orderedAt)
    const now = new Date()
    const elapsedMinutes = Math.floor((now.getTime() - orderTime.getTime()) / 60000)

    switch (status) {
      case 'pending':
        return `Starting soon... (${elapsedMinutes} min elapsed)`
      case 'preparing':
        const remaining = Math.max(0, 15 - elapsedMinutes)
        return remaining > 0 ? `~${remaining} minutes remaining` : 'Almost ready!'
      case 'ready':
        return 'Ready now!'
      case 'completed':
        return 'Completed'
      default:
        return 'Processing...'
    }
  }

  const goHome = () => {
    router.push('/kiosk')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg p-8 shadow-sm max-w-md">
          <div className="text-red-500 text-4xl mb-4">😞</div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Order Not Found</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={goHome}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(order.status)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b no-print">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={goHome}
              className="text-slate-600 hover:text-slate-900"
            >
              ← Back to Menu
            </button>
            <h1 className="text-xl font-bold text-slate-900">Track Order</h1>
            <div className="ml-auto text-sm text-slate-500">
              Auto-updating every 10s
            </div>
          </div>
        </div>
      </div>

      {/* Print Header - Only visible when printing */}
      <div className="hidden print-only text-center py-4">
        <h1 className="text-2xl font-bold">SulitServe Café</h1>
        <p className="text-sm text-gray-600">Order Receipt</p>
        <hr className="my-4" />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Order Status */}
        <div className={`rounded-2xl border-2 p-8 mb-6 no-print ${statusInfo.color}`}>
          <div className="text-center">
            <div className="text-6xl mb-4">{statusInfo.icon}</div>
            <h2 className={`text-2xl font-bold mb-2 ${statusInfo.textColor}`}>
              {statusInfo.text}
            </h2>
            <p className={`text-lg mb-4 ${statusInfo.textColor}`}>
              {statusInfo.description}
            </p>
            <div className={`text-sm font-medium ${statusInfo.textColor}`}>
              {getEstimatedTime(order.status, order.orderedAt)}
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print-receipt">
          {/* Order Header */}
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Order #{order.orderNumber}
                </h3>
                <p className="text-sm text-slate-600">
                  Ordered: {new Date(order.orderedAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-slate-900">
                  ₱{(order.totalCents / 100).toFixed(2)}
                </div>
                <div className="text-sm text-slate-600 capitalize">
                  {order.paymentMethod}
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">Order Items</h4>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
                  <div>
                    <div className="font-medium text-slate-900">{item.product.name}</div>
                    <div className="text-sm text-slate-600">Qty: {item.quantity}</div>
                  </div>
                  <div className="font-semibold text-slate-900">
                    ₱{(item.totalCents / 100).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-3 no-print">
          {order.status === 'ready' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-green-800 font-semibold text-lg mb-2">
                🔔 Your order is ready!
              </div>
              <p className="text-green-700 text-sm">
                Please proceed to the counter to collect your order
              </p>
            </div>
          )}
          
          <button
            onClick={goHome}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            🛒 Place New Order
          </button>
        </div>

        {/* Print Receipt Button */}
        <div className="mt-4 text-center no-print">
          <button
            onClick={() => window.print()}
            className="text-slate-600 hover:text-slate-900 text-sm underline"
          >
            🖨️ Print Receipt
          </button>
        </div>
      </div>
    </div>
  )
}
