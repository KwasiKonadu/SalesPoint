"use client";

import { useState } from "react";
import { ChevronDown, Image as ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { FieldLabel } from "@/components/atoms/field-label";

/**
 * Collapsed to a single swatch showing the current icon; expands to a grid of
 * preset emoji (plus "None") and collapses again once one is picked.
 */
export function IconPicker({
  label = "Icon",
  value,
  onChange,
}: {
  label?: string;
  value: string | null;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const select = (icon: string) => {
    onChange(icon);
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={value ? `Icon ${value}, change` : "Choose an icon"}
        className="flex w-fit items-center gap-1.5 rounded-md border py-1 pl-1.5 pr-2 transition-colors hover:bg-accent"
      >
        <span className="flex size-7 items-center justify-center text-lg leading-none">
          {value || <ImageIcon className="size-4 text-muted-foreground" />}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="flex flex-wrap gap-1.5 rounded-md border p-2">
          <button
            type="button"
            onClick={() => select("")}
            aria-pressed={!value}
            title="No icon"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md border text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent",
              !value
                ? "border-primary bg-primary/10 text-foreground"
                : "border-transparent",
            )}
          >
            None
          </button>
          {CATEGORY_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => select(icon)}
              aria-pressed={value === icon}
              aria-label={`Icon ${icon}`}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md border text-lg leading-none transition-colors hover:bg-accent",
                value === icon
                  ? "border-primary bg-primary/10"
                  : "border-transparent",
              )}
            >
              {icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
