export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Params) {
  const { id } = await params
  try {
    const staff = await prisma.staff.findUnique({ 
      where: { id },
      include: { role: true }
    })
    return NextResponse.json({ ok: true, data: staff })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  try {
    const body = await request.json()
    
    // Get original staff for logging
    const originalStaff = await prisma.staff.findUnique({ 
      where: { id },
      include: { role: true }
    })
    
    const updateData: any = {}
    if ('fullName' in body) updateData.fullName = body.fullName
    if ('email' in body) updateData.email = body.email
    if ('username' in body) updateData.username = body.username
    if ('phone' in body) updateData.phone = body.phone
    if ('roleId' in body) updateData.roleId = body.roleId
    if ('isActive' in body) updateData.isActive = body.isActive
    
    const updatedStaff = await prisma.staff.update({ 
      where: { id }, 
      data: updateData,
      include: { role: true }
    })
    
    // Log the activity
    if (originalStaff) {
      const { logActivity } = await import('@/lib/activityLogger')
      const changes: any = {}
      
      if (originalStaff.fullName !== updateData.fullName && updateData.fullName) {
        changes.fullName = { from: originalStaff.fullName, to: updateData.fullName }
      }
      if (originalStaff.isActive !== updateData.isActive && updateData.isActive !== undefined) {
        changes.status = { from: originalStaff.isActive ? 'Active' : 'Inactive', to: updateData.isActive ? 'Active' : 'Inactive' }
      }
      if (originalStaff.role?.name !== updatedStaff.role?.name) {
        changes.role = { from: originalStaff.role?.name || 'No role', to: updatedStaff.role?.name || 'No role' }
      }
      
      await logActivity({
        action: 'UPDATE',
        entityType: 'STAFF',
        entityId: updatedStaff.id,
        entityName: updatedStaff.fullName,
        description: `Updated staff member "${updatedStaff.fullName}"`,
        metadata: { changes },
        userType: 'admin'
      })
    }
    
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params
  try {
    const staff = await prisma.staff.findUnique({ where: { id } })
    
    await prisma.staff.delete({ where: { id } })
    
    // Log the activity
    if (staff) {
      const { logActivity } = await import('@/lib/activityLogger')
      await logActivity({
        action: 'DELETE',
        entityType: 'STAFF',
        entityId: staff.id,
        entityName: staff.fullName,
        description: `Deleted staff member "${staff.fullName}"`,
        metadata: { email: staff.email },
        userType: 'admin'
      })
    }
    
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}

