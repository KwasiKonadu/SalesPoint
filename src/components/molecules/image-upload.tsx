"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/atoms/field-label";
import { getProductColor, getProductInitial } from "@/lib/products";
import { shrinkImage } from "@/lib/resize-image";
import { cn } from "@/lib/utils";

/**
 * Picture box: shows the current image and lets staff upload, replace or remove it.
 * Picks from the gallery or, on a phone, the camera. The picture is shrunk in the
 * browser, stored in Supabase, and `onChange` receives its public address.
 */
export function ImageUpload({
  label = "Photo",
  name,
  value,
  onChange,
}: {
  label?: string;
  /** Used for the placeholder tile when there is no picture. */
  name?: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const small = await shrinkImage(file);
      const body = new FormData();
      body.append("file", small);
      const res = await fetch("/api/uploads/product-image", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onChange(data.url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-4">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border bg-muted">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <div className={cn("flex size-full items-center justify-center text-2xl font-semibold text-white", getProductColor(name || "?"))}>
              {name ? getProductInitial(name) : <ImagePlus className="size-6" />}
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="size-5 animate-spin" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => fileRef.current?.click()} icon={<ImagePlus className="size-3.5" />}>
              {value ? "Replace" : "Upload photo"}
            </Button>
            {value && (
              <Button type="button" variant="outline" size="sm" disabled={busy} className="text-destructive hover:text-destructive" onClick={() => onChange(null)} icon={<Trash2 className="size-3.5" />}>
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">JPEG, PNG or WebP. Shrunk automatically before upload.</p>
        </div>
      </div>
    </div>
  );
}
