"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-context";
import { useAppStore } from "@/lib/store";
import { visibleRoutes, routeForPath } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Store, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AppSidebar() {
  const pathname = usePathname();
  const { session } = useSession();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useAppStore();
  const userRole =
    (session as { role?: string } | null)?.role || "sales_person";

  const nav = visibleRoutes(userRole);
  const activeHref = routeForPath(pathname)?.href;

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-white border-r border-border flex flex-col transition-all duration-300",
          sidebarOpen ? "w-64" : "w-17",
          "lg:relative lg:z-0 lg:h-full lg:rounded-lg lg:border lg:border-border lg:shadow-sm lg:overflow-hidden",
          !sidebarOpen && "max-lg:-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 shrink-0">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg text-foreground">
                  SalesPoint
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hidden lg:flex"
                onClick={toggleSidebar}
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  aria-label="Expand sidebar"
                  className="group relative mx-auto w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center transition-colors hover:bg-primary/90"
                >
                  <Store className="w-5 h-5 transition-opacity group-hover:opacity-0" />
                  <ChevronRight className="w-4 h-4 absolute opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Expand sidebar
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = activeHref === item.href;
            const link = (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  !sidebarOpen && "justify-center px-2",
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );

            if (!sidebarOpen) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return link;
          })}
        </nav>
      </aside>
    </TooltipProvider>
  );
}

export function MobileMenuButton() {
  const { setSidebarOpen } = useAppStore();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="lg:hidden"
      onClick={() => setSidebarOpen(true)}
    >
      <Menu className="w-5 h-5" />
    </Button>
  );
}
