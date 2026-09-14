import { getProductColor, getProductInitial } from "@/lib/products";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-24 w-24 text-2xl",
};

/** Product thumbnail: the real image if present, else a coloured initial tile. */
export function ProductImage({
  name,
  image,
  size = "sm",
}: {
  name: string;
  image?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={cn(SIZE_CLASSES[size], "rounded-lg object-cover")}
      />
    );
  }

  return (
    <div
      className={cn(
        SIZE_CLASSES[size],
        getProductColor(name),
        "flex shrink-0 items-center justify-center rounded-lg font-semibold text-white",
      )}
    >
      {getProductInitial(name)}
    </div>
  );
}
