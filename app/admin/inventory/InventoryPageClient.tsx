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
}

interface Props {
  items: Item[]
}

export function InventoryPageClient({ items }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const router = useRouter()

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Inventory</h1>
          <p className="text-slate-600 mt-1">Manage your stock levels and inventory items</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </button>
      </div>

      <div className="card">
        {/* Header */}
        <div className="grid grid-cols-5 gap-4 p-4 bg-slate-50 border-b font-medium text-slate-600 text-sm">
          <div>Name</div>
          <div>Unit</div>
          <div className="text-center">Quantity</div>
          <div className="text-center">Stock Level</div>
          <div className="text-center">Actions</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-5 gap-4 p-4 hover:bg-slate-50 items-center">
              <div>
                <div className="font-medium text-slate-900">{item.name}</div>
              </div>
              <div>
                <span className="text-slate-600">{item.unit}</span>
              </div>
              <div className="text-center">
                <span className="font-mono text-slate-900">{item.quantity}</span>
              </div>
              <div className="text-center">
                {item.lowStockThreshold === null ? (
                  <span className="badge badge-neutral">No threshold</span>
                ) : item.quantity <= item.lowStockThreshold ? (
                  <span className="badge badge-warning">Low Stock</span>
                ) : (
                  <span className="badge badge-success">In Stock</span>
                )}
              </div>
              <div className="text-center">
                <button 
                  onClick={() => openAdjustModal(item)}
                  className="btn btn-ghost text-sm"
                >
                  Adjust Stock
                </button>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-lg font-medium text-slate-900">No inventory items yet</p>
                <p className="text-slate-500">Get started by adding your first inventory item</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Inventory Item">
        <form action={createItem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Item Name</label>
            <input 
              name="name" 
              className="input" 
              placeholder="e.g., Coffee Beans"
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Unit</label>
            <input 
              name="unit" 
              className="input" 
              placeholder="e.g., kg, L, pcs" 
              required 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Initial Quantity</label>
              <input 
                type="number" 
                step="any" 
                name="quantity" 
                defaultValue={0} 
                className="input" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Low Stock Threshold</label>
              <input 
                type="number" 
                step="any" 
                name="low_stock_threshold" 
                className="input" 
                placeholder="e.g., 5" 
              />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              Create Item
            </button>
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="btn"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={isAdjustModalOpen} onClose={() => {setIsAdjustModalOpen(false); setSelectedItem(null)}} title="Adjust Stock">
        {selectedItem && (
          <form action={adjustStock} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-md">
              <p className="text-sm text-slate-600">Adjusting stock for:</p>
              <p className="font-medium text-slate-900">{selectedItem.name}</p>
              <p className="text-sm text-slate-500">Current quantity: {selectedItem.quantity} {selectedItem.unit}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Change Amount</label>
              <input 
                type="number" 
                step="any" 
                name="change" 
                className="input" 
                placeholder="e.g. 10 (add) or -5 (subtract)"
                required 
              />
              <p className="text-xs text-slate-500 mt-1">Use positive numbers to add stock, negative to subtract</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
              <select name="reason" className="select">
                <option value="manual_adjustment">Manual Adjustment</option>
                <option value="purchase">Purchase/Restock</option>
                <option value="spoilage">Spoilage/Waste</option>
                <option value="theft">Theft/Loss</option>
                <option value="correction">Inventory Correction</option>
              </select>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button type="submit" className="btn-primary flex-1">
                Apply Adjustment
              </button>
              <button 
                type="button" 
                onClick={() => {setIsAdjustModalOpen(false); setSelectedItem(null)}}
                className="btn"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
