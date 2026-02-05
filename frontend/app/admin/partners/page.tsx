"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Building2, MoreHorizontal, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Partner {
  id: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  createdAt: string;
  subscription: {
    status: string;
    plan: string;
  } | null;
  issuersCount: number;
}

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Mock data - replace with API call
    const mockPartners: Partner[] = [
      {
        id: "1",
        name: "TechSoft Sistemas",
        cnpj: "12.345.678/0001-99",
        email: "contato@techsoft.com",
        createdAt: "2024-01-15T10:00:00Z",
        subscription: { status: "ACTIVE", plan: "Pro" },
        issuersCount: 45,
      },
      {
        id: "2",
        name: "ERP Solutions",
        cnpj: "98.765.432/0001-11",
        email: "suporte@erpsolutions.com",
        createdAt: "2024-02-20T14:30:00Z",
        subscription: { status: "ACTIVE", plan: "Enterprise" },
        issuersCount: 120,
      },
      {
        id: "3",
        name: "Contábil Express",
        cnpj: "11.222.333/0001-44",
        email: "admin@contabilexpress.com",
        createdAt: "2024-03-10T09:15:00Z",
        subscription: { status: "SUSPENDED", plan: "Basic" },
        issuersCount: 8,
      },
    ];

    setTimeout(() => {
      setPartners(mockPartners);
      setLoading(false);
    }, 500);
  }, []);

  const filteredPartners = partners.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cnpj?.includes(searchTerm) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Partners</h1>
          <p className="text-muted-foreground">
            Gerenciamento de software houses parceiras
          </p>
        </div>
        <Button className="bg-red-500 hover:bg-red-600">
          <Plus className="mr-2 h-4 w-4" />
          Novo Partner
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CNPJ ou email..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Partners</CardTitle>
          <CardDescription>
            {filteredPartners.length} partners encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Emissores</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPartners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-red-100 p-2 dark:bg-red-900">
                          <Building2 className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium">{partner.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {partner.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {partner.cnpj || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {partner.subscription?.plan || "Sem plano"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          partner.subscription?.status === "ACTIVE"
                            ? "default"
                            : "destructive"
                        }
                        className={
                          partner.subscription?.status === "ACTIVE"
                            ? "bg-green-500"
                            : ""
                        }
                      >
                        {partner.subscription?.status || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>{partner.issuersCount}</TableCell>
                    <TableCell>
                      {new Date(partner.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
