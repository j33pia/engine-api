"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  RefreshCw,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";

const WEBHOOK_EVENTS = [
  {
    id: "invoice.authorized",
    label: "NFe/NFCe Autorizada",
    description: "Quando uma nota é autorizada pela SEFAZ",
  },
  {
    id: "invoice.rejected",
    label: "NFe/NFCe Rejeitada",
    description: "Quando uma nota é rejeitada",
  },
  {
    id: "invoice.canceled",
    label: "NFe/NFCe Cancelada",
    description: "Quando um cancelamento é autorizado",
  },
  {
    id: "mdfe.authorized",
    label: "MDFe Autorizado",
    description: "Quando um MDFe é autorizado",
  },
  {
    id: "mdfe.closed",
    label: "MDFe Encerrado",
    description: "Quando um MDFe é encerrado",
  },
  {
    id: "certificate.expiring",
    label: "Certificado Expirando",
    description: "Alerta de certificado próximo do vencimento",
  },
];

interface WebhookLog {
  id: string;
  eventType: string;
  status: "pending" | "success" | "failed";
  attempts: number;
  createdAt: string;
  deliveredAt?: string;
  lastError?: string;
}

export default function WebhooksSettingsPage() {
  const [config, setConfig] = useState({
    webhookUrl: "",
    webhookSecret: "",
    events: [] as string[],
  });
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchConfig();
    fetchLogs();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch("http://localhost:3001/webhooks/config", {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig({
          webhookUrl: data.webhookUrl || "",
          webhookSecret: data.webhookSecret || "",
          events: data.events || [],
        });
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("http://localhost:3001/webhooks/logs?limit=20", {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("http://localhost:3001/webhooks/config", {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          webhookUrl: config.webhookUrl,
          events: config.events,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig({
          webhookUrl: data.webhookUrl || "",
          webhookSecret: data.webhookSecret || "",
          events: data.events || [],
        });
        setMessage({
          type: "success",
          text: "Configuração salva com sucesso!",
        });
      } else {
        setMessage({ type: "error", text: "Erro ao salvar configuração" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erro de conexão" });
    } finally {
      setLoading(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("http://localhost:3001/webhooks/test", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.success
          ? `Webhook entregue (HTTP ${data.statusCode})`
          : data.error || "Falha na entrega",
      });
      fetchLogs();
    } catch (error) {
      setTestResult({ success: false, message: "Erro de conexão" });
    } finally {
      setTesting(false);
    }
  };

  const regenerateSecret = async () => {
    if (!confirm("Tem certeza? O secret atual será invalidado.")) return;

    try {
      const res = await fetch(
        "http://localhost:3001/webhooks/secret/regenerate",
        {
          method: "POST",
          headers: getAuthHeaders(),
        },
      );
      if (res.ok) {
        const data = await res.json();
        setConfig((prev) => ({ ...prev, webhookSecret: data.webhookSecret }));
        setMessage({ type: "success", text: "Secret regenerado!" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao regenerar secret" });
    }
  };

  const toggleEvent = (eventId: string) => {
    setConfig((prev) => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter((e) => e !== eventId)
        : [...prev.events, eventId],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: "success", text: "Copiado!" });
    setTimeout(() => setMessage(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Entregue
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Falhou
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
        <p className="text-muted-foreground">
          Configure webhooks para receber notificações em tempo real sobre
          eventos fiscais.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
        >
          {message.text}
        </div>
      )}

      {/* Configuração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Configuração do Webhook
          </CardTitle>
          <CardDescription>
            Configure a URL que receberá os eventos e escolha quais eventos
            deseja receber.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">URL do Webhook</Label>
            <Input
              id="webhookUrl"
              placeholder="https://api.suaempresa.com/webhooks"
              value={config.webhookUrl}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, webhookUrl: e.target.value }))
              }
            />
            <p className="text-sm text-muted-foreground">
              Endpoint que receberá requisições POST com os eventos.
            </p>
          </div>

          {/* Secret */}
          <div className="space-y-2">
            <Label>Webhook Secret</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showSecret ? "text" : "password"}
                  value={config.webhookSecret || "Não configurado"}
                  readOnly
                  className="pr-20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(config.webhookSecret)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Button variant="outline" onClick={regenerateSecret}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerar
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Use este secret para validar a assinatura HMAC (header
              X-Webhook-Signature).
            </p>
          </div>

          {/* Eventos */}
          <div className="space-y-4">
            <Label>Eventos</Label>
            <div className="grid gap-3">
              {WEBHOOK_EVENTS.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleEvent(event.id)}
                >
                  <Checkbox
                    checked={config.events.includes(event.id)}
                    onCheckedChange={() => toggleEvent(event.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{event.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.description}
                    </p>
                  </div>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {event.id}
                  </code>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={saveConfig} disabled={loading}>
              {loading ? "Salvando..." : "Salvar Configuração"}
            </Button>
            <Button
              variant="outline"
              onClick={sendTest}
              disabled={testing || !config.webhookUrl}
            >
              <Send className="w-4 h-4 mr-2" />
              {testing ? "Enviando..." : "Testar Webhook"}
            </Button>
          </div>

          {testResult && (
            <div
              className={`p-4 rounded-lg flex items-center gap-2 ${testResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              {testResult.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              {testResult.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Histórico de Entregas</CardTitle>
              <CardDescription>
                Últimas 20 tentativas de entrega de webhooks.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma entrega de webhook ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {getStatusBadge(log.status)}
                    <div>
                      <code className="text-sm font-medium">
                        {log.eventType}
                      </code>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      {log.attempts} tentativa{log.attempts !== 1 ? "s" : ""}
                    </p>
                    {log.lastError && (
                      <p
                        className="text-xs text-red-500 max-w-[200px] truncate"
                        title={log.lastError}
                      >
                        {log.lastError}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentação */}
      <Card>
        <CardHeader>
          <CardTitle>Como Integrar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="font-medium mb-2">Validar Assinatura HMAC</p>
            <pre className="text-sm overflow-x-auto">
              {`const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === \`sha256=\${expected}\`;
}

// No seu endpoint
app.post('/webhooks', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  
  if (!verifySignature(req.body, signature, WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Processar evento
  console.log('Evento recebido:', req.body.type);
  res.status(200).send('OK');
});`}
            </pre>
          </div>

          <div className="flex items-start gap-2 p-4 bg-yellow-50 text-yellow-800 rounded-lg">
            <AlertTriangle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-medium">Importante</p>
              <p className="text-sm">
                Responda com HTTP 2xx em até 30 segundos. Caso contrário, o
                webhook será reenviado automaticamente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
