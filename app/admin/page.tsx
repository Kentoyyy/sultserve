export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded p-4">Daily Sales</div>
        <div className="border rounded p-4">Best Sellers</div>
        <div className="border rounded p-4">Low Stock Alerts</div>
      </div>
      <div className="border rounded p-4">Recent Activity</div>
    </div>
  )
}


