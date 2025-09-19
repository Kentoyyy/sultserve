'use client'

import Head from 'next/head'
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
      <Head>
        <title>SulitServe Café | Cashier</title>
      </Head>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-amber-800 rounded-lg flex items-center justify-center shadow-sm">
                <img src="/images/landing_image.png" alt="SulitServe" className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-slate-900">SulitServe Café</div>
                <div className="text-xs text-amber-600 font-medium">Cashier</div>
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
        </div>
        {/* Navigation */}
        <div className="border-t border-amber-100">
          <nav className="max-w-7xl mx-auto px-4">
            <div className="flex gap-1 py-2">
              <a 
                href="/cashier" 
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-amber-700 hover:bg-amber-50 transition-all"
              >
                Orders
              </a>
              <a 
                href="/cashier/products" 
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-amber-700 hover:bg-amber-50 transition-all"
              >
                Products
              </a>
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6">{children}</main>
    </div>
  )
}






