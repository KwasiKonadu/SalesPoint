"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldLabel } from "@/components/atoms/field-label";
import { ImageUpload } from "@/components/molecules/image-upload";
import { variantLabel, type ProductItem } from "@/lib/products";
import { shrinkImage } from "@/lib/resize-image";

import { useSaveProduct } from "./use-products";

/** Main photo plus a list of secondary photos. Each change is saved straight away. */
export function ChangeImageDialog({
  product,
  open,
  onOpenChange,
  onProductChange,
}: {
  product: ProductItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Receives the refreshed product so the dialog shows the new pictures. */
  onProductChange: (product: ProductItem) => void;
}) {
  const save = useSaveProduct();
  const fileRef = useRef<HTMLInputElement>(null);
  const [adding, setAdding] = useState(false);
  if (!product) return null;

  const gallery = product.images ?? [];

  const update = async (patch: { image?: string | null; images?: string[] }, message: string) => {
    try {
      const updated = await save.mutateAsync({ id: product.id, ...patch } as never);
      onProductChange(updated as unknown as ProductItem);
      toast.success(message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update photos");
    }
  };

  const addSecondary = async (file: File | undefined) => {
    if (!file) return;
    setAdding(true);
    try {
      const body = new FormData();
      body.append("file", await shrinkImage(file));
      const res = await fetch("/api/uploads/product-image", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      await update({ images: [...gallery, data.url] }, "Photo added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setAdding(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // Swap a secondary photo with the main one.
  const makeMain = (url: string) =>
    update(
      { image: url, images: [...gallery.filter((u) => u !== url), ...(product.image ? [product.image] : [])] },
      "Main photo changed",
    );

  const busy = save.isPending || adding;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>{variantLabel(product) || product.sku}</DialogDescription>
        </DialogHeader>

        <ImageUpload
          label="Main photo"
          name={product.name}
          value={product.image}
          onChange={(url) => update({ image: url }, url ? "Main photo updated" : "Main photo removed")}
        />

        <div className="space-y-2">
          <FieldLabel>More photos</FieldLabel>
          <div className="grid grid-cols-4 gap-2">
            {gallery.map((url) => (
              <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="size-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-background/80 p-0.5">
                  <button type="button" disabled={busy} title="Make main photo" className="rounded p-1 hover:bg-accent" onClick={() => makeMain(url)}>
                    <Star className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    title="Remove"
                    className="rounded p-1 text-destructive hover:bg-accent"
                    onClick={() => update({ images: gallery.filter((u) => u !== url) }, "Photo removed")}
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/*" className="hidden" onChange={(e) => addSecondary(e.target.files?.[0])} />
            <Button type="button" variant="outline" disabled={busy} className="aspect-square h-auto" onClick={() => fileRef.current?.click()}>
              {adding ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          The main photo shows first in the app and on the website. The same photos are used in both.
        </p>
      </DialogContent>
    </Dialog>
  );
}
