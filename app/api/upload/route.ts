export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const file = form.get('file') as File | null

    if (!file) {
      return NextResponse.json({ ok: false, error: 'file is required' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')

    await fs.mkdir(uploadsDir, { recursive: true })

    const ext = path.extname((file as any).name || '') || '.png'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    const filePath = path.join(uploadsDir, filename)

    await fs.writeFile(filePath, buffer)

    const url = `/uploads/${filename}`
    return NextResponse.json({ ok: true, url })
  } catch (e: any) {
    console.error('Upload failed:', e)
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}













