"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  ScrollText,
  Settings,
  Shield,
  DollarSign,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/partners", icon: Building2, label: "Partners" },
  { href: "/admin/audit", icon: ScrollText, label: "Audit Logs" },
  { href: "/admin/billing", icon: DollarSign, label: "Billing" },
  { href: "/admin/system", icon: Activity, label: "Sistema" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center border-b px-6">
          <Shield className="mr-2 h-6 w-6 text-red-500" />
          <span className="text-lg font-bold">SuperAdmin</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            ← Voltar ao Dashboard Partner
          </Link>
        </div>
      </div>
    </aside>
  );
}
