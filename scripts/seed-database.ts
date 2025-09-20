import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')

    // Seed Roles
    console.log('📋 Seeding roles...')
    const roles = [
      {
        code: 'admin',
        name: 'Administrator',
        description: 'Full system access and management capabilities',
        permissions: ['manage_products', 'manage_inventory', 'manage_staff', 'process_orders', 'view_reports', 'manage_categories']
      },
      {
        code: 'cashier',
        name: 'Cashier',
        description: 'Process orders and handle payments',
        permissions: ['process_orders', 'view_products', 'view_inventory']
      },
      {
        code: 'manager',
        name: 'Manager',
        description: 'Manage daily operations and staff',
        permissions: ['manage_products', 'manage_inventory', 'process_orders', 'view_reports', 'manage_staff']
      },
      {
        code: 'inventory_clerk',
        name: 'Inventory Clerk',
        description: 'Manage inventory and stock levels',
        permissions: ['manage_inventory', 'view_products', 'view_reports']
      }
    ]

    for (const role of roles) {
      await prisma.role.upsert({
        where: { code: role.code },
        update: role,
        create: role
      })
    }
    console.log('✅ Roles seeded successfully')

    // Seed Categories
    console.log('📂 Seeding categories...')
    const categories = [
      { name: 'Coffee', sortOrder: 1 },
      { name: 'Milk Tea & Tea', sortOrder: 2 },
      { name: 'Pastries & Baked Goods', sortOrder: 3 },
      { name: 'Snacks & Food', sortOrder: 4 },
      { name: 'Beverages', sortOrder: 5 }
    ]

    for (const category of categories) {
      await prisma.category.upsert({
        where: { name: category.name },
        update: category,
        create: category
      })
    }
    console.log('✅ Categories seeded successfully')

    // Seed Sample Inventory Items
    console.log('📦 Seeding inventory items...')
    const inventoryItems = [
      { name: 'Coffee Beans', unit: 'kg', quantity: 10, lowStockThreshold: 2 },
      { name: 'Milk', unit: 'liters', quantity: 20, lowStockThreshold: 5 },
      { name: 'Sugar', unit: 'kg', quantity: 15, lowStockThreshold: 3 },
      { name: 'Flour', unit: 'kg', quantity: 25, lowStockThreshold: 5 },
      { name: 'Eggs', unit: 'pieces', quantity: 100, lowStockThreshold: 20 },
      { name: 'Butter', unit: 'kg', quantity: 8, lowStockThreshold: 2 },
      { name: 'Tea Leaves', unit: 'kg', quantity: 5, lowStockThreshold: 1 },
      { name: 'Cups', unit: 'pieces', quantity: 200, lowStockThreshold: 50 },
      { name: 'Napkins', unit: 'packs', quantity: 30, lowStockThreshold: 10 }
    ]

    for (const item of inventoryItems) {
      await prisma.inventoryItem.upsert({
        where: { name: item.name },
        update: item,
        create: item
      })
    }
    console.log('✅ Inventory items seeded successfully')

    // Seed Sample Products
    console.log('🍽️ Seeding sample products...')
    const coffeeCategory = await prisma.category.findFirst({ where: { name: 'Coffee' } })
    const pastriesCategory = await prisma.category.findFirst({ where: { name: 'Pastries & Baked Goods' } })
    const beveragesCategory = await prisma.category.findFirst({ where: { name: 'Beverages' } })

    const products = [
      {
        name: 'Americano',
        description: 'Classic black coffee',
        priceCents: 12000, // ₱120.00
        categoryId: coffeeCategory?.id,
        status: 'available'
      },
      {
        name: 'Cappuccino',
        description: 'Espresso with steamed milk and foam',
        priceCents: 15000, // ₱150.00
        categoryId: coffeeCategory?.id,
        status: 'available'
      },
      {
        name: 'Latte',
        description: 'Espresso with steamed milk',
        priceCents: 16000, // ₱160.00
        categoryId: coffeeCategory?.id,
        status: 'available'
      },
      {
        name: 'Croissant',
        description: 'Buttery, flaky pastry',
        priceCents: 8000, // ₱80.00
        categoryId: pastriesCategory?.id,
        status: 'available'
      },
      {
        name: 'Muffin',
        description: 'Fresh baked muffin',
        priceCents: 6000, // ₱60.00
        categoryId: pastriesCategory?.id,
        status: 'available'
      },
      {
        name: 'Water',
        description: 'Bottled water',
        priceCents: 2000, // ₱20.00
        categoryId: beveragesCategory?.id,
        status: 'available'
      }
    ]

    for (const product of products) {
      await prisma.product.upsert({
        where: { name: product.name },
        update: product,
        create: product
      })
    }
    console.log('✅ Sample products seeded successfully')

    console.log('🎉 Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding
seedDatabase()
  .then(() => {
    console.log('✅ Seeding script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seeding script failed:', error)
    process.exit(1)
  })
