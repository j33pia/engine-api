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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  CreditCard,
  FileText,
  Settings,
  Plus,
  Eye,
  TrendingUp,
  Building2,
  Check,
} from "lucide-react";

interface Plano {
  id: string;
  nome: string;
  preco: number;
  limiteNotas: number;
  limiteEmissores: number;
  recursos: string[];
  ativo: boolean;
  assinantes: number;
}

interface Fatura {
  id: string;
  parceiro: string;
  plano: string;
  periodo: string;
  notasEmitidas: number;
  valor: number;
  status: "PAGO" | "PENDENTE" | "ATRASADO" | "CANCELADO";
  vencimento: string;
  criadaEm: string;
}

interface ConfiguracaoPreco {
  precoNota: number;
  precoNotaExcedente: number;
  descontoPorVolume: number;
}

export default function PaginaBilling() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [config, setConfig] = useState<ConfiguracaoPreco>({
    precoNota: 0.1,
    precoNotaExcedente: 0.12,
    descontoPorVolume: 10,
  });
  const [carregando, setCarregando] = useState(true);
  const [modalNovoPlano, setModalNovoPlano] = useState(false);
  const [novoPlano, setNovoPlano] = useState({
    nome: "",
    preco: "",
    limiteNotas: "",
    limiteEmissores: "",
  });

  useEffect(() => {
    // Mock data
    const planosMock: Plano[] = [
      {
        id: "1",
        nome: "Básico",
        preco: 99.9,
        limiteNotas: 500,
        limiteEmissores: 3,
        recursos: ["NFe", "NFCe", "Suporte Email"],
        ativo: true,
        assinantes: 45,
      },
      {
        id: "2",
        nome: "Pro",
        preco: 299.9,
        limiteNotas: 2000,
        limiteEmissores: 10,
        recursos: [
          "NFe",
          "NFCe",
          "MDFe",
          "NFSe",
          "Webhooks",
          "Suporte Prioritário",
        ],
        ativo: true,
        assinantes: 28,
      },
      {
        id: "3",
        nome: "Enterprise",
        preco: 999.9,
        limiteNotas: 10000,
        limiteEmissores: 50,
        recursos: [
          "Todos os módulos",
          "API ilimitada",
          "Suporte 24/7",
          "SLA 99.9%",
        ],
        ativo: true,
        assinantes: 12,
      },
    ];

    const faturasMock: Fatura[] = [
      {
        id: "1",
        parceiro: "TechSoft Sistemas",
        plano: "Pro",
        periodo: "Janeiro 2026",
        notasEmitidas: 1850,
        valor: 299.9,
        status: "PAGO",
        vencimento: "2026-01-10",
        criadaEm: "2026-01-01",
      },
      {
        id: "2",
        parceiro: "ERP Solutions",
        plano: "Enterprise",
        periodo: "Janeiro 2026",
        notasEmitidas: 8420,
        valor: 999.9,
        status: "PAGO",
        vencimento: "2026-01-10",
        criadaEm: "2026-01-01",
      },
      {
        id: "3",
        parceiro: "Contábil Express",
        plano: "Básico",
        periodo: "Fevereiro 2026",
        notasEmitidas: 320,
        valor: 99.9,
        status: "PENDENTE",
        vencimento: "2026-02-10",
        criadaEm: "2026-02-01",
      },
      {
        id: "4",
        parceiro: "Mega Systems",
        plano: "Pro",
        periodo: "Janeiro 2026",
        notasEmitidas: 2100,
        valor: 311.9,
        status: "ATRASADO",
        vencimento: "2026-01-10",
        criadaEm: "2026-01-01",
      },
    ];

    setTimeout(() => {
      setPlanos(planosMock);
      setFaturas(faturasMock);
      setCarregando(false);
    }, 500);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAGO":
        return <Badge className="bg-green-500">Pago</Badge>;
      case "PENDENTE":
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case "ATRASADO":
        return <Badge variant="destructive">Atrasado</Badge>;
      case "CANCELADO":
        return <Badge variant="outline">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleCriarPlano = () => {
    // TODO: Chamar API
    const novo: Plano = {
      id: String(planos.length + 1),
      nome: novoPlano.nome,
      preco: parseFloat(novoPlano.preco),
      limiteNotas: parseInt(novoPlano.limiteNotas),
      limiteEmissores: parseInt(novoPlano.limiteEmissores),
      recursos: [],
      ativo: true,
      assinantes: 0,
    };
    setPlanos([...planos, novo]);
    setModalNovoPlano(false);
    setNovoPlano({ nome: "", preco: "", limiteNotas: "", limiteEmissores: "" });
  };

  const handleSalvarConfig = () => {
    // TODO: Chamar API
    alert("Configurações salvas com sucesso!");
  };

  // Métricas
  const mrrTotal = planos.reduce((acc, p) => acc + p.preco * p.assinantes, 0);
  const totalAssinantes = planos.reduce((acc, p) => acc + p.assinantes, 0);
  const faturasPendentes = faturas.filter(
    (f) => f.status === "PENDENTE" || f.status === "ATRASADO",
  );

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
          <h1 className="text-3xl font-bold">Faturamento</h1>
          <p className="text-muted-foreground">
            Gerenciamento de planos, faturas e preços
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarMoeda(mrrTotal)}</div>
            <p className="text-xs text-muted-foreground">
              Receita Mensal Recorrente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinantes</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssinantes}</div>
            <p className="text-xs text-muted-foreground">Parceiros ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Faturas Pendentes
            </CardTitle>
            <FileText className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{faturasPendentes.length}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando pagamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preço/Nota</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatarMoeda(config.precoNota)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor base por emissão
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="planos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="planos">
            <CreditCard className="mr-2 h-4 w-4" />
            Planos
          </TabsTrigger>
          <TabsTrigger value="faturas">
            <FileText className="mr-2 h-4 w-4" />
            Faturas
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Tab Planos */}
        <TabsContent value="planos" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={modalNovoPlano} onOpenChange={setModalNovoPlano}>
              <DialogTrigger asChild>
                <Button className="bg-red-500 hover:bg-red-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Plano
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Plano</DialogTitle>
                  <DialogDescription>
                    Configure os detalhes do novo plano de assinatura
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nome">Nome do Plano</Label>
                    <Input
                      id="nome"
                      value={novoPlano.nome}
                      onChange={(e) =>
                        setNovoPlano({ ...novoPlano, nome: e.target.value })
                      }
                      placeholder="Ex: Premium"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="preco">Preço Mensal (R$)</Label>
                    <Input
                      id="preco"
                      type="number"
                      step="0.01"
                      value={novoPlano.preco}
                      onChange={(e) =>
                        setNovoPlano({ ...novoPlano, preco: e.target.value })
                      }
                      placeholder="199.90"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="limiteNotas">Limite de Notas/mês</Label>
                    <Input
                      id="limiteNotas"
                      type="number"
                      value={novoPlano.limiteNotas}
                      onChange={(e) =>
                        setNovoPlano({
                          ...novoPlano,
                          limiteNotas: e.target.value,
                        })
                      }
                      placeholder="1000"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="limiteEmissores">Limite de Emissores</Label>
                    <Input
                      id="limiteEmissores"
                      type="number"
                      value={novoPlano.limiteEmissores}
                      onChange={(e) =>
                        setNovoPlano({
                          ...novoPlano,
                          limiteEmissores: e.target.value,
                        })
                      }
                      placeholder="5"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setModalNovoPlano(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCriarPlano}>Criar Plano</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {planos.map((plano) => (
              <Card
                key={plano.id}
                className={
                  plano.nome === "Pro" ? "border-red-500 border-2" : ""
                }
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{plano.nome}</CardTitle>
                    {plano.nome === "Pro" && (
                      <Badge className="bg-red-500">Popular</Badge>
                    )}
                  </div>
                  <CardDescription>
                    {plano.assinantes} assinantes ativos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">
                      {formatarMoeda(plano.preco)}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {plano.limiteNotas.toLocaleString("pt-BR")} notas/mês
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {plano.limiteEmissores} emissores
                    </li>
                    {plano.recursos.slice(0, 3).map((recurso) => (
                      <li
                        key={recurso}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 text-green-500" />
                        {recurso}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full">
                    Editar Plano
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab Faturas */}
        <TabsContent value="faturas">
          <Card>
            <CardHeader>
              <CardTitle>Faturas Recentes</CardTitle>
              <CardDescription>
                Histórico de cobranças por parceiro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parceiro</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faturas.map((fatura) => (
                    <TableRow key={fatura.id}>
                      <TableCell className="font-medium">
                        {fatura.parceiro}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{fatura.plano}</Badge>
                      </TableCell>
                      <TableCell>{fatura.periodo}</TableCell>
                      <TableCell>
                        {fatura.notasEmitidas.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatarMoeda(fatura.valor)}
                      </TableCell>
                      <TableCell>{getStatusBadge(fatura.status)}</TableCell>
                      <TableCell>
                        {new Date(fatura.vencimento).toLocaleDateString(
                          "pt-BR",
                        )}
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Configurações */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Preço</CardTitle>
              <CardDescription>
                Defina os valores base para cobrança
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="precoNota">Preço por Nota (R$)</Label>
                  <Input
                    id="precoNota"
                    type="number"
                    step="0.01"
                    value={config.precoNota}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        precoNota: parseFloat(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Valor cobrado por cada nota emitida
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="precoExcedente">
                    Preço Nota Excedente (R$)
                  </Label>
                  <Input
                    id="precoExcedente"
                    type="number"
                    step="0.01"
                    value={config.precoNotaExcedente}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        precoNotaExcedente: parseFloat(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Valor cobrado quando excede o limite do plano
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="desconto">Desconto por Volume (%)</Label>
                  <Input
                    id="desconto"
                    type="number"
                    value={config.descontoPorVolume}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        descontoPorVolume: parseInt(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Desconto para parceiros com alto volume
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSalvarConfig}
                className="bg-red-500 hover:bg-red-600"
              >
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
