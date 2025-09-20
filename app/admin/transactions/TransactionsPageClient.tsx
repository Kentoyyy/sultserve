'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface Transaction {
  id: string
  orderNumber: string
  customerName: string | null
  customerPhone: string | null
  paymentMethod: string
  paymentStatus: string
  status: string
  subtotal: number
  tax: number
  total: number
  createdAt: string
  items: Array<{
    id: string
    quantity: number
    unitPriceCents: number
    product: {
      name: string
      imageUrl: string | null
    }
  }>
}

interface TransactionsData {
  transactions: Transaction[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  summary: {
    totalRevenue: number
    totalOrders: number
  }
}

export default function TransactionsPageClient() {
  const [data, setData] = useState<TransactionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    paymentMethod: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isAutoRefresh, setIsAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [updateNotification, setUpdateNotification] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '5',
        ...filters
      })

      const response = await fetch(`/api/admin/transactions?${params}`)
      const result = await response.json()

      if (result.success) {
        const previousCount = data?.transactions.length || 0
        const newCount = result.data.transactions.length
        
        setData(result.data)
        setError(null)
        setLastUpdated(new Date().toLocaleTimeString())
        
        // Show notification if new transactions were added
        if (newCount > previousCount && previousCount > 0) {
          const newTransactions = newCount - previousCount
          setUpdateNotification(`🔄 ${newTransactions} new transaction(s) found!`)
          setTimeout(() => setUpdateNotification(null), 3000)
        }
      } else {
        setError(result.error || 'Failed to fetch transactions')
      }
    } catch (err) {
      setError('Failed to fetch transactions')
      console.error('Error fetching transactions:', err)
    } finally {
      setLoading(false)
    }
  }, [currentPage, filters, data?.transactions.length])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Real-time updates every 3 seconds
  useEffect(() => {
    if (!isAutoRefresh) return

    const interval = setInterval(() => {
      fetchTransactions()
    }, 3000) // Update every 3 seconds

    return () => clearInterval(interval)
  }, [isAutoRefresh, fetchTransactions])

  // Lock body scroll and close modal on Escape when a transaction is selected
  useEffect(() => {
    if (!selectedTransaction) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedTransaction(null)
      }
    }

    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [selectedTransaction])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      paymentMethod: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    })
    setCurrentPage(1)
  }

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'ewallet':
      case 'gcash':
        return 'E-Wallet (GCash)'
      case 'card':
        return 'Card'
      case 'cash':
        return 'Cash'
      default:
        return method
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'preparing':
        return 'bg-blue-100 text-blue-800'
      case 'ready':
        return 'bg-purple-100 text-purple-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[240px] sm:min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchTransactions}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Update Notification */}
      {updateNotification && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce">
          {updateNotification}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-600">View and manage all customer transactions</p>
          {lastUpdated && (
            <p className="text-xs text-slate-500 mt-1">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isAutoRefresh 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isAutoRefresh ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
              <span className="text-sm font-medium">
                {isAutoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
              </span>
            </button>
          </div>
          <button
            onClick={fetchTransactions}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Manual Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900">₱{data.summary.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Orders</p>
                <p className="text-2xl font-bold text-slate-900">{data.summary.totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Order number, customer name..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="ewallet">E-Wallet (GCash)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {data?.transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{transaction.orderNumber}</div>
                    <div className="text-sm text-slate-500">{transaction.items.length} item(s)</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">
                      {transaction.customerName || 'Walk-in Customer'}
                    </div>
                    {transaction.customerPhone && (
                      <div className="text-sm text-slate-500">{transaction.customerPhone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">{formatPaymentMethod(transaction.paymentMethod)}</div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(transaction.paymentStatus)}`}>
                      {transaction.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-700">
                    ₱{transaction.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(transaction.createdAt).toLocaleDateString('en-PH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedTransaction(transaction)}
                      className="text-amber-600 hover:text-amber-900 transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-slate-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(data.pagination.pages, prev + 1))}
                  disabled={currentPage === data.pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700">
                    Showing <span className="font-medium">{((currentPage - 1) * 5) + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * 5, data.pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{data.pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {/* Show page numbers */}
                    {(() => {
                      const totalPages = data.pagination.pages
                      const current = currentPage
                      const pages = []
                      
                      // Always show first page
                      if (current > 3) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => setCurrentPage(1)}
                            className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50"
                          >
                            1
                          </button>
                        )
                        if (current > 4) {
                          pages.push(
                            <span key="ellipsis1" className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-500">
                              ...
                            </span>
                          )
                        }
                      }
                      
                      // Show pages around current page
                      for (let i = Math.max(1, current - 2); i <= Math.min(totalPages, current + 2); i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              current === i
                                ? 'z-10 bg-amber-50 border-amber-500 text-amber-600'
                                : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            {i}
                          </button>
                        )
                      }
                      
                      // Always show last page
                      if (current < totalPages - 2) {
                        if (current < totalPages - 3) {
                          pages.push(
                            <span key="ellipsis2" className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-500">
                              ...
                            </span>
                          )
                        }
                        pages.push(
                          <button
                            key={totalPages}
                            onClick={() => setCurrentPage(totalPages)}
                            className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50"
                          >
                            {totalPages}
                          </button>
                        )
                      }
                      
                      return pages
                    })()}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(data.pagination.pages, prev + 1))}
                      disabled={currentPage === data.pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div
          className="fixed inset-0 bg-white/40 backdrop-blur-md flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTransaction(null)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Order Details</h3>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-500">Order Number</label>
                  <p className="text-slate-900">{selectedTransaction.orderNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Date</label>
                  <p className="text-slate-900">
                    {new Date(selectedTransaction.createdAt).toLocaleString('en-PH')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Customer</label>
                  <p className="text-slate-900">
                    {selectedTransaction.customerName || 'Walk-in Customer'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Phone</label>
                  <p className="text-slate-900">
                    {selectedTransaction.customerPhone || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Payment Method</label>
                  <p className="text-slate-900">{formatPaymentMethod(selectedTransaction.paymentMethod)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                    {selectedTransaction.status}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="text-sm font-medium text-slate-900 mb-3">Items</h4>
                <div className="space-y-3">
                  {selectedTransaction.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {item.product.imageUrl && (
                          <Image
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <p className="font-medium text-slate-900">{item.product.name}</p>
                          <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-900">₱{(item.quantity * (item.unitPriceCents / 100)).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-slate-200 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="text-slate-900">₱{selectedTransaction.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tax (12%)</span>
                    <span className="text-slate-900">₱{selectedTransaction.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-slate-900">Total</span>
                    <span className="text-amber-700">₱{selectedTransaction.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
