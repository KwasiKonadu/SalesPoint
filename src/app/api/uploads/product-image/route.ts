import { NextRequest, NextResponse } from 'next/server'
import { MAX_IMAGE_BYTES, sniffImageType, uploadImage } from '@/lib/storage'

// Upload one product photo (multipart field "file"). Returns its public address,
// which the product then stores in `image`. Staff only (the proxy requires a session).
export async function POST(req: NextRequest) {
  try {
    if (!req.headers.get('x-user-id')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) return NextResponse.json({ error: 'No image received' }, { status: 400 })
    if (file.size === 0) return NextResponse.json({ error: 'That file is empty' }, { status: 400 })
    if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: 'Image is too large (max 5 MB)' }, { status: 413 })

    const bytes = new Uint8Array(await file.arrayBuffer())
    const type = sniffImageType(bytes) // judge by content, not by the name or declared type
    if (!type) return NextResponse.json({ error: 'Use a JPEG, PNG or WebP image' }, { status: 415 })

    return NextResponse.json({ url: await uploadImage(bytes, type) }, { status: 201 })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}
