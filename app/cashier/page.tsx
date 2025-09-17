'use client'

import { useEffect, useState, useRef } from 'react'

interface OrderItem {
  id: string
  productName: string
  quantity: number
  unitPriceCents: number
}

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  orderType: string
  createdAt: string
  items: OrderItem[]
}

export default function CashierDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(null)
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('')
  const [notification, setNotification] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'orders' | 'completed'>('orders')
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0])
  const previousOrdersLength = useRef(0)

  useEffect(() => {
    // Get current staff ID from localStorage
    const staffData = localStorage.getItem('user')
    if (staffData) {
      const staff = JSON.parse(staffData)
      setCurrentStaffId(staff.id)
    }
    
    fetchOrders()
    
    // Real-time polling every 2 seconds for immediate updates
    const interval = setInterval(() => {
      fetchOrders()
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/cashier/orders')
      if (response.ok) {
        const result = await response.json()
        const newOrders = result.data || []
        
        // Check for new orders and show notification
        if (previousOrdersLength.current > 0 && newOrders.length > previousOrdersLength.current) {
          const newOrdersCount = newOrders.length - previousOrdersLength.current
          showNotification(`🔔 ${newOrdersCount} new order${newOrdersCount > 1 ? 's' : ''} received!`)
        }
        
        previousOrdersLength.current = newOrders.length
        setOrders(newOrders)
        setLastUpdateTime(new Date().toLocaleTimeString())
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const showNotification = (message: string) => {
    setNotification(message)
    setTimeout(() => setNotification(null), 4000)
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/cashier/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId, 
          status: newStatus,
          staffId: currentStaffId
        })
      })
      
      if (response.ok) {
        // Immediate UI update instead of waiting for next fetch
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        )
        showNotification(`Order #${orders.find(o => o.id === orderId)?.orderNumber} updated to ${newStatus}`)
      }
    } catch (error) {
      console.error('Failed to update order:', error)
    }
  }

  const getStatusInfo = (status: string) => {
    const statusMap = {
      'pending': {
        label: 'Pending',
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: '⏳'
      },
      'preparing': {
        label: 'Preparing',
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: '👨‍🍳'
      },
      'ready': {
        label: 'Ready',
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: '✅'
      },
      'completed': {
        label: 'Completed',
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: '🎉'
      }
    }
    return statusMap[status as keyof typeof statusMap] || statusMap.pending
  }

  const getActionButton = (order: Order) => {
    switch (order.status) {
      case 'pending':
        return (
          <button
            onClick={() => updateOrderStatus(order.id, 'preparing')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>👨‍🍳</span> Start Preparing
          </button>
        )
      case 'preparing':
        return (
          <button
            onClick={() => updateOrderStatus(order.id, 'ready')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>✅</span> Mark Ready
          </button>
        )
      case 'ready':
        return (
          <button
            onClick={() => updateOrderStatus(order.id, 'completed')}
            className="w-full bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>🎉</span> Complete Order
          </button>
        )
      default:
        return (
          <div className="w-full bg-slate-100 text-slate-500 px-4 py-2 rounded-lg text-center font-medium">
            Order Completed
          </div>
        )
    }
  }

  const activeOrders = orders.filter(order => order.status !== 'completed')
  const completedOrders = orders.filter(order => {
    if (order.status !== 'completed') return false
    const orderDate = new Date(order.createdAt).toISOString().split('T')[0]
    return orderDate === dateFilter
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-amber-600 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          {notification}
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Order Management</h1>
              <p className="text-slate-600 mt-1">Process customer orders efficiently</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-600">{orders.length} total orders</span>
              </div>
              <div className="text-xs text-slate-400">
                Updated: {lastUpdateTime}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg mb-6">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === 'orders'
                  ? 'bg-white text-slate-900 shadow-sm border border-amber-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Orders ({activeOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === 'completed'
                  ? 'bg-white text-slate-900 shadow-sm border border-amber-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed Orders ({completedOrders.length})
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">⏳</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-900">
                    {orders.filter(o => o.status === 'pending').length}
                  </div>
                  <div className="text-sm text-amber-700">Pending</div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">👨‍🍳</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-900">
                    {orders.filter(o => o.status === 'preparing').length}
                  </div>
                  <div className="text-sm text-blue-700">Preparing</div>
                </div>
              </div>
            </div>
            
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">✅</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-900">
                    {orders.filter(o => o.status === 'ready').length}
                  </div>
                  <div className="text-sm text-emerald-700">Ready</div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">✨</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    ₱{(orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalAmount, 0) / 100).toFixed(2)}
                  </div>
                  <div className="text-sm text-slate-600">Today's Sales</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'orders' && (
          <div>
            {activeOrders.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeOrders.map((order) => {
                const statusInfo = getStatusInfo(order.status)
                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-slate-200 hover:border-amber-200 transition-all duration-200 overflow-hidden shadow-sm">
                    {/* Order Header */}
                    <div className="bg-slate-50 border-b border-slate-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900">#{order.orderNumber}</h3>
                          <p className="text-sm text-slate-500">
                            {new Date(order.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                          {statusInfo.icon} {statusInfo.label}
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-4">
                      <div className="space-y-2 mb-4">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-slate-600">
                              {item.quantity}x {item.productName}
                            </span>
                            <span className="font-medium text-slate-900">
                              ₱{((item.unitPriceCents * item.quantity) / 100).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t border-slate-200 pt-3 mb-4">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span className="text-emerald-600">₱{(order.totalAmount / 100).toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-slate-500 capitalize mt-1">
                          {order.orderType} order
                        </div>
                      </div>

                      {/* Action Button */}
                      {getActionButton(order)}
                    </div>
                  </div>
                )
              })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                <div className="text-6xl mb-4 text-slate-300">📋</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No active orders</h3>
                <p className="text-slate-600">New orders will appear here when customers place them</p>
              </div>
            )}
          </div>
        )}

        {/* Completed Orders Tab */}
        {activeTab === 'completed' && (
          <div>
            {/* Date Filter */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-slate-700">
                  Filter by Date:
                </label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                <div className="text-sm text-slate-500">
                  Showing {completedOrders.length} completed orders
                </div>
              </div>
            </div>

            {completedOrders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-900">#{order.orderNumber}</h3>
                      <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">
                        ✨ Completed
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-slate-600">
                            {item.quantity}x {item.productName}
                          </span>
                          <span className="font-medium text-slate-900">
                            ₱{((item.unitPriceCents * item.quantity) / 100).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-slate-200 pt-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold text-lg text-emerald-600">
                            ₱{(order.totalAmount / 100).toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(order.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 capitalize">
                          {order.orderType}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                <div className="text-6xl mb-4 text-slate-300">📅</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No completed orders</h3>
                <p className="text-slate-600">
                  No orders completed on {new Date(dateFilter).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}