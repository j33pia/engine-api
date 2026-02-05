"use client";

import { useEffect, useState } from "react";
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
import { Plus, Search, Building2, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Parceiro {
  id: string;
  nome: string;
  cnpj: string | null;
  email: string | null;
  criadoEm: string;
  assinatura: {
    status: string;
    plano: string;
  } | null;
  qtdEmissores: number;
}

export default function PaginaParceiros() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState("");

  useEffect(() => {
    // Dados mock - substituir por chamada API
    const parceirosMock: Parceiro[] = [
      {
        id: "1",
        nome: "TechSoft Sistemas",
        cnpj: "12.345.678/0001-99",
        email: "contato@techsoft.com",
        criadoEm: "2024-01-15T10:00:00Z",
        assinatura: { status: "ATIVO", plano: "Pro" },
        qtdEmissores: 45,
      },
      {
        id: "2",
        nome: "ERP Solutions",
        cnpj: "98.765.432/0001-11",
        email: "suporte@erpsolutions.com",
        criadoEm: "2024-02-20T14:30:00Z",
        assinatura: { status: "ATIVO", plano: "Enterprise" },
        qtdEmissores: 120,
      },
      {
        id: "3",
        nome: "Contábil Express",
        cnpj: "11.222.333/0001-44",
        email: "admin@contabilexpress.com",
        criadoEm: "2024-03-10T09:15:00Z",
        assinatura: { status: "SUSPENSO", plano: "Básico" },
        qtdEmissores: 8,
      },
    ];

    setTimeout(() => {
      setParceiros(parceirosMock);
      setCarregando(false);
    }, 500);
  }, []);

  const parceirosFiltrados = parceiros.filter(
    (p) =>
      p.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
      p.cnpj?.includes(termoBusca) ||
      p.email?.toLowerCase().includes(termoBusca.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parceiros</h1>
          <p className="text-muted-foreground">
            Gerenciamento de software houses parceiras
          </p>
        </div>
        <Button className="bg-red-500 hover:bg-red-600">
          <Plus className="mr-2 h-4 w-4" />
          Novo Parceiro
        </Button>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CNPJ ou email..."
              className="pl-10"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Parceiros */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Parceiros</CardTitle>
          <CardDescription>
            {parceirosFiltrados.length} parceiros encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parceiro</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Emissores</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parceirosFiltrados.map((parceiro) => (
                  <TableRow key={parceiro.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-red-100 p-2 dark:bg-red-900">
                          <Building2 className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium">{parceiro.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {parceiro.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {parceiro.cnpj || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {parceiro.assinatura?.plano || "Sem plano"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          parceiro.assinatura?.status === "ATIVO"
                            ? "default"
                            : "destructive"
                        }
                        className={
                          parceiro.assinatura?.status === "ATIVO"
                            ? "bg-green-500"
                            : ""
                        }
                      >
                        {parceiro.assinatura?.status || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>{parceiro.qtdEmissores}</TableCell>
                    <TableCell>
                      {new Date(parceiro.criadoEm).toLocaleDateString("pt-BR")}
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
