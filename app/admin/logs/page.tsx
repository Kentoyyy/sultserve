import { ActivityLogsPageClient } from './ActivityLogsPageClient'
import { prisma } from '@/lib/prisma'

async function getActivityLogs() {
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100 // Get latest 100 logs
  })
  
  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    entityName: log.entityName,
    description: log.description,
    metadata: log.metadata,
    userName: log.userName,
    createdAt: log.createdAt
  }))
}

export default async function AdminActivityLogsPage() {
  const logs = await getActivityLogs()
  return <ActivityLogsPageClient logs={logs} />
}


