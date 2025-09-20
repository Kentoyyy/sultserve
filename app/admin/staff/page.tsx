import { StaffPageClient } from './StaffPageClient'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getStaff() {
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
  
  return staff.map((s) => ({
    id: s.id,
    fullName: s.fullName,
    email: s.email,
    username: s.username,
    phone: s.phone,
    isActive: s.isActive,
    role: s.role ? {
      id: s.role.id,
      name: s.role.name,
      code: s.role.code
    } : null,
    stats: {
      processedOrders: s._count.processedOrders,
      activityLogs: s._count.activityLogs
    },
    lastLoginAt: s.lastLoginAt,
    createdAt: s.createdAt
  }))
}

async function getRoles() {
  return await prisma.role.findMany({
    orderBy: { name: 'asc' }
  })
}

export default async function AdminStaffPage() {
  const [staff, roles] = await Promise.all([getStaff(), getRoles()])
  return <StaffPageClient staff={staff} roles={roles} />
}