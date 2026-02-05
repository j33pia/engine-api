import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"

interface RecentSalesProps {
    data?: {
        id: string;
        issuerName: string;
        amount: number;
        status: string;
        date: string;
    }[]
}

export function RecentSales({ data }: RecentSalesProps) {
    if (!data || data.length === 0) {
        return <div className="text-sm text-muted-foreground p-4">Nenhuma emissão recente.</div>
    }

    return (
        <div className="space-y-8">
            {data.map((invoice, index) => (
                <div className="flex items-center" key={invoice.id || index}>
                    <Avatar className="h-9 w-9">
                        <AvatarFallback>{invoice.issuerName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{invoice.issuerName}</p>
                        <p className="text-sm text-muted-foreground">
                            {new Date(invoice.date).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="ml-auto font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.amount)}
                    </div>
                </div>
            ))}
        </div>
    )
}
