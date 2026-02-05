"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Building2,
  Edit,
  Trash2,
  Key,
  FileText,
  Users,
  RefreshCw,
  Pause,
  Play,
} from "lucide-react";
import Link from "next/link";

interface Parceiro {
  id: string;
  nome: string;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  criadoEm: string;
  apiKey: string;
  assinatura: {
    status: string;
    plano: string;
  } | null;
  emissores: {
    id: string;
    nome: string;
    cnpj: string;
    qtdNotas: number;
  }[];
  uso: {
    nfe: number;
    nfce: number;
    mdfe: number;
    nfse: number;
    total: number;
  };
}

export default function PaginaDetalhesParceiro() {
  const params = useParams();
  const router = useRouter();
  const [parceiro, setParceiro] = useState<Parceiro | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    email: "",
    telefone: "",
  });

  useEffect(() => {
    // Mock data - substituir por chamada API
    const parceiroMock: Parceiro = {
      id: params.id as string,
      nome: "TechSoft Sistemas",
      cnpj: "12.345.678/0001-99",
      email: "contato@techsoft.com",
      telefone: "(11) 99999-8888",
      criadoEm: "2024-01-15T10:00:00Z",
      apiKey: "ea_xK9mN2pQ4rS6tU8vW0yZ1aB3cD5eF7",
      assinatura: { status: "ATIVO", plano: "Pro" },
      emissores: [
        {
          id: "1",
          nome: "Loja Centro",
          cnpj: "12.345.678/0001-99",
          qtdNotas: 1250,
        },
        {
          id: "2",
          nome: "Loja Norte",
          cnpj: "12.345.678/0002-70",
          qtdNotas: 890,
        },
        {
          id: "3",
          nome: "Loja Sul",
          cnpj: "12.345.678/0003-51",
          qtdNotas: 456,
        },
      ],
      uso: { nfe: 2100, nfce: 890, mdfe: 45, nfse: 120, total: 3155 },
    };

    setTimeout(() => {
      setParceiro(parceiroMock);
      setFormData({
        nome: parceiroMock.nome,
        cnpj: parceiroMock.cnpj || "",
        email: parceiroMock.email || "",
        telefone: parceiroMock.telefone || "",
      });
      setCarregando(false);
    }, 500);
  }, [params.id]);

  const handleSalvar = async () => {
    setSalvando(true);
    // TODO: Chamada API PATCH /admin/partners/:id
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setParceiro((prev) => (prev ? { ...prev, ...formData } : null));
    setSalvando(false);
    setModalEditarAberto(false);
  };

  const handleSuspender = async () => {
    // TODO: Chamada API PATCH /admin/partners/:id/status
    setParceiro((prev) =>
      prev
        ? { ...prev, assinatura: { ...prev.assinatura!, status: "SUSPENSO" } }
        : null,
    );
  };

  const handleReativar = async () => {
    // TODO: Chamada API PATCH /admin/partners/:id/status
    setParceiro((prev) =>
      prev
        ? { ...prev, assinatura: { ...prev.assinatura!, status: "ATIVO" } }
        : null,
    );
  };

  const handleExcluir = async () => {
    // TODO: Chamada API DELETE /admin/partners/:id
    router.push("/admin/partners");
  };

  const handleRegenerarApiKey = async () => {
    // TODO: Chamada API POST /admin/partners/:id/regenerate-api-key
    const novaKey = "ea_" + Math.random().toString(36).substring(2, 34);
    setParceiro((prev) => (prev ? { ...prev, apiKey: novaKey } : null));
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    );
  }

  if (!parceiro) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Parceiro não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/partners">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{parceiro.nome}</h1>
            <p className="text-muted-foreground font-mono">{parceiro.cnpj}</p>
          </div>
          <Badge
            variant={
              parceiro.assinatura?.status === "ATIVO"
                ? "default"
                : "destructive"
            }
            className={
              parceiro.assinatura?.status === "ATIVO" ? "bg-green-500" : ""
            }
          >
            {parceiro.assinatura?.status}
          </Badge>
        </div>

        <div className="flex gap-2">
          {/* Editar */}
          <Dialog open={modalEditarAberto} onOpenChange={setModalEditarAberto}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Parceiro</DialogTitle>
                <DialogDescription>
                  Atualize as informações do parceiro
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) =>
                      setFormData({ ...formData, cnpj: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) =>
                      setFormData({ ...formData, telefone: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setModalEditarAberto(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSalvar} disabled={salvando}>
                  {salvando ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Suspender/Reativar */}
          {parceiro.assinatura?.status === "ATIVO" ? (
            <Button variant="outline" onClick={handleSuspender}>
              <Pause className="mr-2 h-4 w-4" />
              Suspender
            </Button>
          ) : (
            <Button variant="outline" onClick={handleReativar}>
              <Play className="mr-2 h-4 w-4" />
              Reativar
            </Button>
          )}

          {/* Excluir */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá desativar permanentemente o parceiro "
                  {parceiro.nome}". Todos os emissores e dados serão mantidos,
                  mas o acesso será bloqueado.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleExcluir}
                  className="bg-red-500"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Cards de Informações */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plano</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parceiro.assinatura?.plano}
            </div>
            <p className="text-xs text-muted-foreground">
              Desde {new Date(parceiro.criadoEm).toLocaleDateString("pt-BR")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emissores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parceiro.emissores.length}
            </div>
            <p className="text-xs text-muted-foreground">CNPJs cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Notas
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parceiro.uso.total.toLocaleString("pt-BR")}
            </div>
            <p className="text-xs text-muted-foreground">Emitidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Key</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono truncate">{parceiro.apiKey}</div>
            <Button
              variant="link"
              size="sm"
              className="px-0 text-xs"
              onClick={handleRegenerarApiKey}
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Regenerar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Uso por Modelo */}
      <Card>
        <CardHeader>
          <CardTitle>Uso por Modelo</CardTitle>
          <CardDescription>
            Distribuição de documentos fiscais emitidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-4 rounded-lg border p-4">
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">NFe</p>
                <p className="text-xl font-bold">
                  {parceiro.uso.nfe.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-lg border p-4">
              <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">NFCe</p>
                <p className="text-xl font-bold">
                  {parceiro.uso.nfce.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-lg border p-4">
              <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">MDFe</p>
                <p className="text-xl font-bold">
                  {parceiro.uso.mdfe.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-lg border p-4">
              <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">NFSe</p>
                <p className="text-xl font-bold">
                  {parceiro.uso.nfse.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Emissores */}
      <Card>
        <CardHeader>
          <CardTitle>Emissores</CardTitle>
          <CardDescription>CNPJs cadastrados por este parceiro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {parceiro.emissores.map((emissor) => (
              <div
                key={emissor.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-gray-100 p-2 dark:bg-gray-800">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{emissor.nome}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {emissor.cnpj}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {emissor.qtdNotas.toLocaleString("pt-BR")}
                  </p>
                  <p className="text-xs text-muted-foreground">notas</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
