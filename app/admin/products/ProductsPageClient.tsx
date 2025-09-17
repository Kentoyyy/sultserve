'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal'
import { useRouter } from 'next/navigation'

// Predefined coffee shop products with categories
const PREDEFINED_PRODUCTS = {
  coffee: [
    { name: 'Americano', basePrice: 120 },
    { name: 'Cappuccino', basePrice: 140 },
    { name: 'Latte', basePrice: 150 },
    { name: 'Espresso', basePrice: 100 },
    { name: 'Macchiato', basePrice: 160 },
    { name: 'Mocha', basePrice: 170 },
    { name: 'Frappuccino', basePrice: 180 },
    { name: 'Cold Brew', basePrice: 130 },
    { name: 'Iced Coffee', basePrice: 110 }
  ],
  tea: [
    { name: 'Classic Milk Tea', basePrice: 80 },
    { name: 'Taro Milk Tea', basePrice: 90 },
    { name: 'Matcha Milk Tea', basePrice: 100 },
    { name: 'Thai Milk Tea', basePrice: 85 },
    { name: 'Wintermelon Milk Tea', basePrice: 90 },
    { name: 'Okinawa Milk Tea', basePrice: 95 },
    { name: 'Brown Sugar Milk Tea', basePrice: 110 }
  ],
  pastries: [
    { name: 'Croissant', basePrice: 60 },
    { name: 'Danish Pastry', basePrice: 70 },
    { name: 'Muffin (Blueberry)', basePrice: 80 },
    { name: 'Muffin (Chocolate)', basePrice: 80 },
    { name: 'Cinnamon Roll', basePrice: 90 },
    { name: 'Donut', basePrice: 50 },
    { name: 'Bagel', basePrice: 65 }
  ],
  snacks: [
    { name: 'French Fries', basePrice: 120 },
    { name: 'Onion Rings', basePrice: 130 },
    { name: 'Chicken Wings', basePrice: 180 },
    { name: 'Nachos', basePrice: 150 },
    { name: 'Garlic Bread', basePrice: 90 },
    { name: 'Club Sandwich', basePrice: 200 },
    { name: 'Burger', basePrice: 250 }
  ]
}

interface AddProductFormProps {
  categories: Category[]
  onSubmit: (formData: FormData) => void
  onCancel: () => void
}

function AddProductForm({ categories, onSubmit, onCancel }: AddProductFormProps) {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [isCustomProduct, setIsCustomProduct] = useState(false)
  const [customPrice, setCustomPrice] = useState('')

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setSelectedProduct('')
    setIsCustomProduct(false)
    setCustomPrice('')
  }

  const handleProductChange = (product: string) => {
    setSelectedProduct(product)
    setIsCustomProduct(product === 'other')
    
    if (product !== 'other' && selectedCategory) {
      const categoryProducts = PREDEFINED_PRODUCTS[selectedCategory as keyof typeof PREDEFINED_PRODUCTS]
      const foundProduct = categoryProducts?.find(p => p.name === product)
      if (foundProduct) {
        setCustomPrice((foundProduct.basePrice / 100).toFixed(2))
      }
    } else {
      setCustomPrice('')
    }
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
        <select 
          value={selectedCategory}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="select" 
          required
        >
          <option value="">Select a category</option>
          <option value="coffee">☕ Coffee</option>
          <option value="tea">🧋 Milk Tea & Tea</option>
          <option value="pastries">🥐 Pastries & Baked Goods</option>
          <option value="snacks">🍟 Snacks & Food</option>
        </select>
      </div>

      {selectedCategory && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Product</label>
          <select 
            value={selectedProduct}
            onChange={(e) => handleProductChange(e.target.value)}
            className="select" 
            required
          >
            <option value="">Select a product</option>
            {PREDEFINED_PRODUCTS[selectedCategory as keyof typeof PREDEFINED_PRODUCTS]?.map((product) => (
              <option key={product.name} value={product.name}>
                {product.name} (₱{(product.basePrice / 100).toFixed(2)})
              </option>
            ))}
            <option value="other">➕ Other (Custom Product)</option>
          </select>
        </div>
      )}

      {isCustomProduct && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Custom Product Name</label>
          <input 
            name="custom_name" 
            className="input" 
            placeholder="Enter custom product name"
            required 
          />
        </div>
      )}

      <input type="hidden" name="name" value={isCustomProduct ? '' : selectedProduct} />
      <input type="hidden" name="category_type" value={selectedCategory} />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Price (₱)</label>
        <input 
          type="number" 
          step="0.01" 
          name="price" 
          className="input" 
          value={customPrice}
          onChange={(e) => setCustomPrice(e.target.value)}
          placeholder="0.00"
          required 
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Supabase Category</label>
        <select name="category_id" className="select">
          <option value="">Select database category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-1">Optional: Link to existing database category</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
        <select name="status" className="select">
          <option value="available">Available</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
        <textarea 
          name="description" 
          className="input" 
          rows={3}
          placeholder="Product description..."
        />
      </div>
      
      <div className="flex gap-3 pt-4">
        <button type="submit" className="btn-primary flex-1">
          Create Product
        </button>
        <button 
          type="button" 
          onClick={onCancel}
          className="btn"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

interface Product {
  id: string
  name: string
  category: string | null
  priceCents: number
  status: string
  hasRecipe: boolean
  canMake: number
  limitingIngredient: string | null
}

interface Category {
  id: string
  name: string
}

interface Props {
  products: Product[]
  categories: Category[]
}

export function ProductsPageClient({ products, categories }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const router = useRouter()

  const createProduct = async (formData: FormData) => {
    const predefinedName = String(formData.get('name') || '')
    const customName = String(formData.get('custom_name') || '')
    const name = customName || predefinedName
    const price = Math.round(Number(formData.get('price') || 0) * 100)
    const categoryType = String(formData.get('category_type') || '')
    const status = String(formData.get('status') || 'available')
    const description = String(formData.get('description') || '') || null

    if (!name) {
      alert('Please select a product or enter a custom name')
      return
    }

    // Map category type to actual category ID
    const categoryMap: Record<string, string> = {
      'coffee': 'Coffee',
      'tea': 'Milk Tea & Tea', 
      'pastries': 'Pastries & Baked Goods',
      'snacks': 'Snacks & Food'
    }
    
    const categoryName = categoryMap[categoryType]
    const category = categories.find(c => c.name === categoryName)
    const category_id = category?.id || null

    try {
      const payload = { name, price_cents: price, category_id, status, description }
      console.log('Sending payload:', payload)
      
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const result = await response.json()
      console.log('Response:', result)
      
      if (response.ok) {
        setIsModalOpen(false)
        router.refresh()
      } else {
        alert(`Failed to create product: ${result.error}`)
      }
    } catch (error) {
      console.error('Failed to create product:', error)
      alert('Failed to create product. Please try again.')
    }
  }

  const editProduct = async (formData: FormData) => {
    if (!selectedProduct) return
    
    const name = String(formData.get('name') || '')
    const price = Math.round(Number(formData.get('price') || 0) * 100)
    const status = String(formData.get('status') || 'available')
    const description = String(formData.get('description') || '') || null

    try {
      const response = await fetch(`/api/admin/products/${selectedProduct.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, priceCents: price, status, description })
      })
      
      if (response.ok) {
        setIsEditModalOpen(false)
        setSelectedProduct(null)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to edit product:', error)
    }
  }

  const openEditModal = (product: Product) => {
    setSelectedProduct(product)
    setIsEditModalOpen(true)
  }

  const openDeleteModal = (product: Product) => {
    setProductToDelete(product)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!productToDelete) return

    try {
      const response = await fetch(`/api/admin/products/${productToDelete.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setProductToDelete(null)
        router.refresh()
      } else {
        alert('Failed to archive product. Please try again.')
      }
    } catch (error) {
      console.error('Failed to archive product:', error)
      alert('Failed to archive product. Please try again.')
    }
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
          <p className="text-slate-600 mt-1">Manage your menu items and product catalog</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      <div className="card">
        {/* Header */}
        <div className="grid grid-cols-6 gap-4 p-4 bg-slate-50 border-b font-medium text-slate-600 text-sm">
          <div>Product</div>
          <div>Category</div>
          <div className="text-center">Price</div>
          <div className="text-center">Status</div>
          <div className="text-center">Stock</div>
          <div className="text-center">Actions</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100">
          {products.map((product) => (
            <div key={product.id} className="grid grid-cols-6 gap-4 p-4 hover:bg-slate-50 items-center">
              <div>
                <div className="font-medium text-slate-900">{product.name}</div>
                {!product.hasRecipe && (
                  <div className="text-xs text-amber-600">⚠️ No recipe</div>
                )}
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
                {product.status === 'available' ? (
                  <span className="badge badge-success">Available</span>
                ) : (
                  <span className="badge badge-warning">Out of Stock</span>
                )}
              </div>
              <div className="text-center">
                {product.hasRecipe ? (
                  product.canMake > 0 ? (
                    <div>
                      <span className="badge badge-success">Can make {product.canMake}</span>
                      {product.canMake < 10 && product.limitingIngredient && (
                        <div className="text-xs text-amber-600 mt-1">
                          Limited by {product.limitingIngredient}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <span className="badge badge-danger">Out of stock</span>
                      {product.limitingIngredient && (
                        <div className="text-xs text-red-600 mt-1">
                          Need {product.limitingIngredient}
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <span className="text-slate-400 text-sm">No recipe</span>
                )}
              </div>
              <div className="text-center">
                <div className="flex gap-2 justify-center">
                  <button 
                    onClick={() => openEditModal(product)}
                    className="btn btn-ghost text-sm"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => openDeleteModal(product)}
                    className="btn btn-ghost text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-lg font-medium text-slate-900">No products yet</p>
                <p className="text-slate-500">Get started by adding your first product</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Product">
        <AddProductForm 
          categories={categories} 
          onSubmit={createProduct}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal open={isEditModalOpen} onClose={() => {setIsEditModalOpen(false); setSelectedProduct(null)}} title="Edit Product">
        {selectedProduct && (
          <form action={editProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Product Name</label>
              <input 
                name="name" 
                className="input" 
                defaultValue={selectedProduct.name}
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Price (₱)</label>
              <input 
                type="number" 
                step="0.01" 
                name="price" 
                className="input" 
                defaultValue={(selectedProduct.priceCents/100).toFixed(2)}
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select name="status" className="select" defaultValue={selectedProduct.status}>
                <option value="available">Available</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea 
                name="description" 
                className="input" 
                rows={3}
                placeholder="Product description..."
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button type="submit" className="btn-primary flex-1">
                Update Product
              </button>
              <button 
                type="button" 
                onClick={() => {setIsEditModalOpen(false); setSelectedProduct(null)}}
                className="btn"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>

      <DeleteConfirmModal
        open={isDeleteModalOpen}
        onClose={() => {setIsDeleteModalOpen(false); setProductToDelete(null)}}
        onConfirm={confirmDelete}
        title="Archive Product"
        message="This will move the product to the archive. You can restore it later."
        itemName={productToDelete?.name}
        actionType="archive"
      />
    </div>
  )
}
