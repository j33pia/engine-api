"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Building2, MapPin, Info } from "lucide-react";
import { useIssuer } from "@/contexts/issuer-context";

interface Company {
  id: string;
  name: string;
  cnpj: string;
  tradeName?: string;
  city?: string;
  state?: string;
  status?: string;
}

export default function CompaniesPage() {
  const { data: session } = useSession();
  const { selectedIssuer } = useIssuer();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchCompanies() {
      if (!session?.accessToken) return;

      try {
        const response = await api.get("/companies", {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        setCompanies(response.data);
      } catch (error) {
        console.error("Erro ao buscar emissores:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchCompanies();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">
          Gerenciar Emissores
        </h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Gerenciar Emissores
          </h2>
          <p className="text-muted-foreground">
            Visualize e edite seus emissores cadastrados
          </p>
        </div>
      </div>

      {/* Info box */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardContent className="flex items-center gap-3 pt-4">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Para cadastrar um novo emissor, use o seletor no{" "}
            <strong>topo da página</strong> e clique em "Cadastrar Novo
            Emissor".
          </p>
        </CardContent>
      </Card>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum emissor cadastrado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Use o seletor no topo para cadastrar seu primeiro emissor.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Emissores Cadastrados</CardTitle>
            <CardDescription>
              {companies.length} emissor(es) vinculado(s) à sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Razão Social</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow
                    key={company.id}
                    className={
                      selectedIssuer?.id === company.id ? "bg-muted/50" : ""
                    }
                  >
                    <TableCell>
                      <div className="font-medium">{company.name}</div>
                      {company.tradeName && (
                        <div className="text-xs text-muted-foreground">
                          {company.tradeName}
                        </div>
                      )}
                      {selectedIssuer?.id === company.id && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          Selecionado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {company.cnpj}
                    </TableCell>
                    <TableCell>
                      {company.city && company.state ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {company.city} - {company.state}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-500">Ativo</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/companies/${company.id}`)
                        }
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
