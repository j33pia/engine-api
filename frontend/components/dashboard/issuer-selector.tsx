"use client";

import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle, Building2 } from "lucide-react";
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
import { useIssuer, Issuer } from "@/contexts/issuer-context";
import { api } from "@/services/api";

type PopoverTriggerProps = React.ComponentPropsWithoutRef<
  typeof PopoverTrigger
>;

interface IssuerSelectorProps extends PopoverTriggerProps {}

export default function IssuerSelector({ className }: IssuerSelectorProps) {
  const { data: session } = useSession();
  const { issuers, selectedIssuer, loading, selectIssuer, addIssuer } =
    useIssuer();
  const [open, setOpen] = React.useState(false);
  const [showNewDialog, setShowNewDialog] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    cnpj: "",
    tradeName: "",
  });

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
        },
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        },
      );
      addIssuer(response.data as Issuer);
      setShowNewDialog(false);
      setFormData({ name: "", cnpj: "", tradeName: "" });
    } catch (error) {
      console.error("Erro ao cadastrar emissor:", error);
      alert("Erro ao cadastrar emissor. Verifique os dados.");
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <Button
        variant="outline"
        className={cn("w-[250px] justify-start", className)}
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
            {selectedIssuer ? (
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
                        selectedIssuer?.id === issuer.id
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Emissor</DialogTitle>
          <DialogDescription>
            Adicione um novo CNPJ para emitir documentos fiscais.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Razão Social *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ex: Empresa LTDA"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tradeName">Nome Fantasia</Label>
            <Input
              id="tradeName"
              value={formData.tradeName}
              onChange={(e) =>
                setFormData({ ...formData, tradeName: e.target.value })
              }
              placeholder="Ex: Minha Loja"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cnpj">CNPJ *</Label>
            <Input
              id="cnpj"
              value={formData.cnpj}
              onChange={(e) =>
                setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })
              }
              placeholder="00.000.000/0000-00"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowNewDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleCadastrar}
            disabled={saving || !formData.name || !formData.cnpj}
          >
            {saving ? "Salvando..." : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
