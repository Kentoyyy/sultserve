export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function POST(_: Request, { params }: Params) {
  const { id } = await params
  try {
    const product = await prisma.product.findUnique({ where: { id } })
    
    await prisma.product.update({ 
      where: { id }, 
      data: { 
        isArchived: false, 
        archivedAt: null,
        status: 'available' // Restore as available
      } 
    })
    
    // Log the activity
    if (product) {
      const { logProductActivity } = await import('@/lib/activityLogger')
      await logProductActivity(
        'RESTORE',
        product.id,
        product.name,
        `Restored product "${product.name}" from archive`,
        { restoredStatus: 'available' }
      )
    }
    
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}
