'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CashierLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      
      // Check if user has cashier access
      if (!parsedUser.role || !['cashier', 'admin', 'manager'].includes(parsedUser.role.code)) {
        alert('Access denied. You need cashier privileges.')
        router.push('/login')
        return
      }
    } else {
      router.push('/login')
    }
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
    
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-semibold text-slate-900">SulitServe Café - Cashier</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-slate-900">{user.fullName}</div>
            <div className="text-xs text-slate-500">{user.role?.name}</div>
          </div>
          <button 
            onClick={handleLogout}
            className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-slate-200 bg-white">
        <nav className="px-6">
          <div className="flex space-x-8">
            <a 
              href="/cashier" 
              className="border-b-2 border-emerald-500 py-4 px-1 text-sm font-medium text-emerald-600"
            >
              Orders
            </a>
            <a 
              href="/cashier/products" 
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-slate-500 hover:text-slate-700 hover:border-slate-300"
            >
              Products
            </a>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <main className="p-6">{children}</main>
    </div>
  )
}



