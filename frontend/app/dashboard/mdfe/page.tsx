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
import { FileText, Download, Search, Truck } from "lucide-react";
import { api } from "@/services/api";

interface Mdfe {
  id: string;
  number: number;
  series: number;
  accessKey: string | null;
  ufStart: string;
  ufEnd: string;
  placaVeiculo: string;
  nomeMotorista: string;
  vCarga: number;
  qNFe: number;
  qCTe: number;
  status: string;
  createdAt: string;
}

export default function MdfePage() {
  const [mdfes, setMdfes] = useState<Mdfe[]>([]);
  const [filteredMdfes, setFilteredMdfes] = useState<Mdfe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const loadMdfes = async () => {
      try {
        const res = await api.get("/mdfe");
        setMdfes(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadMdfes();
  }, []);

  useEffect(() => {
    let filtered = mdfes;

    if (statusFilter !== "all") {
      filtered = filtered.filter((m) => m.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (m) =>
          m.number.toString().includes(searchTerm) ||
          m.accessKey?.includes(searchTerm) ||
          m.placaVeiculo.includes(searchTerm.toUpperCase()) ||
          m.nomeMotorista.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredMdfes(filtered);
  }, [searchTerm, statusFilter, mdfes]);

  const handleDownloadXml = (mdfe: Mdfe) => {
    if (!mdfe.accessKey) return;
    window.open(`http://localhost:3001/mdfe/xml/${mdfe.accessKey}`, "_blank");
  };

  const handleDownloadPdf = (mdfe: Mdfe) => {
    if (!mdfe.accessKey) return;
    window.open(`http://localhost:3001/mdfe/pdf/${mdfe.accessKey}`, "_blank");
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      AUTHORIZED: "bg-green-100 text-green-800",
      CREATED: "bg-gray-100 text-gray-800",
      REJECTED: "bg-red-100 text-red-800",
      CANCELED: "bg-yellow-100 text-yellow-800",
      CLOSED: "bg-blue-100 text-blue-800",
    };
    const labels: Record<string, string> = {
      AUTHORIZED: "Autorizado",
      CREATED: "Criado",
      REJECTED: "Rejeitado",
      CANCELED: "Cancelado",
      CLOSED: "Encerrado",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            📦 Monitor de MDF-e
          </h1>
          <p className="text-muted-foreground">
            Manifestos Eletrônicos de Documentos Fiscais (Modelo 58)
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Manifestos Emitidos
          </CardTitle>
          <CardDescription>
            Lista de MDF-e emitidos para transporte de mercadorias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Número, placa, motorista..."
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
                  <SelectItem value="AUTHORIZED">Autorizados</SelectItem>
                  <SelectItem value="CLOSED">Encerrados</SelectItem>
                  <SelectItem value="REJECTED">Rejeitados</SelectItem>
                  <SelectItem value="CREATED">Criados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Rota</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>NFe/CTe</TableHead>
                  <TableHead>Valor Carga</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Docs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredMdfes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Truck className="h-8 w-8 text-muted-foreground" />
                        <p>Nenhum MDF-e encontrado</p>
                        <p className="text-sm text-muted-foreground">
                          Emita um manifesto no Sandbox para vê-lo aqui
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMdfes.map((mdfe) => (
                    <TableRow key={mdfe.id}>
                      <TableCell className="font-mono">{mdfe.number}</TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {mdfe.ufStart} → {mdfe.ufEnd}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono">
                        {mdfe.placaVeiculo}
                      </TableCell>
                      <TableCell>{mdfe.nomeMotorista}</TableCell>
                      <TableCell>
                        {mdfe.qNFe > 0 && (
                          <span className="mr-2">{mdfe.qNFe} NFe</span>
                        )}
                        {mdfe.qCTe > 0 && <span>{mdfe.qCTe} CTe</span>}
                      </TableCell>
                      <TableCell>
                        R${" "}
                        {Number(mdfe.vCarga || 0).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>{getStatusBadge(mdfe.status)}</TableCell>
                      <TableCell>
                        {new Date(mdfe.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadXml(mdfe)}
                            disabled={!mdfe.accessKey}
                            title="Download XML"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadPdf(mdfe)}
                            disabled={!mdfe.accessKey}
                            title="Download DAMDFE"
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
