'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

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
  paymentMethod?: string
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
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [isAutoRefresh, setIsAutoRefresh] = useState(true)
  // const [lastUpdated, setLastUpdated] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [ordersPerPage] = useState(6) // 6 orders per page (2 rows of 3)
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
      if (isAutoRefresh) {
        fetchOrders()
      }
    }, 2000)
    
    return () => clearInterval(interval)
  }, [isAutoRefresh])

  const fetchOrders = useCallback(async () => {
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
        // setLastUpdated(new Date().toLocaleTimeString())
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setIsLoading(false)
    }
  }, [previousOrdersLength])

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
            className="w-full bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-full font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>👨‍🍳</span> Start Preparing
          </button>
        )
      case 'preparing':
        return (
          <button
            onClick={() => updateOrderStatus(order.id, 'ready')}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-full font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>✅</span> Mark Ready
          </button>
        )
      case 'ready':
        return (
          <button
            onClick={() => updateOrderStatus(order.id, 'completed')}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-full font-medium transition-colors flex items-center justify-center gap-2"
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

  // Filter orders based on search and filters
  const filterOrders = (ordersList: Order[]) => {
    return ordersList.filter(order => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = 
          order.orderNumber.toLowerCase().includes(searchLower) ||
          order.items.some(item => 
            item.productName.toLowerCase().includes(searchLower)
          )
        if (!matchesSearch) return false
      }

      // Status filter
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false
      }

      // Payment method filter
      if (paymentFilter !== 'all') {
        if (paymentFilter === 'cash' && order.paymentMethod !== 'cash') return false
        if (paymentFilter === 'card' && order.paymentMethod !== 'card') return false
        if (paymentFilter === 'ewallet' && !['gcash', 'ewallet'].includes(order.paymentMethod || '')) return false
      }

      return true
    })
  }

  const allActiveOrders = filterOrders(orders.filter(order => order.status !== 'completed'))
  const completedOrders = filterOrders(orders.filter(order => {
    if (order.status !== 'completed') return false
    const orderDate = new Date(order.createdAt).toISOString().split('T')[0]
    return orderDate === dateFilter
  }))

  // Pagination for active orders
  const totalPages = Math.ceil(allActiveOrders.length / ordersPerPage)
  const startIndex = (currentPage - 1) * ordersPerPage
  const endIndex = startIndex + ordersPerPage
  const activeOrders = allActiveOrders.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, paymentFilter])

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-amber-600 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          {notification}
        </div>
      )}


  <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
  {/* Header */}
  <div className="bg-white rounded-3xl border border-amber-100 p-4 sm:p-6 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Order Management</h1>
              <p className="text-slate-600 mt-1">Process customer orders efficiently</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isAutoRefresh ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`}></div>
                <span className="text-sm text-slate-600">{orders.length} total orders</span>
              </div>

              {/* Compact total for small screens */}
              <div className="flex items-center gap-2 sm:hidden">
                <div className="text-sm font-semibold text-slate-900">{orders.length}</div>
                <div className="text-xs text-slate-500">orders</div>
              </div>

              <button
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                className={`flex items-center gap-2 px-2 sm:px-3 py-1 rounded-lg text-xs transition-colors whitespace-nowrap ${
                  isAutoRefresh 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isAutoRefresh ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                <span className="hidden md:inline text-xs">{isAutoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}</span>
                <span className="inline md:hidden text-xs">{isAutoRefresh ? 'Auto' : 'Off'}</span>
              </button>

              <div className="text-xs text-slate-400 hidden md:block">
                Updated: {lastUpdateTime}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-transparent p-1 rounded-lg mb-6">
            <button
              onClick={() => setActiveTab('orders')}
              aria-label={`Show active orders (${allActiveOrders.length})`}
              className={`px-3 sm:px-4 py-2 rounded-full font-medium transition-all inline-flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'bg-slate-900 text-white shadow'
                  : 'bg-white text-slate-700 hover:shadow-sm'
              }`}
            >
              <span className="text-sm sm:text-base">Active Order</span>
              <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">{allActiveOrders.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 sm:px-4 py-2 rounded-full font-medium transition-all inline-flex items-center gap-2 ${
                activeTab === 'completed'
                  ? 'bg-slate-900 text-white shadow'
                  : 'bg-white text-slate-700 hover:shadow-sm'
              }`}
            >
              <span className="text-sm sm:text-base">Complete Order</span>
              <span className="ml-2 px-2 py-1 bg-slate-50 text-slate-700 rounded-full text-sm font-semibold">{completedOrders.length}</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Search Orders
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Order #, product name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Payment Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                >
                  <option value="all">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="ewallet">E-Wallet</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                    setPaymentFilter('all')
                  }}
                  className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors text-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg sm:text-lg">⏳</span>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-amber-800">
                    {allActiveOrders.filter(o => o.status === 'pending').length}
                  </div>
                  <div className="text-xs sm:text-sm text-amber-700">Pending</div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">👨‍🍳</span>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-800">
                    {allActiveOrders.filter(o => o.status === 'preparing').length}
                  </div>
                  <div className="text-xs sm:text-sm text-blue-700">Preparing</div>
                </div>
              </div>
            </div>
            
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">✅</span>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-800">
                    {allActiveOrders.filter(o => o.status === 'ready').length}
                  </div>
                  <div className="text-xs sm:text-sm text-emerald-700">Ready</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-slate-100 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">✨</span>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900">
                    ₱{(orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalAmount, 0) / 100).toFixed(2)}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600">Today&apos;s Sales</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'orders' && (
          <div>
            {/* Search Results Indicator */}
            {searchTerm && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-sm font-medium text-amber-800">
                      Showing {activeOrders.length} order(s) matching &quot;{searchTerm}&quot;
                    </span>
                  </div>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-amber-600 hover:text-amber-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {activeOrders.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeOrders.map((order) => {
                const statusInfo = getStatusInfo(order.status)
                return (
                  <div key={order.id} className="bg-white rounded-3xl border border-slate-100 hover:border-amber-100 transition-all duration-200 overflow-hidden shadow-sm min-h-[200px] max-h-[384px] flex flex-col">
                    {/* Order Header */}
                    <div className="bg-slate-50 border-b border-slate-100 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900">#{order.orderNumber}</h3>
                          <p className="text-sm text-slate-500">
                            {new Date(order.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {order.paymentMethod && (
                            <span className="px-2 py-1 rounded-full text-[10px] font-medium border bg-slate-50 text-slate-700 border-slate-200 capitalize">
                              {order.paymentMethod === 'gcash' || order.paymentMethod === 'ewallet' ? 'E-Wallet' : order.paymentMethod}
                            </span>
                          )}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                            {statusInfo.icon} {statusInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-3 sm:p-4 flex-1 flex flex-col min-h-0">
                      <div className="space-y-2 mb-4 flex-1 overflow-y-auto max-h-36 sm:max-h-32">
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
                          <span className="text-orange-600">₱{(order.totalAmount / 100).toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-slate-500 capitalize mt-1">
                          {order.orderType} order
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="mt-auto">
                        {getActionButton(order)}
                      </div>
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

            {/* Pagination for Active Orders */}
            {allActiveOrders.length > ordersPerPage && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, allActiveOrders.length)} of {allActiveOrders.length} orders
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-amber-600 text-white'
                            : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Completed Orders Tab */}
        {activeTab === 'completed' && (
          <div>
            {/* Search Results Indicator */}
            {searchTerm && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-sm font-medium text-amber-800">
                      Showing {completedOrders.length} order(s) matching &quot;{searchTerm}&quot;
                    </span>
                  </div>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-amber-600 hover:text-amber-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm min-h-80 max-h-96 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-900">#{order.orderNumber}</h3>
                      <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">
                        ✨ Completed
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4 flex-1 overflow-y-auto max-h-32 min-h-0">
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
                    
                    <div className="border-t border-slate-200 pt-3 mt-auto">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold text-lg text-orange-600">
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