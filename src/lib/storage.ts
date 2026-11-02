/**
 * Image storage on Supabase Storage, called server-side with the service key so
 * the browser never holds it. Uses Supabase's HTTP API directly (no extra package).
 */
import { randomUUID } from 'node:crypto'

export const IMAGE_BUCKET = 'product-images'
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Image storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
  return { url, key }
}

const auth = (key: string) => ({ Authorization: `Bearer ${key}`, apikey: key })
const publicPrefix = (url: string) => `${url}/storage/v1/object/public/${IMAGE_BUCKET}/`

/** True when the bytes really are a JPEG, PNG or WebP (the declared type isn't trusted). */
export function sniffImageType(b: Uint8Array): string | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  if (String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP') return 'image/webp'
  return null
}

let bucketReady = false
async function ensureBucket() {
  if (bucketReady) return
  const { url, key } = config()
  const res = await fetch(`${url}/storage/v1/bucket`, {
    method: 'POST',
    headers: { ...auth(key), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: IMAGE_BUCKET,
      name: IMAGE_BUCKET,
      public: true, // anyone can view; only the server can write
      file_size_limit: MAX_IMAGE_BYTES,
      allowed_mime_types: Object.keys(TYPES),
    }),
  })
  // 409 / "already exists" is fine.
  if (!res.ok && res.status !== 409 && !(await res.text()).includes('already exists')) {
    throw new Error('Could not prepare image storage')
  }
  bucketReady = true
}

/** Stores an image under a random name and returns its public address. */
export async function uploadImage(bytes: Uint8Array, contentType: string, folder = 'products'): Promise<string> {
  const { url, key } = config()
  const ext = TYPES[contentType]
  if (!ext) throw new Error('Only JPEG, PNG or WebP images are allowed')
  await ensureBucket()
  const path = `${folder}/${randomUUID()}.${ext}`
  const res = await fetch(`${url}/storage/v1/object/${IMAGE_BUCKET}/${path}`, {
    method: 'POST',
    headers: { ...auth(key), 'Content-Type': contentType, 'Cache-Control': 'max-age=31536000', 'x-upsert': 'false' },
    body: bytes as BodyInit,
  })
  if (!res.ok) throw new Error('Image upload failed')
  return `${publicPrefix(url)}${path}`
}

/** Deletes a stored image. Ignores addresses that aren't in our bucket (pasted links stay untouched). */
export async function deleteImage(imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl) return
  try {
    const { url, key } = config()
    const prefix = publicPrefix(url)
    if (!imageUrl.startsWith(prefix)) return
    await fetch(`${url}/storage/v1/object/${IMAGE_BUCKET}/${imageUrl.slice(prefix.length)}`, {
      method: 'DELETE',
      headers: auth(key),
    })
  } catch (error) {
    console.error('Could not delete image:', error) // an orphaned file is harmless; never block a save on it
  }
}
