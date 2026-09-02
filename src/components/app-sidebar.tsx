'use client';

import { useSession } from '@/lib/auth-context';
import { useAppStore, type PageId } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Users,
  Truck,
  Receipt,
  BarChart3,
  UserCog,
  Settings,
  LogOut,
  ChevronLeft,
  Store,
  Menu,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navItems: { id: PageId; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pos', label: 'POS / New Sale', icon: Zap },
  { id: 'sales', label: 'Sales History', icon: ShoppingCart },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'inventory', label: 'Inventory', icon: Warehouse },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'suppliers', label: 'Suppliers', icon: Truck, adminOnly: true },
  { id: 'expenses', label: 'Expenses', icon: Receipt, adminOnly: true },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'staff', label: 'Staff', icon: UserCog, adminOnly: true },
  { id: 'settings', label: 'Settings', icon: Settings, adminOnly: true },
];

export function AppSidebar() {
  const { session, logout } = useSession();
  const { currentPage, setCurrentPage, sidebarOpen, toggleSidebar, setSidebarOpen } = useAppStore();
  const userRole = (session?.user as any)?.role || 'sales_person';
  const userName = (session?.user as any)?.name || 'User';
  const initials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const filteredNav = navItems.filter((item) => !item.adminOnly || userRole === 'admin');

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
          'fixed top-0 left-0 z-50 h-full bg-white border-r border-border flex flex-col transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-[68px]',
          'lg:relative lg:z-0',
          !sidebarOpen && 'max-lg:-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border flex-shrink-0">
          {sidebarOpen && (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-foreground">StorePOS</span>
            </div>
          )}
          {!sidebarOpen && (
            <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mx-auto">
              <Store className="w-5 h-5" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8 lg:flex', sidebarOpen ? 'hidden lg:flex' : 'hidden')}
            onClick={toggleSidebar}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {sidebarOpen && (
            <Button variant="ghost" size="icon" className="h-8 w-8 hidden lg:flex" onClick={toggleSidebar}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            const button = (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  !sidebarOpen && 'justify-center px-2'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );

            if (!sidebarOpen) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return button;
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-border p-3 flex-shrink-0">
          {sidebarOpen ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">{userName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{userRole.replace('_', ' ')}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem className="font-medium">
                  <div className="flex flex-col">
                    <span>{userName}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {userRole.replace('_', ' ')}
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="w-full flex justify-center">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground capitalize">{userRole.replace('_', ' ')}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
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