"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/services/api";
import { useSession } from "next-auth/react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, CheckCircle, Save, ArrowLeft } from "lucide-react";

interface CompanyData {
  id: string;
  name: string;
  tradeName?: string;
  cnpj: string;
  ie?: string;
  im?: string;
  crt: number;
  email?: string;
  phone?: string;
  cep?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  ibgeCode?: string;
  certExpiry?: string;
}

export default function CompanyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<CompanyData>>({});

  // Certificate State
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certPassword, setCertPassword] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function fetchCompany() {
      if (!session?.accessToken) return;
      try {
        const res = await api.get(`/companies/${params.id}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        setCompany(res.data);
        setFormData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (params.id && session) fetchCompany();
  }, [params.id, session]);

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!session?.accessToken) return;
    setSaving(true);
    try {
      await api.patch(`/companies/${params.id}`, formData, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      alert("Dados salvos com sucesso!");
      setCompany({ ...company, ...formData } as CompanyData);
    } catch (err: any) {
      alert("Erro ao salvar: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certFile || !certPassword || !session?.accessToken) return;

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append("file", certFile);
    formDataUpload.append("password", certPassword);

    try {
      await api.post(`/companies/${params.id}/certificate`, formDataUpload, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      alert("Certificado salvo com sucesso!");
      window.location.reload();
    } catch (err: any) {
      alert("Erro no upload: " + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{company?.name}</h2>
          <p className="text-muted-foreground">CNPJ: {company?.cnpj}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/companies")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dados">Dados Cadastrais</TabsTrigger>
          <TabsTrigger value="endereco">Endereço</TabsTrigger>
          <TabsTrigger value="certificado">Certificado Digital</TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Empresa</CardTitle>
              <CardDescription>
                Edite as informações da empresa emissora.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Razão Social *</Label>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome Fantasia</Label>
                  <Input
                    value={formData.tradeName || ""}
                    onChange={(e) => handleChange("tradeName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ *</Label>
                  <Input
                    value={formData.cnpj || ""}
                    onChange={(e) => handleChange("cnpj", e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Inscrição Estadual</Label>
                  <Input
                    value={formData.ie || ""}
                    onChange={(e) => handleChange("ie", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Inscrição Municipal</Label>
                  <Input
                    value={formData.im || ""}
                    onChange={(e) => handleChange("im", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CRT (Regime Tributário) *</Label>
                  <Select
                    value={String(formData.crt || 1)}
                    onValueChange={(v) => handleChange("crt", parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Simples Nacional</SelectItem>
                      <SelectItem value="2">
                        2 - Simples Nacional (Sublimite)
                      </SelectItem>
                      <SelectItem value="3">3 - Regime Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.phone || ""}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="(62) 99999-9999"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Salvar Alterações
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="endereco">
          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>
                Endereço completo da empresa emissora.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    value={formData.cep || ""}
                    onChange={(e) => handleChange("cep", e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Logradouro</Label>
                  <Input
                    value={formData.address || ""}
                    onChange={(e) => handleChange("address", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input
                    value={formData.number || ""}
                    onChange={(e) => handleChange("number", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input
                    value={formData.complement || ""}
                    onChange={(e) => handleChange("complement", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input
                    value={formData.neighborhood || ""}
                    onChange={(e) =>
                      handleChange("neighborhood", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={formData.city || ""}
                    onChange={(e) => handleChange("city", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado (UF)</Label>
                  <Input
                    value={formData.state || ""}
                    onChange={(e) => handleChange("state", e.target.value)}
                    maxLength={2}
                    placeholder="GO"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Código IBGE</Label>
                  <Input
                    value={formData.ibgeCode || ""}
                    onChange={(e) => handleChange("ibgeCode", e.target.value)}
                    placeholder="5208707"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Salvar Alterações
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="certificado">
          <Card>
            <CardHeader>
              <CardTitle>Certificado Digital A1</CardTitle>
              <CardDescription>
                Envie o arquivo .pfx ou .p12 para permitir a emissão de notas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Card if certificate exists */}
              {company?.certExpiry && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <h4 className="font-semibold text-green-900">
                      Certificado Ativo
                    </h4>
                    <p className="text-sm text-green-700">
                      Válido até:{" "}
                      {new Date(company.certExpiry).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              <form
                onSubmit={handleUpload}
                className="space-y-4 p-4 border rounded-md border-dashed"
              >
                <div className="space-y-2">
                  <Label>Arquivo (.pfx)</Label>
                  <Input
                    type="file"
                    accept=".pfx,.p12"
                    onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Senha do Certificado</Label>
                  <Input
                    type="password"
                    value={certPassword}
                    onChange={(e) => setCertPassword(e.target.value)}
                    placeholder="Digite a senha..."
                  />
                </div>
                <Button type="submit" disabled={uploading}>
                  {uploading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Upload className="mr-2 h-4 w-4" />
                  {company?.certExpiry
                    ? "Substituir Certificado"
                    : "Salvar Certificado"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
