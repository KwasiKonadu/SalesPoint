import { db } from '@/lib/db'

export { slugify } from '@/lib/website'

/** A slug no other product uses; `-2`, `-3`... is appended on a clash. */
export async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base
  for (let n = 2; ; n++) {
    const hit = await db.product.findUnique({ where: { slug }, select: { id: true } })
    if (!hit || hit.id === excludeId) return slug
    slug = `${base}-${n}`
  }
}
