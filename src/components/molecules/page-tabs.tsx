"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type PageTabsContextValue = {
  host: HTMLElement | null;
  setHost: (el: HTMLElement | null) => void;
};

const PageTabsContext = createContext<PageTabsContextValue | null>(null);

/**
 * Wraps the app shell so a page can hoist its tab bar into the fixed strip
 * that sits directly under the app header (see {@link PageTabsBand}).
 */
export function PageTabsProvider({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  return (
    <PageTabsContext.Provider value={{ host, setHost }}>
      {children}
    </PageTabsContext.Provider>
  );
}

/**
 * Fixed-height row under the app header. It always renders so the divider
 * below the header lands in the same place on every page, whether or not the
 * page has tabs. A page fills it by rendering {@link PageTabsSlot}.
 */
export function PageTabsBand({ className }: { className?: string }) {
  const ctx = useContext(PageTabsContext);
  return (
    <div
      ref={ctx?.setHost}
      className={cn(
        "flex h-11 shrink-0 items-end gap-1 overflow-x-auto border-b border-border px-4 scrollbar-none lg:px-6 [&::-webkit-scrollbar]:hidden",
        className,
      )}
    />
  );
}

/** Portals its children into the {@link PageTabsBand}; renders nothing inline. */
export function PageTabsSlot({ children }: { children: ReactNode }) {
  const host = useContext(PageTabsContext)?.host;
  if (!host) return null;
  return createPortal(children, host);
}
