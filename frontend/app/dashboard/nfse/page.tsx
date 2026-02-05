"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Download, Search, Receipt } from "lucide-react";
import { api } from "@/services/api";

interface Nfse {
  id: string;
  number: string;
  verificationCode: string | null;
  status: string;
  codigoMunicipio: string;
  itemListaServico: string;
  discriminacao: string;
  valorServicos: number;
  tomadorCnpjCpf: string;
  tomadorRazao: string;
  createdAt: string;
  authorizedAt: string | null;
  issuer?: {
    name: string;
    cnpj: string;
  };
}

export default function NfsePage() {
  const [nfses, setNfses] = useState<Nfse[]>([]);
  const [filteredNfses, setFilteredNfses] = useState<Nfse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const loadNfses = async () => {
      try {
        const res = await api.get("/nfse");
        setNfses(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadNfses();
  }, []);

  useEffect(() => {
    let filtered = nfses;

    if (statusFilter !== "all") {
      filtered = filtered.filter((n) => n.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (n) =>
          n.number.toString().includes(searchTerm) ||
          n.verificationCode?.includes(searchTerm) ||
          n.tomadorRazao.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.tomadorCnpjCpf.includes(searchTerm),
      );
    }

    setFilteredNfses(filtered);
  }, [searchTerm, statusFilter, nfses]);

  const handleDownloadXml = (nfse: Nfse) => {
    window.open(`http://localhost:3001/nfse/xml/${nfse.id}`, "_blank");
  };

  const handleDownloadPdf = (nfse: Nfse) => {
    window.open(`http://localhost:3001/nfse/pdf/${nfse.id}`, "_blank");
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      AUTHORIZED: "bg-green-100 text-green-800",
      CREATED: "bg-gray-100 text-gray-800",
      REJECTED: "bg-red-100 text-red-800",
      CANCELED: "bg-yellow-100 text-yellow-800",
    };
    const labels: Record<string, string> = {
      AUTHORIZED: "Autorizada",
      CREATED: "Criada",
      REJECTED: "Rejeitada",
      CANCELED: "Cancelada",
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          styles[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const formatCurrency = (value: number) => {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            🧾 Monitor de NFS-e
          </h1>
          <p className="text-muted-foreground">
            Notas Fiscais de Serviço Eletrônicas
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            NFSes Emitidas
          </CardTitle>
          <CardDescription>
            Lista de Notas Fiscais de Serviço emitidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Número, tomador, CNPJ/CPF..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="AUTHORIZED">Autorizadas</SelectItem>
                  <SelectItem value="REJECTED">Rejeitadas</SelectItem>
                  <SelectItem value="CANCELED">Canceladas</SelectItem>
                  <SelectItem value="CREATED">Criadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Verificação</TableHead>
                  <TableHead>Tomador</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Docs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredNfses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Receipt className="h-8 w-8 text-muted-foreground" />
                        <p>Nenhuma NFSe encontrada</p>
                        <p className="text-sm text-muted-foreground">
                          Emita uma NFSe no Sandbox para vê-la aqui
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNfses.map((nfse) => (
                    <TableRow key={nfse.id}>
                      <TableCell className="font-mono">{nfse.number}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {nfse.verificationCode || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium truncate max-w-[200px]">
                            {nfse.tomadorRazao}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {nfse.tomadorCnpjCpf}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">{nfse.itemListaServico}</span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(nfse.valorServicos)}
                      </TableCell>
                      <TableCell>{getStatusBadge(nfse.status)}</TableCell>
                      <TableCell>
                        {new Date(nfse.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadXml(nfse)}
                            title="Download XML"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadPdf(nfse)}
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
