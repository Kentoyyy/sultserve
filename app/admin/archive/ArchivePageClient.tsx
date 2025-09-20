'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal'

interface ArchivedProduct {
  id: string
  name: string
  category: string | null
  priceCents: number
  status: string
  archivedAt: Date | null
}

interface Props {
  archivedProducts: ArchivedProduct[]
}

export function ArchivePageClient({ archivedProducts }: Props) {
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false)
  const [productToRestore, setProductToRestore] = useState<ArchivedProduct | null>(null)
  const router = useRouter()

  const openRestoreModal = (product: ArchivedProduct) => {
    setProductToRestore(product)
    setIsRestoreModalOpen(true)
  }

  const confirmRestore = async () => {
    if (!productToRestore) return

    try {
      const response = await fetch(`/api/admin/products/${productToRestore.id}/restore`, {
        method: 'POST'
      })
      
      if (response.ok) {
        setProductToRestore(null)
        router.refresh()
      } else {
        alert('Failed to restore product. Please try again.')
      }
    } catch (error) {
      console.error('Failed to restore product:', error)
      alert('Failed to restore product. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Archive</h1>
          <p className="text-slate-600 mt-1">Manage archived products and restore them when needed</p>
        </div>
        <div className="text-sm text-slate-500">
          {archivedProducts.length} archived product{archivedProducts.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="card">
        {/* Header */}
        <div className="grid grid-cols-6 gap-4 p-4 bg-slate-50 border-b font-medium text-slate-600 text-sm">
          <div>Product</div>
          <div>Category</div>
          <div className="text-center">Price</div>
          <div className="text-center">Archived Date</div>
          <div className="text-center">Status</div>
          <div className="text-center">Actions</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100">
          {archivedProducts.map((product) => (
            <div key={product.id} className="grid grid-cols-6 gap-4 p-4 hover:bg-slate-50 items-center">
              <div>
                <div className="font-medium text-slate-900">{product.name}</div>
              </div>
              <div>
                {product.category ? (
                  <span className="badge badge-neutral">{product.category}</span>
                ) : (
                  <span className="text-slate-400">No category</span>
                )}
              </div>
              <div className="text-center">
                <span className="font-mono text-slate-900">₱{(product.priceCents/100).toFixed(2)}</span>
              </div>
              <div className="text-center">
                <span className="text-slate-600 text-sm">
                  {product.archivedAt ? new Date(product.archivedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 'Unknown'}
                </span>
              </div>
              <div className="text-center">
                <span className="badge badge-neutral">Archived</span>
              </div>
              <div className="text-center">
                <button 
                  onClick={() => openRestoreModal(product)}
                  className="btn btn-ghost text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Restore
                </button>
              </div>
            </div>
          ))}

          {archivedProducts.length === 0 && (
            <div className="py-16 text-center text-slate-500">
              <div className="flex flex-col items-center">
                <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="text-xl font-medium text-slate-900 mb-2">No archived products</h3>
                <p className="text-slate-500 max-w-sm">
                  When you archive products from the Products page, they will appear here and can be restored at any time.
                </p>
                <Link 
                  href="/admin/products" 
                  className="mt-4 btn-primary inline-flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Go to Products
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmModal
        open={isRestoreModalOpen}
        onClose={() => {setIsRestoreModalOpen(false); setProductToRestore(null)}}
        onConfirm={confirmRestore}
        title="Restore Product"
        message="This will move the product back to your active catalog and make it available again."
        itemName={productToRestore?.name}
        actionType="restore"
      />
    </div>
  )
}
