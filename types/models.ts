export type UUID = string

export type Role = {
  id: UUID
  code: 'admin' | 'cashier' | 'inventory_clerk'
  name: string
}

export type Staff = {
  id: UUID
  email: string
  full_name: string
  role_id: UUID | null
  is_active: boolean
}

export type Category = {
  id: UUID
  name: string
  sort_order: number
}

export type Product = {
  id: UUID
  name: string
  description: string | null
  image_url: string | null
  price_cents: number
  category_id: UUID | null
  status: 'available' | 'out_of_stock'
}

export type ProductOptionGroup = {
  id: UUID
  product_id: UUID
  name: string
  type: 'single' | 'multiple'
  required: boolean
  max_select: number | null
}

export type ProductOption = {
  id: UUID
  group_id: UUID
  name: string
  price_delta_cents: number
  sort_order: number
}

export type InventoryItem = {
  id: UUID
  name: string
  unit: string
  quantity: number
  low_stock_threshold: number
  supplier_id: UUID | null
  expiry_days: number | null
}

export type Order = {
  id: UUID
  order_number: number
  status: 'pending' | 'paid' | 'preparing' | 'completed' | 'voided' | 'refunded'
  channel: 'pos' | 'kiosk'
  customer_phone: string | null
  notes: string | null
  subtotal_cents: number
  discount_cents: number
  total_cents: number
}

export type OrderItem = {
  id: UUID
  order_id: UUID
  product_id: UUID | null
  name_snapshot: string
  unit_price_cents: number
  quantity: number
  line_total_cents: number
}

export type OrderItemOption = {
  id: UUID
  order_item_id: UUID
  group_name: string
  option_name: string
  price_delta_cents: number
}

export type Payment = {
  id: UUID
  order_id: UUID
  method: 'cash' | 'gcash' | 'card'
  amount_cents: number
}

export type LoyaltyCustomer = {
  id: UUID
  phone: string
  name: string | null
  points: number
}


