export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const staff = await prisma.staff.findMany({
      include: { 
        role: true,
        _count: {
          select: {
            processedOrders: true,
            activityLogs: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ ok: true, data: staff })
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { fullName, email, username, phone, password, roleId } = body ?? {}
    
    if (!fullName || !email || !password) {
      return NextResponse.json({ ok: false, error: 'Full name, email, and password are required' }, { status: 400 })
    }
    
    // Check if email already exists
    const existingStaff = await prisma.staff.findUnique({
      where: { email }
    })
    
    if (existingStaff) {
      return NextResponse.json({ ok: false, error: 'Email already exists' }, { status: 400 })
    }
    
    // Check if username already exists (if provided)
    if (username) {
      const existingUsername = await prisma.staff.findUnique({
        where: { username }
      })
      
      if (existingUsername) {
        return NextResponse.json({ ok: false, error: 'Username already exists' }, { status: 400 })
      }
    }
    
    const staff = await prisma.staff.create({
      data: {
        fullName,
        email,
        username,
        phone,
        password, // In production, this should be hashed
        roleId,
        isActive: true
      },
      include: { role: true }
    })
    
    // Log the activity
    const { logActivity } = await import('@/lib/activityLogger')
    await logActivity({
      action: 'CREATE',
      entityType: 'STAFF',
      entityId: staff.id,
      entityName: staff.fullName,
      description: `Created new staff member "${staff.fullName}" with role ${staff.role?.name || 'No role'}`,
      metadata: {
        email: staff.email,
        username: staff.username,
        role: staff.role?.name
      },
      userType: 'admin'
    })
    
    return NextResponse.json({ ok: true, id: staff.id })
  } catch (e: unknown) {
    console.error('Error creating staff:', e)
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}














