"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

//side panel for forms that appears at the side of the screen
export function FormPanel({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  contentClassName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "flex w-full flex-col gap-0 p-0 sm:max-w-120",
          "sm:inset-y-4 sm:right-4 sm:h-auto sm:rounded-2xl sm:border",
        )}
        
        onPointerDownOutside={(e) => {
          if ((e.target as HTMLElement | null)?.closest("[data-search-select-portal]")) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if ((e.target as HTMLElement | null)?.closest("[data-search-select-portal]")) {
            e.preventDefault();
          }
        }}
      >
        <SheetHeader className="shrink-0 gap-1 border-b px-6 py-4 pr-12">
          <SheetTitle className="text-lg tracking-tight">{title}</SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : null}
        </SheetHeader>

        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto px-6 py-4",
            contentClassName,
          )}
        >
          {children}
        </div>

        {footer ? (
          <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t px-6 py-4">
            {footer}
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
