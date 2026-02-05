"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvoiceStatusBadge } from "@/components/dashboard/invoice-status-badge";
import { api } from "@/services/api";
import { FileDown, Loader2, Search } from "lucide-react";

interface FiscalEvent {
  id: string;
  eventType: string;
  sequence: number;
  description: string;
  protocol: string | null;
  createdAt: string;
}

interface Invoice {
  id: string;
  number: number;
  series: number;
  accessKey: string | null;
  destName: string | null;
  amount: number;
  status: string;
  model: string; // 55 = NFe, 65 = NFCe
  createdAt: string;
  fiscalEvents?: FiscalEvent[];
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all"); // all, 55, 65, 58

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const res = await api.get("/nfe");
        setInvoices(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadInvoices();
  }, []);

  useEffect(() => {
    let filtered = invoices;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((inv) => inv.status === statusFilter);
    }

    // Filter by document model (NFe/NFCe)
    if (modelFilter !== "all") {
      filtered = filtered.filter((inv) => inv.model === modelFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (inv) =>
          inv.number.toString().includes(searchTerm) ||
          inv.accessKey?.includes(searchTerm) ||
          inv.destName?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredInvoices(filtered);
  }, [searchTerm, statusFilter, modelFilter, invoices]);

  // Download handlers que verificam o modelo do documento
  const handleDownloadXml = (invoice: Invoice) => {
    if (!invoice.accessKey) return;
    const endpoint =
      invoice.model === "65" ? "nfce" : invoice.model === "58" ? "mdfe" : "nfe";
    window.open(
      `http://localhost:3001/${endpoint}/xml/${invoice.accessKey}`,
      "_blank",
    );
  };

  const handleDownloadPdf = (invoice: Invoice) => {
    if (!invoice.accessKey) return;
    const endpoint =
      invoice.model === "65" ? "nfce" : invoice.model === "58" ? "mdfe" : "nfe";
    window.open(
      `http://localhost:3001/${endpoint}/pdf/${invoice.accessKey}`,
      "_blank",
    );
  };

  const handleDownloadCceXml = (accessKey: string, seq: number) => {
    window.open(
      `http://localhost:3001/nfe/cce/${accessKey}/xml?seq=${seq}`,
      "_blank",
    );
  };

  const handleDownloadCcePdf = (accessKey: string, seq: number) => {
    window.open(
      `http://localhost:3001/nfe/cce/${accessKey}/pdf?seq=${seq}`,
      "_blank",
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Monitor de Notas</h2>
        <p className="text-muted-foreground">
          Consulte e faça download de todas as NFes emitidas.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre e busque NFes emitidas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Número, chave ou destinatário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={modelFilter} onValueChange={setModelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📋 Todos</SelectItem>
                  <SelectItem value="55">📄 NFe (Mod. 55)</SelectItem>
                  <SelectItem value="65">🧾 NFCe (Mod. 65)</SelectItem>
                  <SelectItem value="58">📦 MDFe (Mod. 58)</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="CREATED">Criadas</SelectItem>
                  <SelectItem value="CANCELED">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>NFes Emitidas ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Nº</TableHead>
                <TableHead>Série</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Docs</TableHead>
                <TableHead>CC-e</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground"
                  >
                    Nenhuma nota encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.model === "65"
                            ? "bg-purple-100 text-purple-800"
                            : invoice.model === "58"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {invoice.model === "65"
                          ? "🧾 NFCe"
                          : invoice.model === "58"
                            ? "📦 MDFe"
                            : "📄 NFe"}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono">
                      {invoice.number}
                    </TableCell>
                    <TableCell>{invoice.series}</TableCell>
                    <TableCell>
                      {new Date(invoice.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {invoice.destName || "-"}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(invoice.amount)}
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={invoice.status as any} />
                    </TableCell>
                    {/* Coluna NFe - XML e PDF da nota */}
                    <TableCell>
                      <div className="flex gap-1">
                        {invoice.accessKey && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadXml(invoice)}
                              title="Download XML"
                            >
                              <FileDown className="h-4 w-4 mr-1" />
                              XML
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadPdf(invoice)}
                              title="Download PDF"
                            >
                              <FileDown className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                          </>
                        )}
                        {!invoice.accessKey && (
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
                        )}
                      </div>
                    </TableCell>
                    {/* Coluna CC-e - Cartas de Correção */}
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {invoice.accessKey &&
                        invoice.fiscalEvents &&
                        invoice.fiscalEvents.filter(
                          (e) => e.eventType === "CCE",
                        ).length > 0 ? (
                          invoice.fiscalEvents
                            .filter((e) => e.eventType === "CCE")
                            .map((cce) => (
                              <div
                                key={cce.id}
                                className="flex gap-1 items-center"
                              >
                                <span className="text-xs text-muted-foreground mr-1">
                                  #{cce.sequence}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleDownloadCceXml(
                                      invoice.accessKey!,
                                      cce.sequence,
                                    )
                                  }
                                  title={`XML CC-e ${cce.sequence}`}
                                  className="h-6 px-2 text-xs"
                                >
                                  XML
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleDownloadCcePdf(
                                      invoice.accessKey!,
                                      cce.sequence,
                                    )
                                  }
                                  title={`PDF CC-e ${cce.sequence}`}
                                  className="h-6 px-2 text-xs"
                                >
                                  PDF
                                </Button>
                              </div>
                            ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
