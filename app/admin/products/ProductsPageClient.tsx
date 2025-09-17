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
  const [customName, setCustomName] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setSelectedProduct('')
    setIsCustomProduct(false)
    setCustomPrice('')
    setCustomName('')
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
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-lg font-semibold text-slate-900">Add New Product</h3>
        <p className="text-sm text-slate-600 mt-1">Create a new product for your menu</p>
      </div>

      <form action={onSubmit} className="space-y-6">
        {/* Category Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Product Category</label>
          <select 
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" 
            required
          >
            <option value="">Choose a category</option>
            <option value="coffee">☕ Coffee</option>
            <option value="tea">🧋 Milk Tea & Tea</option>
            <option value="pastries">🥐 Pastries & Baked Goods</option>
            <option value="snacks">🍟 Snacks & Food</option>
          </select>
        </div>

        {/* Product Selection */}
        {selectedCategory && (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Product</label>
            <select 
              value={selectedProduct}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" 
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

        {/* Custom Product Name */}
        {isCustomProduct && (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Custom Product Name</label>
            <input 
              name="custom_name" 
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" 
              placeholder="Enter custom product name"
              required 
            />
          </div>
        )}

        {/* Image Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Product Image</label>
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="text-sm"
            />
            <button
              type="button"
              disabled={!imageFile || isUploading}
              onClick={async () => {
                if (!imageFile) return
                setIsUploading(true)
                setNotice(null)
                try {
                  const fd = new FormData()
                  fd.append('file', imageFile)
                  const res = await fetch('/api/upload', { method: 'POST', body: fd })
                  const result = await res.json()
                  if (res.ok) {
                    setImageUrl(result.url)
                    setNotice({ type: 'success', message: 'Image uploaded. Will be saved on Create Product.' })
                  } else {
                    setNotice({ type: 'error', message: result.error || 'Upload failed' })
                  }
                } finally {
                  setIsUploading(false)
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 text-sm"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          {imageUrl && (
            <div className="text-xs text-emerald-700">Uploaded: {imageUrl}</div>
          )}
          {notice && (
            <div className={`text-xs mt-1 px-2 py-1 rounded border ${notice.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : notice.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>{notice.message}</div>
          )}
        </div>

        <input type="hidden" name="name" value={isCustomProduct ? customName : selectedProduct} />
        <input type="hidden" name="category_type" value={selectedCategory} />

        {/* Price and Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Price (₱)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-slate-500 text-sm">₱</span>
              </div>
              <input 
                type="number" 
                step="0.01" 
                name="price" 
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" 
                placeholder="0.00"
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Status</label>
            <select name="status" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm">
              <option value="available">Available</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Database Category */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Database Category</label>
          <select name="category_id" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm">
            <option value="">Select database category (optional)</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500">Link to existing database category for better organization</p>
        </div>
        
        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Description</label>
          <textarea 
            name="description" 
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm resize-none" 
            rows={3}
            placeholder="Enter product description (optional)..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button 
            type="submit" 
            className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm"
          >
            Create Product
          </button>
          <button 
            type="button" 
            onClick={onCancel}
            className="flex-1 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
          >
            Cancel
          </button>
        </div>
        <input type="hidden" name="uploaded_image_url" value={imageUrl} />
      </form>
    </div>
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
  ingredients?: { id: string; inventoryItemId: string; name: string; quantityNeeded: number; unit: string; available: number }[]
  imageUrl?: string | null
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
  const [isIngredientsOpen, setIsIngredientsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const router = useRouter()

  const [editNewImageUrl, setEditNewImageUrl] = useState('')
  const [editRemoveImage, setEditRemoveImage] = useState(false)
  const [editNotice, setEditNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  // Pagination for products
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRows = filteredProducts.slice(startIndex, endIndex)

  // Reset page when filters/search change
  const resetPage = () => setCurrentPage(1)

  const createProduct = async (formData: FormData) => {
    const predefinedName = String(formData.get('name') || '')
    const customName = String(formData.get('custom_name') || '')
    const name = customName || predefinedName
    const price = Math.round(Number(formData.get('price') || 0) * 100)
    const categoryType = String(formData.get('category_type') || '')
    const status = String(formData.get('status') || 'available')
    const description = String(formData.get('description') || '') || null
    const image_url = String(formData.get('uploaded_image_url') || '') || null

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
      const payload = { name, price_cents: price, category_id, status, description, image_url }
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
    const newImage = String(formData.get('new_image_url') || '')
    const currentImage = String(formData.get('current_image') || '')

    const body: any = { name, priceCents: price, status, description }
    if (newImage || currentImage === '') {
      // replace or remove
      body.imageUrl = newImage || null
    }

    try {
      const response = await fetch(`/api/admin/products/${selectedProduct.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
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
    setEditNewImageUrl('')
    setEditRemoveImage(false)
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-600 mt-1">Manage your menu items and product catalog</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); resetPage() }}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); resetPage() }}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); resetPage() }}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>{category.name}</option>
            ))}
          </select>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-slate-600">
          Showing {currentRows.length ? `${startIndex + 1}-${Math.min(endIndex, filteredProducts.length)}` : 0} of {filteredProducts.length} products
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="bg-slate-50 px-4 sm:px-6 py-4 border-b border-slate-200">
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 sm:gap-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            <div className="col-span-2 sm:col-span-3">Product</div>
            <div className="col-span-1 sm:col-span-2 hidden sm:block">Category</div>
            <div className="col-span-1 text-center">Price</div>
            <div className="col-span-1 sm:col-span-2 text-center">Status</div>
            <div className="col-span-1 sm:col-span-2 text-center hidden sm:block">Stock</div>
            <div className="col-span-1 sm:col-span-2 text-center">Actions</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-slate-200">
          {currentRows.map((product) => (
            <div key={product.id} className="px-4 sm:px-6 py-4 hover:bg-slate-50 transition-colors">
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
                {/* Product */}
                <div className="col-span-2 sm:col-span-3">
                  <div className="flex items-center gap-3">
                    <img src={(product as any).imageUrl || '/placeholder.png'} alt={product.name} className="w-10 h-10 rounded object-cover border" />
                    <div>
                      <div className="font-medium text-slate-900 text-sm sm:text-base">{product.name}</div>
                      {!product.hasRecipe && (
                        <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          No recipe
                        </div>
                      )}
                      {/* Mobile: Show category below product name */}
                      <div className="sm:hidden mt-1">
                        {product.category ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            {product.category}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">No category</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category - Desktop only */}
                <div className="col-span-1 sm:col-span-2 hidden sm:block">
                  {product.category ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {product.category}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-sm">No category</span>
                  )}
                </div>

                {/* Price */}
                <div className="col-span-1 text-center">
                  <span className="font-mono text-slate-900 font-medium text-sm">₱{(product.priceCents/100).toFixed(2)}</span>
                </div>

                {/* Status */}
                <div className="col-span-1 sm:col-span-2 text-center">
                  {product.status === 'available' ? (
                    <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Stock - Desktop only */}
                <div className="col-span-1 sm:col-span-2 text-center hidden sm:block">
                  {product.hasRecipe ? (
                    product.canMake > 0 ? (
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          Can make {product.canMake}
                        </span>
                        {product.canMake < 10 && product.limitingIngredient && (
                          <div className="text-xs text-amber-600 mt-1">
                            Limited by {product.limitingIngredient}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Out of stock
                        </span>
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

                {/* Actions */}
                <div className="col-span-1 sm:col-span-2 text-center">
                  <div className="flex gap-1 sm:gap-2 justify-center">
                    <button
                      onClick={() => { setSelectedProduct(product); setIsIngredientsOpen(true) }}
                      className="text-slate-700 hover:text-amber-700 hover:bg-amber-50 px-1 sm:px-2 py-1 rounded text-xs sm:text-sm font-medium transition-colors"
                    >
                      Ingredients
                    </button>
                    <button 
                      onClick={() => openEditModal(product)}
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-1 sm:px-2 py-1 rounded text-xs sm:text-sm font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => openDeleteModal(product)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 px-1 sm:px-2 py-1 rounded text-xs sm:text-sm font-medium transition-colors"
                    >
                      Archive
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="py-12 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-slate-900 mb-2">
                  {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' ? 'No products found' : 'No products yet'}
                </p>
                <p className="text-slate-500">
                  {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Get started by adding your first product'
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

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Product">
        <AddProductForm 
          categories={categories} 
          onSubmit={createProduct}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal open={isEditModalOpen} onClose={() => {setIsEditModalOpen(false); setSelectedProduct(null)}} title="Edit Product">
        {selectedProduct && (
          <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-lg font-semibold text-slate-900">Edit Product</h3>
              <p className="text-sm text-slate-600 mt-1">Update product information</p>
            </div>

            <form action={editProduct} className="space-y-6">
              {/* Product Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Product Name</label>
                <input 
                  name="name" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" 
                  defaultValue={selectedProduct.name}
                  required 
                />
              </div>
              
              {/* Image controls */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Product Image</label>
                <div className="flex items-center gap-3">
                  <img src={(editNewImageUrl || (selectedProduct as any).imageUrl || '/placeholder.png')} alt="preview" className="w-16 h-16 rounded object-cover border" />
                  <input type="hidden" name="new_image_url" value={editNewImageUrl} />
                  <input type="hidden" name="current_image" value={editRemoveImage ? '' : ((selectedProduct as any).imageUrl || '')} />
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm"
                    onClick={async () => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.onchange = async () => {
                        const file = input.files?.[0]
                        if (!file) return
                        setEditNotice(null)
                        const fd = new FormData()
                        fd.append('file', file)
                        const res = await fetch('/api/upload', { method: 'POST', body: fd })
                        const result = await res.json()
                        if (res.ok) {
                          setEditNewImageUrl(result.url)
                          setEditRemoveImage(false)
                          setEditNotice({ type: 'success', message: 'Image uploaded. Click Update Product to save.' })
                        } else {
                          setEditNotice({ type: 'error', message: result.error || 'Upload failed' })
                        }
                      }
                      input.click()
                    }}
                  >
                    Replace Image
                  </button>
                  {(selectedProduct as any).imageUrl && !editRemoveImage && (
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-sm"
                      onClick={() => { setEditRemoveImage(true); setEditNewImageUrl(''); setEditNotice({ type: 'info', message: 'Image will be removed after saving.' }) }}
                    >
                      Remove Image
                    </button>
                  )}
                  {editRemoveImage && (
                    <span className="text-xs text-red-600">Will remove on save</span>
                  )}
                </div>
                {editNotice && (
                  <div className={`text-xs mt-2 px-2 py-1 rounded border ${editNotice.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : editNotice.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>{editNotice.message}</div>
                )}
              </div>
              
              {/* Price and Status Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Price (₱)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-500 text-sm">₱</span>
                    </div>
                    <input 
                      type="number" 
                      step="0.01" 
                      name="price" 
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" 
                      defaultValue={(selectedProduct.priceCents/100).toFixed(2)}
                      required 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Status</label>
                  <select name="status" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm" defaultValue={selectedProduct.status}>
                    <option value="available">Available</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Description</label>
                <textarea 
                  name="description" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm resize-none" 
                  rows={3}
                  placeholder="Enter product description (optional)..."
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button 
                  type="submit" 
                  className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm"
                >
                  Update Product
                </button>
                <button 
                  type="button" 
                  onClick={() => {setIsEditModalOpen(false); setSelectedProduct(null)}}
                  className="flex-1 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Ingredients Modal */}
      <Modal open={isIngredientsOpen} onClose={() => { setIsIngredientsOpen(false); setSelectedProduct(null) }} title="Ingredients">
        {selectedProduct && (
          <div className="space-y-4">
            {!selectedProduct.hasRecipe && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
                This product has no recipe yet. Add a recipe to track stock automatically.
              </div>
            )}

            {selectedProduct.hasRecipe && selectedProduct.ingredients && selectedProduct.ingredients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-600 border-b">
                      <th className="py-2 pr-3">Ingredient</th>
                      <th className="py-2 pr-3">Needed</th>
                      <th className="py-2 pr-3">Available</th>
                      <th className="py-2 pr-3">Can make</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProduct.ingredients.map(ing => {
                      const can = ing.quantityNeeded > 0 ? Math.floor(ing.available / ing.quantityNeeded) : 0
                      return (
                        <tr key={ing.id} className="border-b last:border-0">
                          <td className="py-2 pr-3 text-slate-900">{ing.name}</td>
                          <td className="py-2 pr-3">{ing.quantityNeeded} {ing.unit}</td>
                          <td className="py-2 pr-3">{ing.available} {ing.unit}</td>
                          <td className="py-2 pr-3 font-medium">{can}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-slate-500">No ingredients yet.</div>
            )}

            <div className="pt-2 flex gap-3">
              <a href={`/admin/products/${selectedProduct.id}`} className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium">
                {selectedProduct.hasRecipe ? 'Edit Recipe' : 'Add Recipe'}
              </a>
              <a href="/admin/inventory" className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
                Go to Inventory
              </a>
            </div>
          </div>
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
