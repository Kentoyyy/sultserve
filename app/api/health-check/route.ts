export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect()
    
    // Test basic queries
    const roleCount = await prisma.role.count()
    const categoryCount = await prisma.category.count()
    const productCount = await prisma.product.count()
    const staffCount = await prisma.staff.count()
    const inventoryCount = await prisma.inventoryItem.count()
    
    await prisma.$disconnect()
    
    return NextResponse.json({
      ok: true,
      message: 'Database connection successful',
      data: {
        roles: roleCount,
        categories: categoryCount,
        products: productCount,
        staff: staffCount,
        inventory: inventoryCount
      },
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        hasDatabaseUrl: !!process.env.DATABASE_URL
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        hasDatabaseUrl: !!process.env.DATABASE_URL
      }
    }, { status: 500 })
  }
}
