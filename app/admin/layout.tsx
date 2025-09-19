'use client'

import { usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(path)
  }
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Mobile Header */}
      <div className="flex h-14 sm:h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          <label htmlFor="admin-sidebar-toggle" className="lg:hidden cursor-pointer p-2 rounded-md hover:bg-slate-100 transition-colors" data-toggle="sidebar" aria-label="Toggle sidebar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs sm:text-sm">K</span>
            </div>
            <span className="font-semibold text-slate-900 text-sm sm:text-base">SulitServe Café</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200">Admin</span>
          <a 
            href="/login"
            className="text-xs sm:text-sm text-slate-600 hover:text-amber-700 px-2 sm:px-3 py-1 rounded-md hover:bg-amber-50 transition-colors"
          >
            Login
          </a>
        </div>
      </div>

      <div className="flex">
        <input id="admin-sidebar-toggle" type="checkbox" className="hidden peer" />
        <aside className="peer-checked:block hidden lg:block w-64 xl:w-72 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-56px)] sm:min-h-[calc(100vh-64px)] shadow-sm">
          <div className="p-4 sm:p-6">
            {/* Navigation Header */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 sm:mb-4">Navigation</h2>
            </div>

            {/* Main Navigation */}
            <nav className="space-y-2">
              {/* Dashboard */}
              <a className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive('/admin') 
                  ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                  : 'text-slate-700 hover:bg-slate-50 hover:text-amber-700 group'
              }`} href="/admin">
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isActive('/admin') 
                    ? 'bg-amber-100' 
                    : 'bg-slate-100 group-hover:bg-amber-100'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  </svg>
                </div>
                <span>Dashboard</span>
              </a>

              {/* Products */}
              <a className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive('/admin/products') 
                  ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                  : 'text-slate-700 hover:bg-slate-50 hover:text-amber-700 group'
              }`} href="/admin/products">
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isActive('/admin/products') 
                    ? 'bg-amber-100' 
                    : 'bg-slate-100 group-hover:bg-amber-100'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <span>Products</span>
              </a>

              {/* Inventory */}
              <a className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive('/admin/inventory') 
                  ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                  : 'text-slate-700 hover:bg-slate-50 hover:text-amber-700 group'
              }`} href="/admin/inventory">
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isActive('/admin/inventory') 
                    ? 'bg-amber-100' 
                    : 'bg-slate-100 group-hover:bg-amber-100'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span>Inventory</span>
              </a>

              {/* Staff */}
              <a className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive('/admin/staff') 
                  ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                  : 'text-slate-700 hover:bg-slate-50 hover:text-amber-700 group'
              }`} href="/admin/staff">
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isActive('/admin/staff') 
                    ? 'bg-amber-100' 
                    : 'bg-slate-100 group-hover:bg-amber-100'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <span>Staff</span>
              </a>

              {/* POS */}
              <a className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive('/admin/pos') 
                  ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                  : 'text-slate-700 hover:bg-slate-50 hover:text-amber-700 group'
              }`} href="/admin/pos">
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isActive('/admin/pos') 
                    ? 'bg-amber-100' 
                    : 'bg-slate-100 group-hover:bg-amber-100'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <span>POS</span>
              </a>

              {/* Transactions */}
              <a className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive('/admin/transactions') 
                  ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                  : 'text-slate-700 hover:bg-slate-50 hover:text-amber-700 group'
              }`} href="/admin/transactions">
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isActive('/admin/transactions') 
                    ? 'bg-amber-100' 
                    : 'bg-slate-100 group-hover:bg-amber-100'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <span>Transactions</span>
              </a>
            </nav>

            {/* Divider */}
            <div className="my-6 border-t border-slate-200"></div>

            {/* Secondary Navigation */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Management</h3>
            </div>

            <nav className="space-y-2">
              {/* Archive */}
              <a className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive('/admin/archive') 
                  ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                  : 'text-slate-700 hover:bg-slate-50 hover:text-amber-700 group'
              }`} href="/admin/archive">
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isActive('/admin/archive') 
                    ? 'bg-amber-100' 
                    : 'bg-slate-100 group-hover:bg-amber-100'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6 10-10M9 16l2 2 4-4M5 2h14v20H5z" />
                  </svg>
                </div>
                <span>Archive</span>
              </a>

              {/* Activity Logs */}
              <a className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive('/admin/logs') 
                  ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                  : 'text-slate-700 hover:bg-slate-50 hover:text-amber-700 group'
              }`} href="/admin/logs">
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isActive('/admin/logs') 
                    ? 'bg-amber-100' 
                    : 'bg-slate-100 group-hover:bg-amber-100'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span>Activity Logs</span>
              </a>

              {/* Reports */}
              <a className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive('/admin/reports') 
                  ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                  : 'text-slate-700 hover:bg-slate-50 hover:text-amber-700 group'
              }`} href="/admin/reports">
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isActive('/admin/reports') 
                    ? 'bg-amber-100' 
                    : 'bg-slate-100 group-hover:bg-amber-100'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span>Reports</span>
              </a>

              {/* Loyalty */}
              <a className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive('/admin/loyalty') 
                  ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                  : 'text-slate-700 hover:bg-slate-50 hover:text-amber-700 group'
              }`} href="/admin/loyalty">
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isActive('/admin/loyalty') 
                    ? 'bg-amber-100' 
                    : 'bg-slate-100 group-hover:bg-amber-100'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <span>Loyalty</span>
              </a>
            </nav>

            {/* Bottom Section */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">Admin User</p>
                  <p className="text-xs text-slate-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-white min-h-[calc(100vh-56px)] sm:min-h-[calc(100vh-64px)] overflow-x-auto">{children}</main>
      </div>
    </div>
  )
}


