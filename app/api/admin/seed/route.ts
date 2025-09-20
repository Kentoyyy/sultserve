export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { query } from '@/lib/pgClient'

export async function POST() {
  try {
    console.log('🌱 Starting database seeding...')

    // Insert roles if they don't exist
    await query(`
      INSERT INTO "Role" (id, code, name, description, permissions, created_at)
      VALUES 
        (gen_random_uuid(), 'admin', 'Administrator', 'Full system access and management capabilities', '["manage_products", "manage_inventory", "manage_staff", "process_orders", "view_reports", "manage_categories"]', now()),
        (gen_random_uuid(), 'cashier', 'Cashier', 'Process orders and handle payments', '["process_orders", "view_products", "view_inventory"]', now()),
        (gen_random_uuid(), 'manager', 'Manager', 'Manage daily operations and staff', '["manage_products", "manage_inventory", "process_orders", "view_reports", "manage_staff"]', now()),
        (gen_random_uuid(), 'inventory_clerk', 'Inventory Clerk', 'Manage inventory and stock levels', '["manage_inventory", "view_products", "view_reports"]', now())
      ON CONFLICT (code) DO NOTHING;
    `)

    // Insert categories if they don't exist
    await query(`
      INSERT INTO "Category" (id, name, sort_order, created_at)
      VALUES 
        (gen_random_uuid(), 'Coffee', 1, now()),
        (gen_random_uuid(), 'Milk Tea & Tea', 2, now()),
        (gen_random_uuid(), 'Pastries & Baked Goods', 3, now()),
        (gen_random_uuid(), 'Snacks & Food', 4, now()),
        (gen_random_uuid(), 'Beverages', 5, now())
      ON CONFLICT (name) DO NOTHING;
    `)

    // Insert sample inventory items
    await query(`
      INSERT INTO "InventoryItem" (id, name, unit, quantity, "lowStockThreshold", created_at)
      VALUES 
        (gen_random_uuid(), 'Coffee Beans', 'kg', 10, 2, now()),
        (gen_random_uuid(), 'Milk', 'liters', 20, 5, now()),
        (gen_random_uuid(), 'Sugar', 'kg', 15, 3, now()),
        (gen_random_uuid(), 'Flour', 'kg', 25, 5, now()),
        (gen_random_uuid(), 'Eggs', 'pieces', 100, 20, now()),
        (gen_random_uuid(), 'Butter', 'kg', 8, 2, now()),
        (gen_random_uuid(), 'Tea Leaves', 'kg', 5, 1, now()),
        (gen_random_uuid(), 'Cups', 'pieces', 200, 50, now()),
        (gen_random_uuid(), 'Napkins', 'packs', 30, 10, now())
      ON CONFLICT (name) DO NOTHING;
    `)
    console.log('✅ Database seeded successfully!')

    return NextResponse.json({ 
      ok: true, 
      message: 'Database seeded successfully!',
      seeded: {
        roles: 4,
        categories: 5,
        inventoryItems: 9
      }
    })
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
