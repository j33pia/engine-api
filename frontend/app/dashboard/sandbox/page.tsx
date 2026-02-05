"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  XCircle,
  FileEdit,
  AlertCircle,
  Send,
  CheckCircle,
  FileText,
  Sparkles,
  Shield,
  FileCheck,
  Server,
} from "lucide-react";
import { InvoiceStatusBadge } from "@/components/dashboard/invoice-status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const EMISSION_STEPS = [
  { id: 1, label: "Inicializando ACBrLib", icon: Sparkles },
  { id: 2, label: "Configurando Certificado", icon: Shield },
  { id: 3, label: "Limpando Cache", icon: FileText },
  { id: 4, label: "Carregando Dados", icon: FileText },
  { id: 5, label: "Assinando Digitalmente", icon: Shield },
  { id: 6, label: "Validando com SEFAZ", icon: FileCheck },
  { id: 7, label: "Enviando para SEFAZ", icon: Server },
];

interface Invoice {
  id: string;
  number: number;
  series: number;
  accessKey: string | null;
  destName: string | null;
  amount: number;
  status: string;
  createdAt: string;
}

export default function SandboxPage() {
  const [apiKey, setApiKey] = useState("");
  const [documentModel, setDocumentModel] = useState<"55" | "65" | "58">("55"); // NFe=55, NFCe=65, MDFe=58

  // Emission state
  const [emissionLoading, setEmissionLoading] = useState(false);
  const [emissionResult, setEmissionResult] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // JSON Templates
  const nfeTemplate = JSON.stringify(
    {
      amount: 15.5,
      destCNPJ: "12345678000199",
      destName: "Cliente de Teste Sandbox LTDA",
      items: [
        {
          code: "SDX-001",
          description: "Licença de Software SaaS",
          quantity: 1,
          unitPrice: 15.5,
        },
      ],
    },
    null,
    2,
  );

  const nfceTemplate = JSON.stringify(
    {
      destCPF: "", // Opcional para NFCe
      destName: "CONSUMIDOR FINAL",
      paymentType: "01", // 01=Dinheiro, 03=Cartão, 05=PIX
      items: [
        {
          code: "PDV-001",
          description: "Produto de Teste PDV",
          quantity: 2,
          unitPrice: 9.9,
        },
      ],
    },
    null,
    2,
  );

  const mdfeTemplate = JSON.stringify(
    {
      ufStart: "SP",
      ufEnd: "MG",
      dtViagem: new Date().toISOString(),
      placaVeiculo: "ABC1D23",
      renavam: "123456789",
      tara: 5000,
      capKg: 15000,
      cpfMotorista: "12345678901",
      nomeMotorista: "João da Silva",
      vCarga: 25000.0,
      documentos: [
        {
          chNFe: "35260212345678000199550010000000011000000001",
          tpDoc: "1",
        },
      ],
    },
    null,
    2,
  );

  const [jsonBody, setJsonBody] = useState(nfeTemplate);

  // Update JSON when model changes
  const handleModelChange = (model: "55" | "65" | "58") => {
    setDocumentModel(model);
    if (model === "55") {
      setJsonBody(nfeTemplate);
    } else if (model === "65") {
      setJsonBody(nfceTemplate);
    } else {
      setJsonBody(mdfeTemplate);
    }
  };

  // Fiscal operations state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelModal, setCancelModal] = useState<{
    open: boolean;
    invoice: Invoice | null;
  }>({ open: false, invoice: null });
  const [cceModal, setCceModal] = useState<{
    open: boolean;
    invoice: Invoice | null;
  }>({ open: false, invoice: null });
  const [justificativa, setJustificativa] = useState("");
  const [correcao, setCorrecao] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadInvoices();

    // Carregar API Key salva do localStorage
    const savedApiKey = localStorage.getItem("nfe-sandbox-api-key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Salvar API Key no localStorage quando mudar
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem("nfe-sandbox-api-key", apiKey);
    }
  }, [apiKey]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get("/nfe");
      setInvoices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmit = async () => {
    if (!apiKey) {
      setError("Cole sua API Key primeiro!");
      return;
    }

    setEmissionLoading(true);
    setEmissionResult(null);
    setCurrentStep(0);
    setError("");
    setSuccess("");

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < 7) return prev + 1;
        return prev;
      });
    }, 800);

    try {
      // Chama endpoint baseado no modelo selecionado
      const endpoint =
        documentModel === "55"
          ? "/nfe"
          : documentModel === "65"
            ? "/nfce"
            : "/mdfe";
      const docType =
        documentModel === "55"
          ? "NFe"
          : documentModel === "65"
            ? "NFCe"
            : "MDFe";

      const res = await api.post(endpoint, JSON.parse(jsonBody), {
        headers: { "x-api-key": apiKey },
      });
      clearInterval(stepInterval);
      setCurrentStep(7);
      setEmissionResult(res.data);
      setSuccess(`✅ ${docType} emitida com sucesso!`);
      loadInvoices(); // Reload list
    } catch (error: any) {
      clearInterval(stepInterval);
      console.error(error);

      // Extrair mensagem de erro detalhada
      let errorMessage = "Erro desconhecido na emissão";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Verificar erros comuns e dar dicas
      if (errorMessage.includes("CNPJ")) {
        errorMessage +=
          "\n\n💡 Dica: Verifique se o CNPJ da empresa emissora está cadastrado corretamente (sem pontuação).";
      }
      if (
        errorMessage.includes("certificado") ||
        errorMessage.includes("Certificado")
      ) {
        errorMessage +=
          "\n\n💡 Dica: Verifique se o certificado digital foi carregado corretamente e se a senha está correta.";
      }
      if (
        errorMessage.includes("Signature") ||
        errorMessage.includes("namespace")
      ) {
        errorMessage +=
          "\n\n💡 Dica: Erro interno de assinatura XML. Entre em contato com o suporte técnico.";
      }

      setError(`❌ Erro na emissão: ${errorMessage}`);
      setCurrentStep(0);
    } finally {
      setEmissionLoading(false);
    }
  };

  const handleCancelar = async () => {
    if (!cancelModal.invoice || !apiKey) return;

    if (justificativa.trim().length < 15) {
      setError("Justificativa deve ter no mínimo 15 caracteres");
      return;
    }

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      await api.post(
        `/nfe/${cancelModal.invoice.accessKey}/cancelar`,
        { justificativa },
        { headers: { "x-api-key": apiKey } },
      );

      setSuccess("✅ NFe cancelada com sucesso!");
      setCancelModal({ open: false, invoice: null });
      setJustificativa("");
      loadInvoices();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao cancelar NFe");
    } finally {
      setProcessing(false);
    }
  };

  const handleEnviarCCe = async () => {
    if (!cceModal.invoice || !apiKey) return;

    if (correcao.trim().length < 15) {
      setError("Correção deve ter no mínimo 15 caracteres");
      return;
    }

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post(
        `/nfe/${cceModal.invoice.accessKey}/carta-correcao`,
        { correcao },
        { headers: { "x-api-key": apiKey } },
      );

      setSuccess(`✅ CC-e registrada com sucesso! (Seq: ${res.data.sequence})`);
      setCceModal({ open: false, invoice: null });
      setCorrecao("");
      loadInvoices();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao enviar CC-e");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Sandbox 🧪</h2>
        <p className="text-muted-foreground">
          Teste emissão de NFe e operações fiscais (Cancelamento e CC-e)
        </p>
      </div>

      {/* API Key Config */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração</CardTitle>
          <CardDescription>
            Sua API Key é salva automaticamente no navegador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>API Key</Label>
              {apiKey && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Salva automaticamente
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Cole sua API Key aqui..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
              />
              {apiKey && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setApiKey("");
                    localStorage.removeItem("nfe-sandbox-api-key");
                  }}
                  title="Limpar API Key"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 text-green-700 bg-green-50">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="emission" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="emission">📝 Emitir NFe</TabsTrigger>
          <TabsTrigger value="operations">⚙️ Operações Fiscais</TabsTrigger>
        </TabsList>

        {/* Tab 1: Emission */}
        <TabsContent value="emission" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Requisição (JSON)</CardTitle>
                <CardDescription>
                  Simule o payload que seu ERP enviaria.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Toggle NFe / NFCe / MDFe */}
                <div className="space-y-2">
                  <Label>Modelo do Documento</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={documentModel === "55" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleModelChange("55")}
                      className="flex-1"
                    >
                      📄 NFe
                    </Button>
                    <Button
                      variant={documentModel === "65" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleModelChange("65")}
                      className="flex-1"
                    >
                      🧾 NFCe
                    </Button>
                    <Button
                      variant={documentModel === "58" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleModelChange("58")}
                      className="flex-1"
                    >
                      📦 MDFe
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {documentModel === "55"
                      ? "NFe (Mod. 55): Nota Fiscal Eletrônica B2B"
                      : documentModel === "65"
                        ? "NFCe (Mod. 65): Cupom Fiscal Varejo"
                        : "MDFe (Mod. 58): Manifesto de Documentos Fiscais"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Payload da Nota</Label>
                  <textarea
                    className="flex min-h-[300px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                    value={jsonBody}
                    onChange={(e) => setJsonBody(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={handleEmit}
                  disabled={emissionLoading || !apiKey}
                >
                  {emissionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Emitir Nota Fiscal
                </Button>
              </CardFooter>
            </Card>

            <Card
              className={
                emissionResult ? "bg-green-50 border-green-200" : "bg-muted/50"
              }
            >
              <CardHeader>
                <CardTitle>Resultado</CardTitle>
                <CardDescription>Retorno da API.</CardDescription>
              </CardHeader>
              <CardContent>
                {emissionLoading ? (
                  <div className="space-y-3">
                    <div className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processando emissão...
                    </div>
                    {EMISSION_STEPS.map((step) => {
                      const Icon = step.icon;
                      const isActive = currentStep === step.id;
                      const isCompleted = currentStep > step.id;
                      const isPending = currentStep < step.id;

                      return (
                        <div
                          key={step.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
                            isActive &&
                              "bg-blue-50 border-l-4 border-blue-500 animate-pulse",
                            isCompleted &&
                              "bg-green-50 border-l-4 border-green-500",
                            isPending && "opacity-30",
                          )}
                        >
                          <div
                            className={cn(
                              "flex items-center justify-center w-8 h-8 rounded-full",
                              isActive &&
                                "bg-blue-500 text-white animate-pulse",
                              isCompleted && "bg-green-500 text-white",
                              isPending && "bg-gray-200",
                            )}
                          >
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Icon
                                className={cn(
                                  "h-4 w-4",
                                  isActive && "animate-spin",
                                )}
                              />
                            )}
                          </div>
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isActive && "text-blue-700",
                              isCompleted && "text-green-700",
                              isPending && "text-muted-foreground",
                            )}
                          >
                            Step {step.id}: {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : emissionResult ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-700 font-bold text-lg">
                      <CheckCircle className="h-6 w-6" />
                      Nota Autorizada!
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase">
                        Protocolo
                      </Label>
                      <div className="font-mono text-sm">
                        {emissionResult.protocol}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase">
                        Chave de Acesso
                      </Label>
                      <div className="font-mono text-sm">
                        {emissionResult.accessKey}
                      </div>
                    </div>
                    <pre className="bg-white p-4 rounded border text-xs overflow-auto max-h-[300px]">
                      {JSON.stringify(emissionResult, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 min-h-[200px]">
                    <FileText className="h-12 w-12 mb-2" />
                    <p>Aguardando envio...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Fiscal Operations */}
        <TabsContent value="operations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                NFes Autorizadas (
                {invoices.filter((i) => i.status === "AUTHORIZED").length})
              </CardTitle>
              <CardDescription>
                Clique em Cancelar ou CC-e para testar as operações
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº</TableHead>
                      <TableHead>Destinatário</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices
                      .filter((inv) => inv.status === "AUTHORIZED")
                      .map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono">
                            {invoice.number}
                          </TableCell>
                          <TableCell>{invoice.destName || "-"}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(invoice.amount)}
                          </TableCell>
                          <TableCell>
                            <InvoiceStatusBadge
                              status={invoice.status as any}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setCancelModal({ open: true, invoice });
                                  setError("");
                                  setSuccess("");
                                }}
                                disabled={!apiKey}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setCceModal({ open: true, invoice });
                                  setError("");
                                  setSuccess("");
                                }}
                                disabled={!apiKey}
                              >
                                <FileEdit className="h-4 w-4 mr-1" />
                                CC-e
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    {invoices.filter((i) => i.status === "AUTHORIZED")
                      .length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground"
                        >
                          Nenhuma NFe AUTORIZADA disponível para teste
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Cancelamento */}
      <Dialog
        open={cancelModal.open}
        onOpenChange={(open) => setCancelModal({ open, invoice: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar NFe</DialogTitle>
            <DialogDescription>
              NFe {cancelModal.invoice?.number} -{" "}
              {cancelModal.invoice?.destName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Justificativa (mínimo 15 caracteres)</Label>
              <Textarea
                placeholder="Ex: Nota emitida com erro no valor..."
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {justificativa.length}/15 caracteres
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelModal({ open: false, invoice: null })}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelar}
              disabled={processing || justificativa.length < 15}
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Carta de Correção */}
      <Dialog
        open={cceModal.open}
        onOpenChange={(open) => setCceModal({ open, invoice: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Carta de Correção Eletrônica (CC-e)</DialogTitle>
            <DialogDescription>
              NFe {cceModal.invoice?.number} - {cceModal.invoice?.destName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Texto da Correção (mínimo 15 caracteres)</Label>
              <Textarea
                placeholder="Ex: Correção do endereço de entrega, de Rua A para Rua B..."
                value={correcao}
                onChange={(e) => setCorrecao(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {correcao.length}/15 caracteres
              </p>
            </div>
            <Alert>
              <AlertDescription className="text-xs">
                ⚠️ Limite: 20 CC-e por NFe. Não pode alterar valores ou
                mercadorias.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCceModal({ open: false, invoice: null })}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEnviarCCe}
              disabled={processing || correcao.length < 15}
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar CC-e
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
