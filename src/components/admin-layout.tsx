"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Building2,
  Briefcase,
  FileText,
  CreditCard,
  Receipt,
  Tag,
  Settings,
  Newspaper,
  Megaphone,
  FolderTree,
  Layers,
  LogOut,
  ChevronLeft,
  Menu,
  ShieldCheck,
} from "lucide-react";

const navigation = [
  {
    section: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    ],
  },
  {
    section: "Management",
    items: [
      { name: "Users", href: "/dashboard/users", icon: Users },
      { name: "Companies", href: "/dashboard/companies", icon: Building2 },
      { name: "Listings", href: "/dashboard/listings", icon: Briefcase },
      { name: "Applications", href: "/dashboard/applications", icon: FileText },
    ],
  },
  {
    section: "Billing",
    items: [
      { name: "Subscriptions", href: "/dashboard/subscriptions", icon: CreditCard },
      { name: "Payments", href: "/dashboard/payments", icon: Receipt },
      { name: "Plans", href: "/dashboard/plans", icon: Layers },
    ],
  },
  {
    section: "Content",
    items: [
      { name: "Articles", href: "/dashboard/articles", icon: Newspaper },
      { name: "Job Updates", href: "/dashboard/updates", icon: Megaphone },
      { name: "Categories", href: "/dashboard/categories", icon: FolderTree },
      { name: "Tags", href: "/dashboard/tags", icon: Tag },
    ],
  },
  {
    section: "System",
    items: [
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-700/50">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white truncate">JobReady</h1>
            <p className="text-xs text-slate-400 truncate">Admin Portal</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-6 px-3">
          {navigation.map((section) => (
            <div key={section.section}>
              {!collapsed && (
                <p className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {section.section}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-indigo-600/20 text-indigo-300"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white",
                        collapsed && "justify-center px-2"
                      )}
                      title={collapsed ? item.name : undefined}
                    >
                      <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive && "text-indigo-400")} />
                      {!collapsed && <span>{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Collapse toggle */}
      <div className="hidden lg:block border-t border-slate-700/50 p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-slate-700/50">
          <p className="text-[10px] text-slate-500">JobReady Admin v1.0</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-slate-900 text-white transition-all duration-300",
          collapsed ? "w-[68px]" : "w-[250px]"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-[250px] bg-slate-900 text-white z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className={cn("flex-1 flex flex-col min-h-screen transition-all duration-300", !collapsed && "lg:ml-[250px]", collapsed && "lg:ml-[68px]")}>
        {/* Top Bar */}
        <header className="sticky top-0 z-20 h-16 bg-white border-b flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">
                    {session?.user?.name || "Admin"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{session?.user?.name || "Admin"}</p>
                  <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>

        {/* Footer */}
        <footer className="border-t bg-white px-4 py-3 text-center text-xs text-muted-foreground">
          JobReady Admin Dashboard v1.0 &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
