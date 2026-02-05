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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ScrollText,
  Search,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface LogAuditoria {
  id: string;
  action: string;
  status: "SUCCESS" | "ERROR" | "WARNING";
  userId: string | null;
  partnerId: string | null;
  partnerName: string | null;
  ip: string | null;
  duration: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface Paginacao {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function PaginaAuditoria() {
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [paginacao, setPaginacao] = useState<Paginacao>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [carregando, setCarregando] = useState(true);
  const [filtros, setFiltros] = useState({
    busca: "",
    status: "todos",
    action: "",
  });

  useEffect(() => {
    // Mock data - substituir por chamada API
    const logsMock: LogAuditoria[] = [
      {
        id: "1",
        action: "POST /invoices",
        status: "SUCCESS",
        userId: "user-1",
        partnerId: "partner-1",
        partnerName: "TechSoft Sistemas",
        ip: "192.168.1.100",
        duration: 245,
        metadata: { model: "55", chNFe: "35..." },
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        action: "POST /invoices/cancel",
        status: "ERROR",
        userId: "user-2",
        partnerId: "partner-2",
        partnerName: "ERP Solutions",
        ip: "192.168.1.101",
        duration: 1520,
        metadata: { error: "NFe já cancelada" },
        createdAt: new Date(Date.now() - 60000).toISOString(),
      },
      {
        id: "3",
        action: "GET /issuers",
        status: "SUCCESS",
        userId: "user-1",
        partnerId: "partner-1",
        partnerName: "TechSoft Sistemas",
        ip: "192.168.1.100",
        duration: 45,
        metadata: null,
        createdAt: new Date(Date.now() - 120000).toISOString(),
      },
      {
        id: "4",
        action: "POST /nfse",
        status: "WARNING",
        userId: "user-3",
        partnerId: "partner-3",
        partnerName: "Contábil Express",
        ip: "192.168.1.102",
        duration: 890,
        metadata: { warning: "Prefeitura indisponível" },
        createdAt: new Date(Date.now() - 180000).toISOString(),
      },
      {
        id: "5",
        action: "DELETE /api-keys/old",
        status: "SUCCESS",
        userId: "admin-1",
        partnerId: null,
        partnerName: null,
        ip: "10.0.0.1",
        duration: 12,
        metadata: { count: 5 },
        createdAt: new Date(Date.now() - 240000).toISOString(),
      },
    ];

    // Gerar mais logs para paginação
    const todosLogs = [...logsMock];
    for (let i = 6; i <= 100; i++) {
      todosLogs.push({
        id: String(i),
        action: [
          "GET /invoices",
          "POST /invoices",
          "GET /issuers",
          "POST /nfse",
        ][Math.floor(Math.random() * 4)],
        status: ["SUCCESS", "ERROR", "SUCCESS", "SUCCESS", "WARNING"][
          Math.floor(Math.random() * 5)
        ] as "SUCCESS" | "ERROR" | "WARNING",
        userId: `user-${Math.floor(Math.random() * 10)}`,
        partnerId: `partner-${Math.floor(Math.random() * 5)}`,
        partnerName: ["TechSoft", "ERP Solutions", "Contábil Express"][
          Math.floor(Math.random() * 3)
        ],
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        duration: Math.floor(Math.random() * 2000),
        metadata: null,
        createdAt: new Date(Date.now() - i * 60000).toISOString(),
      });
    }

    setTimeout(() => {
      setLogs(todosLogs.slice(0, 20));
      setPaginacao({
        page: 1,
        limit: 20,
        total: todosLogs.length,
        pages: Math.ceil(todosLogs.length / 20),
      });
      setCarregando(false);
    }, 500);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <Badge className="bg-green-500">Sucesso</Badge>;
      case "ERROR":
        return <Badge variant="destructive">Erro</Badge>;
      case "WARNING":
        return <Badge className="bg-yellow-500">Alerta</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleExportarCSV = () => {
    // TODO: Implementar exportação CSV
    alert("Exportação CSV em desenvolvimento");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Logs de Auditoria</h1>
          <p className="text-muted-foreground">
            Histórico de todas as operações da plataforma
          </p>
        </div>
        <Button variant="outline" onClick={handleExportarCSV}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por ação, IP, parceiro..."
                className="pl-10"
                value={filtros.busca}
                onChange={(e) =>
                  setFiltros({ ...filtros, busca: e.target.value })
                }
              />
            </div>
            <Select
              value={filtros.status}
              onValueChange={(value) =>
                setFiltros({ ...filtros, status: value })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="SUCCESS">Sucesso</SelectItem>
                <SelectItem value="ERROR">Erro</SelectItem>
                <SelectItem value="WARNING">Alerta</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Mais filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Registros
          </CardTitle>
          <CardDescription>
            {paginacao.total.toLocaleString("pt-BR")} logs encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Parceiro</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Duração</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-xs">
                          {log.action}
                        </code>
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>{log.partnerName || "-"}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.ip || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatDuration(log.duration)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginação */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Página {paginacao.page} de {paginacao.pages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={paginacao.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={paginacao.page >= paginacao.pages}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
