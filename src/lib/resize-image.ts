/**
 * Shrinks a photo in the browser before upload: phone pictures are 3-8 MB, which
 * is slow on mobile data and wasteful to store. Keeps the look, caps the size.
 */
const MAX_SIDE = 1200;

export async function shrinkImage(file: File): Promise<File> {
  // `from-image` applies the phone's rotation so pictures don't arrive sideways.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not read the picture');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const toBlob = (type: string, quality: number) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, quality));
  // WebP is smallest; fall back to JPEG where the browser can't encode it.
  const webp = await toBlob('image/webp', 0.82);
  const blob = webp && webp.type === 'image/webp' ? webp : await toBlob('image/jpeg', 0.85);
  if (!blob) throw new Error('Could not process the picture');
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '') || 'photo'}.${ext}`, { type: blob.type });
}
