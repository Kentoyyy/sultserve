export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    })
    return NextResponse.json(categories)
  } catch (e: unknown) {
    console.error('Error fetching categories:', e)
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, sortOrder = 0 } = body ?? {}
    if (!name) return NextResponse.json({ ok: false, error: 'name required' }, { status: 400 })
    
    const category = await prisma.category.create({
      data: {
        name,
        sortOrder
      }
    })
    
    return NextResponse.json({ ok: true, id: category.id })
  } catch (e: unknown) {
    console.error('Error creating category:', e)
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}




