export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { inventory_item_id, change, reason = 'manual_adjustment' } = body ?? {}
    if (!inventory_item_id || typeof change !== 'number') {
      return NextResponse.json({ ok: false, error: 'inventory_item_id and numeric change are required' }, { status: 400 })
    }

    // Get original item for logging
    const originalItem = await prisma.inventoryItem.findUnique({ where: { id: inventory_item_id } })

    const updated = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.update({
        where: { id: inventory_item_id },
        data: { quantity: { increment: change } }
      })
      await tx.stockMovement.create({
        data: { inventoryItemId: inventory_item_id, change, reason }
      })
      return item
    })

    // Log the activity
    if (originalItem) {
      const { logInventoryActivity } = await import('@/lib/activityLogger')
      const adjustmentType = change > 0 ? 'increased' : 'decreased'
      const newQuantity = Number(originalItem.quantity) + change
      
      await logInventoryActivity(
        'ADJUST_STOCK',
        originalItem.id,
        originalItem.name,
        `Stock ${adjustmentType} for "${originalItem.name}" by ${Math.abs(change)} ${originalItem.unit}. New quantity: ${newQuantity} ${originalItem.unit}`,
        {
          change,
          reason,
          previousQuantity: Number(originalItem.quantity),
          newQuantity
        }
      )
    }

    return NextResponse.json({ ok: true, item: { id: updated.id, quantity: updated.quantity } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}


