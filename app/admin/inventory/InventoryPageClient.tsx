'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useRouter } from 'next/navigation'

interface Item {
  id: string
  name: string
  unit: string
  quantity: number
  lowStockThreshold: number | null
  usedBy?: { id: string; name: string; category: string | null }[]
}

interface Props {
  items: Item[]
}

export function InventoryPageClient({ items }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [isUsedByOpen, setIsUsedByOpen] = useState(false)
  const [usedByItem, setUsedByItem] = useState<Item | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const router = useRouter()

  // Filter items based on search and filters
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.unit.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesStock = true
    if (stockFilter === 'low') {
      matchesStock = item.lowStockThreshold !== null && item.quantity <= item.lowStockThreshold
    } else if (stockFilter === 'in_stock') {
      matchesStock = item.lowStockThreshold === null || item.quantity > item.lowStockThreshold
    }
    
    return matchesSearch && matchesStock
  })

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRows = filteredItems.slice(startIndex, endIndex)

  const createItem = async (formData: FormData) => {
    const name = String(formData.get('name') || '')
    const unit = String(formData.get('unit') || '')
    const quantity = Number(formData.get('quantity') || 0)
    const low = formData.get('low_stock_threshold') ? Number(formData.get('low_stock_threshold')) : null

    try {
      const response = await fetch('/api/admin/inventory/items', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, unit, quantity, low_stock_threshold: low })
      })
      
      if (response.ok) {
        setIsModalOpen(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to create item:', error)
    }
  }

  const adjustStock = async (formData: FormData) => {
    if (!selectedItem) return
    
    const change = Number(formData.get('change') || 0)
    const reason = String(formData.get('reason') || 'manual_adjustment')

    try {
      const response = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ inventory_item_id: selectedItem.id, change, reason })
      })
      
      if (response.ok) {
        setIsAdjustModalOpen(false)
        setSelectedItem(null)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to adjust stock:', error)
    }
  }

  const openAdjustModal = (item: Item) => {
    setSelectedItem(item)
    setIsAdjustModalOpen(true)
  }

  const openUsedByModal = (item: Item) => {
    setUsedByItem(item)
    setIsUsedByOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inventory</h1>
          <p className="text-slate-600 mt-1">Manage your stock levels and inventory items</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search inventory items..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
            />
          </div>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => { setStockFilter(e.target.value); setCurrentPage(1) }}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
          >
            <option value="all">All Stock Levels</option>
            <option value="low">Low Stock</option>
            <option value="in_stock">In Stock</option>
          </select>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-slate-600">
          Showing {currentRows.length ? `${startIndex + 1}-${Math.min(endIndex, filteredItems.length)}` : 0} of {filteredItems.length} items
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            <div className="col-span-4">Item</div>
            <div className="col-span-2">Unit</div>
            <div className="col-span-2 text-center">Quantity</div>
            <div className="col-span-2 text-center">Stock Level</div>
            <div className="col-span-2 text-center">Actions</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-slate-200">
          {currentRows.map((item) => (
            <div key={item.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Item Name */}
                <div className="col-span-4">
                  <div className="font-medium text-slate-900">{item.name}</div>
                </div>

                {/* Unit */}
                <div className="col-span-2">
                  <span className="text-slate-600 text-sm">{item.unit}</span>
                </div>

                {/* Quantity */}
                <div className="col-span-2 text-center">
                  <span className="font-mono text-slate-900 font-medium">{item.quantity}</span>
                </div>

                {/* Stock Level */}
                <div className="col-span-2 text-center">
                  {item.lowStockThreshold === null ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      No threshold
                    </span>
                  ) : item.quantity <= item.lowStockThreshold ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Low Stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      In Stock
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-2 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => openAdjustModal(item)}
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Adjust Stock
                    </button>
                    {item.usedBy && item.usedBy.length > 0 ? (
                      <button
                        onClick={() => openUsedByModal(item)}
                        className="text-slate-700 hover:text-amber-700 hover:bg-amber-50 px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Used by ({item.usedBy.length})
                      </button>
                    ) : (
                      <a href="/admin/products" className="text-slate-400 hover:text-amber-700 hover:bg-amber-50 px-3 py-1 rounded text-sm font-medium transition-colors">
                        No usage
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="py-12 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-slate-900 mb-2">
                  {searchTerm || stockFilter !== 'all' ? 'No items found' : 'No inventory items yet'}
                </p>
                <p className="text-slate-500">
                  {searchTerm || stockFilter !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Get started by adding your first inventory item'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button 
            onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
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
            onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-8 h-8 bg-amber-600 text-white rounded-full hover:bg-amber-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Inventory Item">
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-lg font-semibold text-slate-900">Add Inventory Item</h3>
            <p className="text-sm text-slate-600 mt-1">Create a new inventory item for stock tracking</p>
          </div>

          <form action={createItem} className="space-y-6">
            {/* Item Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Item Name</label>
              <input 
                name="name" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" 
                placeholder="e.g., Coffee Beans, Milk, Sugar"
                required 
              />
            </div>
            
            {/* Unit */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Unit of Measurement</label>
              <input 
                name="unit" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" 
                placeholder="e.g., kg, L, pcs, cups" 
                required 
              />
              <p className="text-xs text-slate-500">Enter the unit used to measure this item</p>
            </div>
            
            {/* Quantity and Threshold Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Initial Quantity</label>
                <input 
                  type="number" 
                  step="any" 
                  name="quantity" 
                  defaultValue={0} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" 
                />
                <p className="text-xs text-slate-500">Starting quantity in inventory</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Low Stock Threshold</label>
                <input 
                  type="number" 
                  step="any" 
                  name="low_stock_threshold" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" 
                  placeholder="e.g., 5" 
                />
                <p className="text-xs text-slate-500">Alert when quantity falls below this level</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button 
                type="submit" 
                className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm"
              >
                Create Item
              </button>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal open={isAdjustModalOpen} onClose={() => {setIsAdjustModalOpen(false); setSelectedItem(null)}} title="Adjust Stock">
        {selectedItem && (
          <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-lg font-semibold text-slate-900">Adjust Stock</h3>
              <p className="text-sm text-slate-600 mt-1">Update inventory quantity for this item</p>
            </div>

            {/* Item Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900">{selectedItem.name}</p>
                  <p className="text-sm text-slate-600">Current: {selectedItem.quantity} {selectedItem.unit}</p>
                </div>
              </div>
            </div>

            <form action={adjustStock} className="space-y-6">
              {/* Change Amount */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Adjustment Amount</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-500 text-sm">±</span>
                  </div>
                  <input 
                    type="number" 
                    step="any" 
                    name="change" 
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" 
                    placeholder="e.g. 10 (add) or -5 (subtract)"
                    required 
                  />
                </div>
                <p className="text-xs text-slate-500">Use positive numbers to add stock, negative to subtract</p>
              </div>
              
              {/* Reason */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Reason for Adjustment</label>
                <select name="reason" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm">
                  <option value="manual_adjustment">Manual Adjustment</option>
                  <option value="purchase">Purchase/Restock</option>
                  <option value="spoilage">Spoilage/Waste</option>
                  <option value="theft">Theft/Loss</option>
                  <option value="correction">Inventory Correction</option>
                </select>
                <p className="text-xs text-slate-500">Select the reason for this stock adjustment</p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button 
                  type="submit" 
                  className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm"
                >
                  Apply Adjustment
                </button>
                <button 
                  type="button" 
                  onClick={() => {setIsAdjustModalOpen(false); setSelectedItem(null)}}
                  className="flex-1 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Used By Modal */}
      <Modal open={isUsedByOpen} onClose={() => {setIsUsedByOpen(false); setUsedByItem(null)}} title="Used By Products">
        {usedByItem && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-md text-sm text-slate-700">
              Ingredients usage for: <span className="font-medium text-slate-900">{usedByItem.name}</span>
            </div>

            {(() => {
              const groups: Record<string, { id: string; name: string }[]> = {}
              for (const p of usedByItem.usedBy || []) {
                const key = p.category || 'Uncategorized'
                if (!groups[key]) groups[key] = []
                groups[key].push({ id: p.id, name: p.name })
              }
              const categories = Object.keys(groups).sort()
              return (
                <div className="space-y-4">
                  {categories.map(cat => (
                    <div key={cat}>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{cat}</div>
                      <ul className="space-y-1">
                        {groups[cat].map(p => (
                          <li key={p.id} className="flex items-center justify-between">
                            <span className="text-slate-800 text-sm">{p.name}</span>
                            <a href={`/admin/products/${p.id}`} className="text-amber-700 hover:underline text-sm">View</a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )
            })()}

            <div className="pt-2">
              <a href="/admin/products" className="inline-flex items-center gap-2 text-sm text-amber-700 hover:text-amber-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add related product
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
