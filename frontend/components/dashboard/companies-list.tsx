"use client"

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface Company {
    id: string;
    name: string;
    cnpj: string;
    tradeName?: string;
    city?: string;
    state?: string;
}

import { useSession } from "next-auth/react";

export function CompaniesList() {
    const { data: session } = useSession();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchCompanies() {
            if (!session?.accessToken) return;

            try {
                const response = await api.get("/companies", {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`
                    }
                });
                setCompanies(response.data);
            } catch (error) {
                console.error("Erro ao buscar empresas:", error);
            } finally {
                setLoading(false);
            }
        }

        if (session) {
            fetchCompanies();
        }
    }, [session]);

    if (loading) {
        return <div className="p-4 text-sm text-muted-foreground">Carregando empresas...</div>;
    }

    if (companies.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md border-dashed">
                <h3 className="text-lg font-medium">Nenhuma empresa cadastrada</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Cadastre sua primeira empresa para começar a emitir notas.
                </p>
                <Button onClick={() => router.push("/dashboard/companies/new")}>
                    <Plus className="mr-2 h-4 w-4" /> Cadastrar Empresa
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Empresas Cadastradas</h3>
                <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/companies/new")}>
                    <Plus className="mr-2 h-4 w-4" /> Nova
                </Button>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Razão Social</TableHead>
                            <TableHead>CNPJ</TableHead>
                            <TableHead>Cidade/UF</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {companies.map((company) => (
                            <TableRow key={company.id}>
                                <TableCell className="font-medium">
                                    {company.name}
                                    {company.tradeName && <span className="block text-xs text-muted-foreground">{company.tradeName}</span>}
                                </TableCell>
                                <TableCell>{company.cnpj}</TableCell>
                                <TableCell>{company.city} - {company.state}</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => router.push(`/dashboard/companies/${company.id}`)}
                                    >
                                        Editar
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
