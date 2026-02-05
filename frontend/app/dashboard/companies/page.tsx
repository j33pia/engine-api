"use client"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { CompaniesList } from "@/components/dashboard/companies-list"

export default function CompaniesPage() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Clientes (Tenants)</h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Gerenciamento de Empresas</CardTitle>
                    <CardDescription>Visualize e gerencie os dados cadastrais das suas empresas.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CompaniesList />
                </CardContent>
            </Card>
        </div>
    )
}
