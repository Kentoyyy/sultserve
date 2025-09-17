'use server'

import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export type ActivityAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'ARCHIVE' | 'RESTORE' | 'SELL' | 'ADJUST_STOCK'
export type EntityType = 'PRODUCT' | 'INVENTORY' | 'RECIPE' | 'ORDER' | 'CATEGORY' | 'STAFF'

interface LogActivityParams {
  action: ActivityAction
  entityType: EntityType
  entityId?: string
  entityName?: string
  description: string
  metadata?: Record<string, any>
  userId?: string
  userName?: string
}

export async function logActivity({
  action,
  entityType,
  entityId,
  entityName,
  description,
  metadata,
  userId,
  userName = 'Admin'
}: LogActivityParams) {
  try {
    // Get request headers for IP and user agent
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     'localhost'
    const userAgent = headersList.get('user-agent') || 'Unknown'

    await prisma.activityLog.create({
      data: {
        action,
        entityType,
        entityId,
        entityName,
        description,
        metadata,
        ipAddress,
        userAgent,
        userId,
        userName
      }
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
    // Don't throw error to avoid breaking the main operation
  }
}

// Helper functions for common activities
export async function logProductActivity(
  action: ActivityAction,
  productId: string,
  productName: string,
  description: string,
  metadata?: Record<string, any>
) {
  return logActivity({
    action,
    entityType: 'PRODUCT',
    entityId: productId,
    entityName: productName,
    description,
    metadata
  })
}

export async function logInventoryActivity(
  action: ActivityAction,
  itemId: string,
  itemName: string,
  description: string,
  metadata?: Record<string, any>
) {
  return logActivity({
    action,
    entityType: 'INVENTORY',
    entityId: itemId,
    entityName: itemName,
    description,
    metadata
  })
}

export async function logRecipeActivity(
  action: ActivityAction,
  productId: string,
  productName: string,
  description: string,
  metadata?: Record<string, any>
) {
  return logActivity({
    action,
    entityType: 'RECIPE',
    entityId: productId,
    entityName: productName,
    description,
    metadata
  })
}
