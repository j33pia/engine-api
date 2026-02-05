"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  BarChart,
  ShieldCheck,
  Building,
  Bell,
} from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  const items = [
    {
      title: "Visão Geral",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Minhas Notas",
      href: "/dashboard/invoices",
      icon: FileText,
    },
    {
      title: "Gerenciar Emissores",
      href: "/dashboard/companies",
      icon: Building,
    },
    {
      title: "Certificados",
      href: "/dashboard/certificates",
      icon: ShieldCheck,
    },
    {
      title: "Webhooks",
      href: "/dashboard/settings/webhooks",
      icon: Bell,
    },
    {
      title: "Configurações",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Motor Fiscal
          </h2>
          <div className="space-y-1">
            {items.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Analytics
          </h2>
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start">
              <BarChart className="mr-2 h-4 w-4" />
              Relatórios
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              Auditoria
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
