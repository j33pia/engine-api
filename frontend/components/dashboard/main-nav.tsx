"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Building2,
  ShieldCheck,
  Settings,
  BarChart3,
  FileSearch,
  Truck,
  Receipt,
} from "lucide-react";

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col space-y-6", className)} {...props}>
      <div className="space-y-3">
        <h4 className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Motor Fiscal
        </h4>
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === "/dashboard"
                ? "bg-accent text-accent-foreground"
                : "transparent",
            )}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Visão Geral
          </Link>
          <Link
            href="/dashboard/invoices"
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === "/dashboard/invoices"
                ? "bg-accent text-accent-foreground"
                : "transparent",
            )}
          >
            <FileText className="mr-2 h-4 w-4" />
            Monitor de Notas
          </Link>
          <Link
            href="/dashboard/mdfe"
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === "/dashboard/mdfe"
                ? "bg-accent text-accent-foreground"
                : "transparent",
            )}
          >
            <Truck className="mr-2 h-4 w-4" />
            Monitor de MDF-e
          </Link>
          <Link
            href="/dashboard/nfse"
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === "/dashboard/nfse"
                ? "bg-accent text-accent-foreground"
                : "transparent",
            )}
          >
            <Receipt className="mr-2 h-4 w-4" />
            Monitor de NFS-e
          </Link>
          <Link
            href="/dashboard/companies"
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === "/dashboard/companies"
                ? "bg-accent text-accent-foreground"
                : "transparent",
            )}
          >
            <Building2 className="mr-2 h-4 w-4" />
            Clientes
          </Link>
          <Link
            href="/dashboard/settings"
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === "/dashboard/settings"
                ? "bg-accent text-accent-foreground"
                : "transparent",
            )}
          >
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </Link>
          <Link
            href="/dashboard/sandbox"
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === "/dashboard/sandbox"
                ? "bg-accent text-accent-foreground"
                : "transparent",
            )}
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            Sandbox (Teste)
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Analytics
        </h4>
        <div className="space-y-1">
          <Link
            href="/dashboard/reports"
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === "/dashboard/reports"
                ? "bg-accent text-accent-foreground"
                : "transparent",
            )}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Relatórios
          </Link>
          <Link
            href="/dashboard/audit"
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === "/dashboard/audit"
                ? "bg-accent text-accent-foreground"
                : "transparent",
            )}
          >
            <FileSearch className="mr-2 h-4 w-4" />
            Auditoria
          </Link>
        </div>
      </div>
    </nav>
  );
}
