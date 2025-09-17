export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <label htmlFor="admin-sidebar-toggle" className="md:hidden btn-ghost" data-toggle="sidebar" aria-label="Toggle sidebar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-semibold text-slate-900">SulitServe Café</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">Development</span>
          <a 
            href="/login"
            className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            Login
          </a>
        </div>
      </div>

      <div className="flex">
        <input id="admin-sidebar-toggle" type="checkbox" className="hidden peer" />
        <aside className="peer-checked:block hidden md:block w-64 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-64px)]">
          <nav className="p-4 space-y-1">
            <a className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 text-slate-700" href="/admin">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              Dashboard
            </a>
            <a className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 text-slate-700" href="/admin/products">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Products
            </a>
            <a className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 text-slate-700" href="/admin/inventory">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Inventory
            </a>
            <a className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 text-slate-700" href="/admin/archive">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6 10-10M9 16l2 2 4-4M5 2h14v20H5z" />
              </svg>
              Archive
            </a>
            <a className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 text-slate-700" href="/admin/logs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Activity Logs
            </a>
            <a className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 text-slate-700" href="/admin/staff">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Staff
            </a>
            <a className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 text-slate-700" href="/admin/pos">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              POS
            </a>
            <a className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 text-slate-700" href="/admin/reports">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Reports
            </a>
            <a className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 text-slate-700" href="/admin/loyalty">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Loyalty
            </a>
          </nav>
        </aside>
        <main className="flex-1 p-8 bg-slate-50">{children}</main>
      </div>
    </div>
  )
}


