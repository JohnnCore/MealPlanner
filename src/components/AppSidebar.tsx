'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Calendar,
  ChefHat,
  Home,
  Lightbulb,
  LogOut,
  ShoppingCart,
  User,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';

const navItems = [
  { href: '/', label: 'Dashboard', Icon: Home },
  { href: '/recipes', label: 'AI Recipes', Icon: Lightbulb },
  { href: '/planner', label: 'Meal Planner', Icon: Calendar },
  { href: '/shopping-list', label: 'Shopping List', Icon: ShoppingCart },
  { href: '/marketplace', label: 'Marketplace', Icon: BookOpen },
  { href: '/profile', label: 'Profile', Icon: User },
] as const;

export function AppSidebar() {
  const pathname = usePathname() ?? '/';

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <Sidebar collapsible="offcanvas">
      {/* ── Brand header ── */}
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
            <ChefHat size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-sidebar-primary leading-none">Smart Pantry</p>
            <p className="text-xs text-sidebar-foreground mt-0.5">AI Meal Planner</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      {/* ── Navigation ── */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ href, label, Icon }) => {
                const active =
                  pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      size="lg"
                      aria-current={active ? 'page' : undefined}
                    >
                      <Link href={href}>
                        <Icon size={18} />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer: logout + tip ── */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut size={18} />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="px-2 pb-2 text-sm text-sidebar-foreground rounded-lg bg-sidebar-accent/20 mx-2 mb-2 p-3">
          <p className="font-semibold mb-1">🎉 Pro Tip</p>
          <p>Add ingredients as you shop to get fresh recipe ideas instantly!</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
