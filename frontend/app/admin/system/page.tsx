"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Database,
  Server,
  FileText,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Clock,
  Cpu,
  HardDrive,
} from "lucide-react";

interface StatusSistema {
  geral: "operacional" | "degradado" | "critico";
  uptime: number;
  timestamp: string;
  servicos: {
    nome: string;
    status: "online" | "offline" | "degradado";
    latencia: number | null;
    ultimaVerificacao: string;
  }[];
  acbr: {
    nfe: boolean;
    nfce: boolean;
    mdfe: boolean;
    nfse: boolean;
  };
  metricas: {
    cpu: number;
    memoria: number;
    disco: number;
    conexoesDb: number;
    maxConexoesDb: number;
  };
  errosRecentes: {
    id: string;
    mensagem: string;
    contador: number;
    ultimaOcorrencia: string;
  }[];
}

export default function PaginaSistema() {
  const [status, setStatus] = useState<StatusSistema | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const carregarStatus = async () => {
    // Mock data - substituir por chamada API
    const statusMock: StatusSistema = {
      geral: "operacional",
      uptime: 864000, // 10 dias em segundos
      timestamp: new Date().toISOString(),
      servicos: [
        {
          nome: "API Gateway",
          status: "online",
          latencia: 12,
          ultimaVerificacao: new Date().toISOString(),
        },
        {
          nome: "PostgreSQL",
          status: "online",
          latencia: 3,
          ultimaVerificacao: new Date().toISOString(),
        },
        {
          nome: "Redis Cache",
          status: "online",
          latencia: 1,
          ultimaVerificacao: new Date().toISOString(),
        },
        {
          nome: "ACBr Monitor",
          status: "online",
          latencia: 45,
          ultimaVerificacao: new Date().toISOString(),
        },
        {
          nome: "SEFAZ (Homologação)",
          status: "online",
          latencia: 890,
          ultimaVerificacao: new Date().toISOString(),
        },
      ],
      acbr: {
        nfe: true,
        nfce: true,
        mdfe: true,
        nfse: true,
      },
      metricas: {
        cpu: 23,
        memoria: 67,
        disco: 45,
        conexoesDb: 12,
        maxConexoesDb: 100,
      },
      errosRecentes: [
        {
          id: "1",
          mensagem: "Timeout ao conectar com SEFAZ-SP",
          contador: 3,
          ultimaOcorrencia: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "2",
          mensagem: "Certificado digital próximo do vencimento",
          contador: 1,
          ultimaOcorrencia: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
    };

    return statusMock;
  };

  useEffect(() => {
    carregarStatus().then((data) => {
      setStatus(data);
      setCarregando(false);
    });
  }, []);

  const handleAtualizar = async () => {
    setAtualizando(true);
    const novoStatus = await carregarStatus();
    setStatus(novoStatus);
    setAtualizando(false);
  };

  const formatarUptime = (segundos: number) => {
    const dias = Math.floor(segundos / 86400);
    const horas = Math.floor((segundos % 86400) / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    return `${dias}d ${horas}h ${minutos}m`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
      case "operacional":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "degradado":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "offline":
      case "critico":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-500">Online</Badge>;
      case "degradado":
        return <Badge className="bg-yellow-500">Degradado</Badge>;
      case "offline":
        return <Badge variant="destructive">Offline</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMetricaColor = (valor: number) => {
    if (valor < 50) return "bg-green-500";
    if (valor < 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sistema</h1>
          <p className="text-muted-foreground">
            Monitoramento de saúde da plataforma
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {getStatusIcon(status?.geral || "operacional")}
            <span className="font-medium capitalize">{status?.geral}</span>
          </div>
          <Button
            variant="outline"
            onClick={handleAtualizar}
            disabled={atualizando}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${atualizando ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Ativo</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status ? formatarUptime(status.uptime) : "-"}
            </div>
            <p className="text-xs text-muted-foreground">Sem interrupções</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.metricas.cpu}%</div>
            <div className="mt-2 h-2 rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${getMetricaColor(status?.metricas.cpu || 0)}`}
                style={{ width: `${status?.metricas.cpu}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memória</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status?.metricas.memoria}%
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${getMetricaColor(status?.metricas.memoria || 0)}`}
                style={{ width: `${status?.metricas.memoria}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disco</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.metricas.disco}%</div>
            <div className="mt-2 h-2 rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${getMetricaColor(status?.metricas.disco || 0)}`}
                style={{ width: `${status?.metricas.disco}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Serviços e ACBr */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Status dos Serviços */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Serviços
            </CardTitle>
            <CardDescription>Status de cada componente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {status?.servicos.map((servico) => (
                <div
                  key={servico.nome}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(servico.status)}
                    <span className="font-medium">{servico.nome}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {servico.latencia && (
                      <span className="text-sm text-muted-foreground">
                        {servico.latencia}ms
                      </span>
                    )}
                    {getStatusBadge(servico.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status ACBr */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Módulos ACBr
            </CardTitle>
            <CardDescription>
              Disponibilidade dos componentes fiscais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {status?.acbr &&
                Object.entries(status.acbr).map(([modulo, ativo]) => (
                  <div
                    key={modulo}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="font-medium uppercase">{modulo}</span>
                    {ativo ? (
                      <Badge className="bg-green-500">Ativo</Badge>
                    ) : (
                      <Badge variant="destructive">Inativo</Badge>
                    )}
                  </div>
                ))}
            </div>

            {/* Conexões DB */}
            <div className="mt-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span className="font-medium">Conexões PostgreSQL</span>
                </div>
                <span className="font-mono">
                  {status?.metricas.conexoesDb}/{status?.metricas.maxConexoesDb}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{
                    width: `${((status?.metricas.conexoesDb || 0) / (status?.metricas.maxConexoesDb || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Erros Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Erros Recentes
          </CardTitle>
          <CardDescription>
            Últimos erros registrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status?.errosRecentes.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhum erro recente 🎉
            </p>
          ) : (
            <div className="space-y-3">
              {status?.errosRecentes.map((erro) => (
                <div
                  key={erro.id}
                  className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950"
                >
                  <div>
                    <p className="font-medium">{erro.mensagem}</p>
                    <p className="text-sm text-muted-foreground">
                      Última ocorrência:{" "}
                      {new Date(erro.ultimaOcorrencia).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-yellow-500 text-yellow-700"
                  >
                    {erro.contador}x
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
