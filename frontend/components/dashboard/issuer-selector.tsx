"use client";

import * as React from "react";
import {
  Check,
  ChevronsUpDown,
  PlusCircle,
  Building2,
  Globe,
} from "lucide-react";
import { useSession } from "next-auth/react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIssuer, Issuer, ALL_ISSUERS } from "@/contexts/issuer-context";
import { api } from "@/services/api";

type PopoverTriggerProps = React.ComponentPropsWithoutRef<
  typeof PopoverTrigger
>;

interface IssuerSelectorProps extends PopoverTriggerProps {}

interface FormData {
  // Dados Básicos
  name: string;
  tradeName: string;
  cnpj: string;
  ie: string;
  im: string;
  crt: string;
  email: string;
  phone: string;
  // Endereço
  cep: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  ibgeCode: string;
}

const emptyFormData: FormData = {
  name: "",
  tradeName: "",
  cnpj: "",
  ie: "",
  im: "",
  crt: "1",
  email: "",
  phone: "",
  cep: "",
  address: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  ibgeCode: "",
};

const ESTADOS_BR = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

export default function IssuerSelector({ className }: IssuerSelectorProps) {
  const { data: session } = useSession();
  const {
    issuers,
    selectedIssuer,
    loading,
    selectIssuer,
    selectAll,
    addIssuer,
    isAllSelected,
  } = useIssuer();
  const [open, setOpen] = React.useState(false);
  const [showNewDialog, setShowNewDialog] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [formData, setFormData] = React.useState<FormData>(emptyFormData);
  const [fetchingCep, setFetchingCep] = React.useState(false);

  const handleCadastrar = async () => {
    if (!session?.accessToken || !formData.name || !formData.cnpj) return;

    setSaving(true);
    try {
      const response = await api.post(
        "/companies",
        {
          name: formData.name,
          cnpj: formData.cnpj.replace(/\D/g, ""),
          tradeName: formData.tradeName || undefined,
          ie: formData.ie.replace(/\D/g, "") || undefined,
          im: formData.im || undefined,
          crt: formData.crt ? parseInt(formData.crt) : 1,
          email: formData.email || undefined,
          phone: formData.phone.replace(/\D/g, "") || undefined,
          cep: formData.cep.replace(/\D/g, "") || undefined,
          address: formData.address || undefined,
          number: formData.number || undefined,
          complement: formData.complement || undefined,
          neighborhood: formData.neighborhood || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          ibgeCode: formData.ibgeCode || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        },
      );
      addIssuer(response.data as Issuer);
      setShowNewDialog(false);
      setFormData(emptyFormData);
    } catch (error) {
      console.error("Erro ao cadastrar emissor:", error);
      alert("Erro ao cadastrar emissor. Verifique os dados.");
    } finally {
      setSaving(false);
    }
  };

  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    setFetchingCep(true);
    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`,
      );
      const data = await response.json();
      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          address: data.logradouro || "",
          neighborhood: data.bairro || "",
          city: data.localidade || "",
          state: data.uf || "",
          ibgeCode: data.ibge || "",
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setFetchingCep(false);
    }
  };

  const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  const formatCEP = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    return digits.replace(/^(\d{5})(\d)/, "$1-$2");
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 10) {
      return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
    }
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  };

  if (loading) {
    return (
      <Button
        variant="outline"
        className={cn("w-[280px] justify-start", className)}
        disabled
      >
        <Building2 className="mr-2 h-5 w-5 animate-pulse" />
        Carregando...
      </Button>
    );
  }

  return (
    <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Selecionar emissor"
            className={cn("w-[280px] justify-between", className)}
          >
            {isAllSelected ? (
              <>
                <Globe className="mr-2 h-5 w-5 text-blue-500" />
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="text-sm font-medium">
                    Todos os Emissores
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {issuers.length} emissores
                  </span>
                </div>
              </>
            ) : selectedIssuer ? (
              <>
                <Avatar className="mr-2 h-5 w-5">
                  <AvatarImage
                    src={`https://avatar.vercel.sh/${selectedIssuer.id}.png`}
                    alt={selectedIssuer.name}
                  />
                  <AvatarFallback>
                    {selectedIssuer.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="text-sm font-medium truncate max-w-[180px]">
                    {selectedIssuer.tradeName || selectedIssuer.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {selectedIssuer.cnpj}
                  </span>
                </div>
              </>
            ) : (
              <>
                <Building2 className="mr-2 h-5 w-5" />
                <span>Selecionar Emissor</span>
              </>
            )}
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0">
          <Command>
            <CommandInput placeholder="Buscar emissor..." />
            <CommandList>
              <CommandEmpty>Nenhum emissor encontrado.</CommandEmpty>

              {/* Opção "Todos" fixa */}
              <CommandGroup heading="Visualização">
                <CommandItem
                  onSelect={() => {
                    selectAll();
                    setOpen(false);
                  }}
                  className="text-sm"
                >
                  <Globe className="mr-2 h-5 w-5 text-blue-500" />
                  <div className="flex flex-col">
                    <span>Todos os Emissores</span>
                    <span className="text-xs text-muted-foreground">
                      Visualizar consolidado
                    </span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      isAllSelected ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              {/* Lista de emissores */}
              <CommandGroup heading="Meus Emissores">
                {issuers.map((issuer) => (
                  <CommandItem
                    key={issuer.id}
                    onSelect={() => {
                      selectIssuer(issuer);
                      setOpen(false);
                    }}
                    className="text-sm"
                  >
                    <Avatar className="mr-2 h-5 w-5">
                      <AvatarImage
                        src={`https://avatar.vercel.sh/${issuer.id}.png`}
                        alt={issuer.name}
                        className="grayscale"
                      />
                      <AvatarFallback>
                        {issuer.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span>{issuer.tradeName || issuer.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {issuer.cnpj}
                      </span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedIssuer?.id === issuer.id && !isAllSelected
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <DialogTrigger asChild>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      setShowNewDialog(true);
                    }}
                  >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Cadastrar Novo Emissor
                  </CommandItem>
                </DialogTrigger>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Dialog de Cadastro Completo */}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Emissor</DialogTitle>
          <DialogDescription>
            Preencha os dados completos para emissão de documentos fiscais.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="empresa" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="empresa">Dados da Empresa</TabsTrigger>
            <TabsTrigger value="endereco">Endereço</TabsTrigger>
          </TabsList>

          <TabsContent value="empresa" className="space-y-4 mt-4">
            {/* Dados Básicos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cnpj: formatCNPJ(e.target.value),
                    })
                  }
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ie">Inscrição Estadual *</Label>
                <Input
                  id="ie"
                  value={formData.ie}
                  onChange={(e) =>
                    setFormData({ ...formData, ie: e.target.value })
                  }
                  placeholder="123456789"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Razão Social *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Empresa LTDA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tradeName">Nome Fantasia</Label>
              <Input
                id="tradeName"
                value={formData.tradeName}
                onChange={(e) =>
                  setFormData({ ...formData, tradeName: e.target.value })
                }
                placeholder="Minha Loja"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="im">Inscrição Municipal</Label>
                <Input
                  id="im"
                  value={formData.im}
                  onChange={(e) =>
                    setFormData({ ...formData, im: e.target.value })
                  }
                  placeholder="Opcional (para NFS-e)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crt">Regime Tributário *</Label>
                <Select
                  value={formData.crt}
                  onValueChange={(value) =>
                    setFormData({ ...formData, crt: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Simples Nacional</SelectItem>
                    <SelectItem value="2">
                      Simples Nacional (Excesso)
                    </SelectItem>
                    <SelectItem value="3">Regime Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="contato@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: formatPhone(e.target.value),
                    })
                  }
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="endereco" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP *</Label>
                <div className="relative">
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => {
                      const cep = formatCEP(e.target.value);
                      setFormData({ ...formData, cep });
                      if (cep.replace(/\D/g, "").length === 8) {
                        buscarCep(cep);
                      }
                    }}
                    placeholder="00000-000"
                    className={fetchingCep ? "pr-8" : ""}
                  />
                  {fetchingCep && (
                    <div className="absolute right-2 top-2.5">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                    </div>
                  )}
                </div>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="address">Logradouro *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Rua, Avenida..."
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number">Número *</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) =>
                    setFormData({ ...formData, number: e.target.value })
                  }
                  placeholder="123"
                />
              </div>
              <div className="col-span-3 space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={formData.complement}
                  onChange={(e) =>
                    setFormData({ ...formData, complement: e.target.value })
                  }
                  placeholder="Sala, Andar..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro *</Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) =>
                  setFormData({ ...formData, neighborhood: e.target.value })
                }
                placeholder="Centro"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="São Paulo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">UF *</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) =>
                    setFormData({ ...formData, state: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BR.map((uf) => (
                      <SelectItem key={uf} value={uf}>
                        {uf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ibgeCode">Código IBGE da Cidade</Label>
              <Input
                id="ibgeCode"
                value={formData.ibgeCode}
                onChange={(e) =>
                  setFormData({ ...formData, ibgeCode: e.target.value })
                }
                placeholder="Preenchido automaticamente pelo CEP"
                className="bg-muted"
                readOnly
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => setShowNewDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleCadastrar}
            disabled={
              saving || !formData.name || !formData.cnpj || !formData.ie
            }
          >
            {saving ? "Salvando..." : "Cadastrar Emissor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
