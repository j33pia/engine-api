"use client";

import { AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { useState } from "react";

interface CertAlertData {
  issuerId: string;
  issuerName: string;
  cnpj: string;
  expiresAt: string;
  daysUntilExpiry: number;
  severity: "critical" | "warning" | "info";
}

interface CertAlertProps {
  alerts: CertAlertData[];
}

export function CertAlert({ alerts }: CertAlertProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visibleAlerts = alerts.filter((a) => !dismissed.includes(a.issuerId));

  if (visibleAlerts.length === 0) return null;

  const severityConfig = {
    critical: {
      bg: "bg-red-50 dark:bg-red-950",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-800 dark:text-red-200",
      icon: AlertTriangle,
      label: "URGENTE",
    },
    warning: {
      bg: "bg-amber-50 dark:bg-amber-950",
      border: "border-amber-200 dark:border-amber-800",
      text: "text-amber-800 dark:text-amber-200",
      icon: AlertCircle,
      label: "ATENÇÃO",
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-950",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-800 dark:text-blue-200",
      icon: Info,
      label: "INFO",
    },
  };

  const formatCNPJ = (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, "");
    return cleaned.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5",
    );
  };

  return (
    <div className="space-y-2">
      {visibleAlerts.map((alert) => {
        const config = severityConfig[alert.severity];
        const Icon = config.icon;
        const expiryDate = new Date(alert.expiresAt).toLocaleDateString(
          "pt-BR",
        );

        return (
          <div
            key={alert.issuerId}
            className={`flex items-center justify-between p-4 rounded-lg border ${config.bg} ${config.border}`}
          >
            <div className="flex items-center gap-3">
              <Icon className={`h-5 w-5 ${config.text}`} />
              <div>
                <div className={`font-medium ${config.text}`}>
                  <span className="text-xs font-bold mr-2">{config.label}</span>
                  Certificado expira em {alert.daysUntilExpiry} dias
                </div>
                <div className={`text-sm ${config.text} opacity-80`}>
                  {alert.issuerName} ({formatCNPJ(alert.cnpj)}) — Vencimento:{" "}
                  {expiryDate}
                </div>
              </div>
            </div>
            <button
              onClick={() => setDismissed([...dismissed, alert.issuerId])}
              className={`p-1 rounded hover:bg-black/10 ${config.text}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
