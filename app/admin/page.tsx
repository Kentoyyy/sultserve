'use client'

import { useState, useEffect } from 'react'

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return data
  } catch {
    return null
  }
}

interface ActivityLog {
  action: string
  entityType: string
  details: string
  timestamp: string
  userInfo: string
}

interface DashboardData {
  sales: { day: string; total_cents: string; orders_count: string }[]
  best: { name: string; qty: string }[]
  low: { name: string; quantity: string; low_stock_threshold: string }[]
  activity: ActivityLog[]
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    const fetchData = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        
        const [salesRes, bestRes, lowRes, activityRes] = await Promise.all([
          fetch(`${base}/api/admin/dashboard/sales`),
          fetch(`${base}/api/admin/dashboard/bestsellers`),
          fetch(`${base}/api/admin/dashboard/low-stock`),
          fetch(`${base}/api/admin/dashboard/activity`)
        ])

        const [sales, best, low, activity] = await Promise.all([
          salesRes.json(),
          bestRes.json(),
          lowRes.json(),
          activityRes.json()
        ])

        console.log('Fetched data:', { sales, best, low, activity })

        setData({
          sales: sales.ok ? sales.data || [] : [],
          best: best.ok ? best.data || [] : [],
          low: low.ok ? low.data || [] : [],
          activity: activity.ok ? activity.data || [] : []
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load dashboard data</p>
        </div>
      </div>
    )
  }

  const { sales, best, low, activity } = data
  const totalPages = Math.ceil(activity.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentActivity = activity.slice(startIndex, endIndex)

  console.log('Dashboard data:', { sales, best, low, activity })

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-1 text-sm sm:text-base">Overview of your café operations</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-xs sm:text-sm text-slate-600">Total Revenue (7 days)</div>
              <div className="text-xl sm:text-2xl font-bold text-amber-700">
                ₱{sales ? (sales.reduce((sum, day) => sum + Number(day.total_cents), 0) / 100).toFixed(2) : '0.00'}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Daily Sales Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 hover:border-amber-300 transition-colors shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">
                  {sales?.length || 0}
                </div>
                <div className="text-sm text-slate-600">Active Days</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-700">Daily Sales</div>
              <div className="space-y-1">
                {sales && sales.length > 0 ? (
                  sales.slice(0, 3).map((day, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">
                        {new Date(day.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-900 font-medium">
                          ₱{(Number(day.total_cents) / 100).toFixed(2)}
                        </span>
                        <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-200">
                          {day.orders_count} orders
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-sm">No sales data</div>
                )}
              </div>
            </div>
          </div>

          {/* Best Sellers Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 hover:border-amber-300 transition-colors shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">
                  {best?.length || 0}
                </div>
                <div className="text-sm text-slate-600">Top Products</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-700">Best Sellers</div>
              <div className="space-y-1">
                {best && best.length > 0 ? (
                  best.slice(0, 3).map((product, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 truncate flex-1 mr-2">
                        {product.name}
                      </span>
                      <span className="text-slate-900 font-medium bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">
                        {product.qty}x
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-sm">No sales data</div>
                )}
              </div>
            </div>
          </div>

          {/* Low Stock Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 hover:border-amber-300 transition-colors shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600">
                  {low?.length || 0}
                </div>
                <div className="text-sm text-slate-600">Low Stock Items</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-700">Stock Alerts</div>
              <div className="space-y-1">
                {low && low.length > 0 ? (
                  low.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 truncate flex-1 mr-2">
                        {item.name}
                      </span>
                      <span className="text-red-600 font-medium bg-red-50 px-2 py-1 rounded text-xs border border-red-200">
                        {item.quantity}/{item.low_stock_threshold}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-sm">All items in stock</div>
                )}
              </div>
            </div>
          </div>

          {/* Orders Summary Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 hover:border-amber-300 transition-colors shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">
                  {sales ? sales.reduce((sum, day) => sum + Number(day.orders_count), 0) : 0}
                </div>
                <div className="text-sm text-slate-600">Total Orders</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-700">Order Summary</div>
              <div className="text-xs text-slate-500">
                Last 7 days performance
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
              <p className="text-slate-600 text-sm">Latest system activities and changes</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-600">Live</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {currentActivity.length ? (
              <>
                {currentActivity.map((log, i) => (
                  <div key={i} className="flex items-center space-x-4 p-3 bg-slate-50 rounded-lg hover:bg-amber-50 transition-colors border border-slate-100">
                    <div className="flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full ${
                        log.action === 'CREATE' ? 'bg-emerald-500' :
                        log.action === 'UPDATE' ? 'bg-blue-500' :
                        log.action === 'DELETE' ? 'bg-red-500' :
                        'bg-slate-400'
                      }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-slate-900">
                          {log.action}
                        </span>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded border border-amber-200">
                          {log.entityType}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1 truncate">
                        {log.details}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-xs text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="text-xs text-slate-600">
                        {log.userInfo}
                      </div>
                    </div>
                  </div>
                ))}
                
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 pt-4">
                    <button 
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <span className="text-sm text-slate-600 px-3">
                      {currentPage} / {totalPages}
                    </span>
                    
                    <button 
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="w-8 h-8 bg-amber-600 text-white rounded-full hover:bg-amber-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-slate-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


