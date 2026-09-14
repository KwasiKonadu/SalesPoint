"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TAB_ACTIVE =
  "text-foreground font-semibold after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-t-full after:bg-primary";
const TAB_IDLE = "text-muted-foreground hover:text-foreground";

export interface TabItem {
  key: string;
  label: string;
  /** Shown as a pill after the label when greater than 0. */
  count?: number;
  /** When set, the tab renders as a link and active state follows the route. */
  href?: string;
  disabled?: boolean;
}

export interface TabGroup {
  tabs: TabItem[];
}

interface TabBarProps {
  /** Flat tab list. Ignored when `groups` is passed. */
  tabs?: TabItem[];
  /** Tabs split into visually separated groups, divided by a vertical rule. */
  groups?: TabGroup[];
  /** Active key for controlled (button) tabs. */
  activeTab?: string;
  onTabChange?: (key: string) => void;
  /** Drop the bottom border and horizontal-scroll chrome — for use inside a
   *  container that already provides them (e.g. the page tab strip). */
  bare?: boolean;
  className?: string;
}

function TabButton({
  tab,
  isActive,
  onTabChange,
}: {
  tab: TabItem;
  isActive: boolean;
  onTabChange?: (key: string) => void;
}) {
  const cls = cn(
    "relative flex items-center gap-2 whitespace-nowrap px-4 py-2 text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded-t-md disabled:pointer-events-none disabled:opacity-50",
    isActive ? TAB_ACTIVE : TAB_IDLE,
  );

  const content = (
    <>
      {tab.label}
      {(tab.count ?? 0) > 0 && (
        <span
          className={cn(
            "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
            isActive
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          {tab.count}
        </span>
      )}
    </>
  );

  if (tab.href) {
    return (
      <Link
        href={tab.href}
        role="tab"
        aria-selected={isActive}
        aria-current={isActive ? "page" : undefined}
        aria-disabled={tab.disabled || undefined}
        className={cls}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={tab.disabled}
      onClick={() => onTabChange?.(tab.key)}
      className={cls}
    >
      {content}
    </button>
  );
}

/**
 * Underline tab bar. Two modes:
 *  - link tabs (`tab.href`): active state follows the current route.
 *  - controlled tabs: pass `activeTab` + `onTabChange`.
 * Pass `groups` instead of `tabs` to divide tabs with a vertical rule.
 */
export function TabBar({
  tabs,
  groups,
  activeTab,
  onTabChange,
  bare = false,
  className,
}: TabBarProps) {
  const pathname = usePathname();
  const resolvedGroups: TabGroup[] = groups ?? [{ tabs: tabs ?? [] }];

  return (
    <div
      role="tablist"
      className={cn(
        "flex items-end gap-1",
        !bare &&
          "shrink-0 overflow-x-auto border-b border-border scrollbar-none [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {resolvedGroups.map((group, gi) => (
        <div key={gi} className="flex items-end">
          {gi > 0 && (
            <div className="mx-2 h-4 w-px shrink-0 self-center rounded-full bg-border" />
          )}
          {group.tabs.map((tab) => {
            const isActive = tab.href
              ? pathname === tab.href ||
                (pathname?.startsWith(tab.href + "/") ?? false)
              : activeTab === tab.key;
            return (
              <TabButton
                key={tab.key}
                tab={tab}
                isActive={isActive}
                onTabChange={onTabChange}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
