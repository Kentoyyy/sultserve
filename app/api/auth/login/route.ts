export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body ?? {}
    
    if (!username || !password) {
      return NextResponse.json({ ok: false, error: 'Username and password are required' }, { status: 400 })
    }
    
    // Find staff by username or email
    const staff = await prisma.staff.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username }
        ],
        isActive: true
      },
      include: { role: true }
    })
    
    if (!staff) {
      return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 })
    }
    
    // Simple password check (in production, use proper hashing)
    if (staff.password !== password) {
      return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 })
    }
    
    // Update last login time
    await prisma.staff.update({
      where: { id: staff.id },
      data: { lastLoginAt: new Date() }
    })
    
    // Log the login activity
    await prisma.staffActivityLog.create({
      data: {
        staffId: staff.id,
        action: 'LOGIN',
        description: `${staff.fullName} logged in`,
        metadata: {
          role: staff.role?.name,
          loginMethod: 'username'
        }
      }
    })
    
    // Return user info (excluding password)
    const { password: _, ...userInfo } = staff
    
    return NextResponse.json({ 
      ok: true, 
      user: userInfo,
      message: 'Login successful'
    })
    
  } catch (e: any) {
    console.error('Login error:', e)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}


