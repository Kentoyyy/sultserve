export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get recent activity logs
    const activityLogs = await prisma.activityLog.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      select: {
        action: true,
        entityType: true,
        description: true,
        createdAt: true,
        userName: true
      }
    })

    const data = activityLogs.map(log => ({
      action: log.action,
      entityType: log.entityType,
      details: log.description || '',
      timestamp: log.createdAt.toISOString(),
      userInfo: log.userName || 'System'
    }))

    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    console.error('Dashboard activity error:', err)
    return NextResponse.json({ ok: false, error: err?.message ?? 'error' }, { status: 500 })
  }
}
