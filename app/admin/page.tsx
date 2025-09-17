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

export default async function AdminDashboardPage() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const sales = await fetchJson<{ ok: boolean; data: { day: string; total_cents: string; orders_count: string }[] }>(
    `${base}/api/admin/dashboard/sales`
  )
  const best = await fetchJson<{ ok: boolean; data: { name: string; qty: string }[] }>(
    `${base}/api/admin/dashboard/bestsellers`
  )
  const low = await fetchJson<{ ok: boolean; data: { name: string; quantity: string; low_stock_threshold: string }[] }>(
    `${base}/api/admin/dashboard/low-stock`
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded p-4">
          <div className="font-medium mb-2">Daily Sales</div>
          <ul className="text-sm space-y-1">
            {sales?.data?.map((r, i) => (
              <li key={i} className="flex justify-between">
                <span>{new Date(r.day).toLocaleDateString()}</span>
                <span>₱{(Number(r.total_cents) / 100).toFixed(2)} ({r.orders_count})</span>
              </li>
            )) ?? <li>No data</li>}
          </ul>
        </div>
        <div className="border rounded p-4">
          <div className="font-medium mb-2">Best Sellers</div>
          <ul className="text-sm space-y-1">
            {best?.data?.map((r, i) => (
              <li key={i} className="flex justify-between">
                <span>{r.name}</span>
                <span>x{r.qty}</span>
              </li>
            )) ?? <li>No data</li>}
          </ul>
        </div>
        <div className="border rounded p-4">
          <div className="font-medium mb-2">Low Stock Alerts</div>
          <ul className="text-sm space-y-1">
            {low?.data?.map((r, i) => (
              <li key={i} className="flex justify-between">
                <span>{r.name}</span>
                <span>{Number(r.quantity)} / {Number(r.low_stock_threshold)}</span>
              </li>
            )) ?? <li>No data</li>}
          </ul>
        </div>
      </div>
      <div className="border rounded p-4">Recent Activity</div>
    </div>
  )
}


