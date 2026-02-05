"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Copy, RefreshCw, Save } from "lucide-react";

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [savingWebhook, setSavingWebhook] = useState(false);

  useEffect(() => {
    api
      .get("/partners/profile")
      .then((res) => {
        setProfile(res.data);
        setWebhookUrl(res.data.webhookUrl || "");
        setLoading(false);
      })
      .catch((err) => {
        console.error("Profile load error:", err);
        // Mock data para desenvolvimento (remover em produção)
        setProfile({
          id: "dev-partner-id",
          name: "Developer Partner",
          email: "dev@example.com",
          apiKey: "nfeeng_dev_123456789abcdefgh",
          webhookUrl: "",
        });
        setWebhookUrl("");
        setLoading(false);
      });
  }, []);

  const handleRegenerateKey = async () => {
    if (profile?.id === "dev-partner-id") {
      alert(
        "Função desabilitada no modo de desenvolvimento. Configure autenticação JWT para usar.",
      );
      return;
    }

    if (
      !confirm(
        "Tem certeza? A chave antiga deixará de funcionar imediatamente.",
      )
    )
      return;

    try {
      const res = await api.post("/partners/api-key/regenerate");
      setProfile({ ...profile, apiKey: res.data.apiKey });
      alert("Nova chave gerada com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar chave.");
    }
  };

  const handleSaveWebhook = async () => {
    if (profile?.id === "dev-partner-id") {
      alert(
        "Função desabilitada no modo de desenvolvimento. Configure autenticação JWT para usar.",
      );
      return;
    }

    setSavingWebhook(true);
    try {
      await api.patch("/partners/webhook", { webhookUrl });
      alert("Webhook atualizado!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar webhook.");
    } finally {
      setSavingWebhook(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(profile?.apiKey || "");
    alert("Copiado!");
  };

  if (loading)
    return (
      <div className="p-8">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Gerencie sua conta e integrações.
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-4">
        <TabsList>
          <TabsTrigger value="account">Minha Conta</TabsTrigger>
          <TabsTrigger value="developer">Desenvolvedor (API)</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Parceiro</CardTitle>
              <CardDescription>
                Informações cadastrais da sua Software House.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={profile?.name} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile?.email} readOnly />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="developer">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Credenciais de API</CardTitle>
                <CardDescription>
                  Use esta chave para autenticar as requisições do seu ERP no
                  NFe Engine. Envie no header <code>x-api-key</code>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>API Key (Chave Mestra)</Label>
                  <div className="flex space-x-2">
                    <Input
                      type={showKey ? "text" : "password"}
                      value={profile?.apiKey || ""}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? "🙈" : "👁️"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyToClipboard}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="destructive" onClick={handleRegenerateKey}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Regenerar Chave
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Webhooks</CardTitle>
                <CardDescription>
                  Receba notificações em tempo real sobre mudanças de status das
                  notas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>URL de Callback</Label>
                  <Input
                    placeholder="https://seu-sistema.com/api/callback"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enviaremos um POST para esta URL sempre que uma nota mudar
                    de status.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveWebhook} disabled={savingWebhook}>
                  {savingWebhook ? (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Salvar Configuração
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
