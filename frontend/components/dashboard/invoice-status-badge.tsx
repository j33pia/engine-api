"use client";

import { Badge } from "@/components/ui/badge";

type InvoiceStatus =
  | "CREATED"
  | "SIGNED"
  | "TRANSMITTING"
  | "AUTHORIZED"
  | "REJECTED"
  | "CANCELED"
  | "ERROR";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

const statusConfig: Record<
  InvoiceStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  CREATED: { label: "Criada", variant: "secondary" },
  SIGNED: { label: "Assinada", variant: "default" },
  TRANSMITTING: { label: "Enviando", variant: "default" },
  AUTHORIZED: { label: "Autorizada", variant: "default" },
  REJECTED: { label: "Rejeitada", variant: "destructive" },
  CANCELED: { label: "Cancelada", variant: "outline" },
  ERROR: { label: "Erro", variant: "destructive" },
};

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.CREATED;

  return (
    <Badge variant={config.variant} className="font-medium">
      {config.label}
    </Badge>
  );
}
