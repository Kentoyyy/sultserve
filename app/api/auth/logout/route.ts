export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId } = body ?? {}
    
    if (userId) {
      // Log the logout activity
      const staff = await prisma.staff.findUnique({
        where: { id: userId },
        include: { role: true }
      })
      
      if (staff) {
        await prisma.staffActivityLog.create({
          data: {
            staffId: staff.id,
            action: 'LOGOUT',
            description: `${staff.fullName} logged out`,
            metadata: {
              role: staff.role?.name
            }
          }
        })
      }
    }
    
    return NextResponse.json({ ok: true, message: 'Logout successful' })
    
  } catch (e: unknown) {
    console.error('Logout error:', e)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}














