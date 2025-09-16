export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-screen flex">
      <aside className="w-64 border-r p-4 space-y-2">
        <h2 className="font-semibold">Admin</h2>
        <nav className="flex flex-col gap-2 text-sm">
          <a href="/admin">Dashboard</a>
          <a href="/admin/products">Products</a>
          <a href="/admin/inventory">Inventory</a>
          <a href="/admin/staff">Staff</a>
          <a href="/admin/pos">POS</a>
          <a href="/admin/reports">Reports</a>
          <a href="/admin/loyalty">Loyalty</a>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </section>
  )
}


