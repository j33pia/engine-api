"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { api } from "@/services/api"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// Separator removed

// Função auxiliar para tirar caracteres especiais
const cleanString = (val: string) => val.replace(/\D/g, '');

const companySchema = z.object({
    // Identificação
    cnpj: z.string().refine((val) => cleanString(val).length === 14, "CNPJ deve ter 14 dígitos"),
    name: z.string().min(3, "Razão Social obrigatória"),
    tradeName: z.string().optional(),
    ie: z.string().min(2, "Inscrição Estadual obrigatória"),
    im: z.string().optional(),

    // Tributação
    crt: z.coerce.number().int().default(1),

    // Contato
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),

    // Endereço
    cep: z.string().optional().refine((val) => !val || cleanString(val).length === 8, "CEP deve ter 8 dígitos"),
    address: z.string().min(3, "Endereço obrigatório"),
    number: z.string().min(1, "Número obrigatório"),
    complement: z.string().optional(),
    neighborhood: z.string().min(2, "Bairro obrigatório"),
    city: z.string().min(2, "Cidade obrigatória"),
    state: z.string().length(2, "UF deve ter 2 letras"),
    ibgeCode: z.string().optional(), // Idealmente buscaria automático pelo CEP/Cidade
})

type CompanyFormData = z.infer<typeof companySchema>

export default function NewCompanyPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<CompanyFormData>({
        resolver: zodResolver(companySchema),
        defaultValues: {
            crt: 1,
        }
    })

    // Busca dados do CNPJ no Backend
    const handleBlurCnpj = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cnpj = e.target.value.replace(/\D/g, '');
        if (cnpj.length === 14) {
            try {
                // Chama proxy do backend
                const response = await api.get(`/companies/consult/${cnpj}`);
                const data = response.data;

                // Preenche formulário
                setValue('name', data.razao_social);
                setValue('tradeName', data.nome_fantasia || data.razao_social);

                // Endereço (BrasilAPI retorna padrão um pouco diferente da ViaCEP, ajustando)
                setValue('cep', data.cep);
                setValue('address', `${data.logradouro}`);
                setValue('number', data.numero || '');
                setValue('complement', data.complemento || '');
                setValue('neighborhood', data.bairro);
                setValue('city', data.municipio);
                setValue('state', data.uf);

                // Telefone e Email se disponíveis
                if (data.ddd_telefone_1) {
                    setValue('phone', data.ddd_telefone_1);
                }
                if (data.email) {
                    setValue('email', data.email);
                }

            } catch (error) {
                console.error("Erro ao consultar CNPJ:", error);
                // Não exibe erro pro usuário para não travar o fluxo, apenas não preenche
            }
        }
    }

    // Exemplo simples de busca de CEP (poderia ser um hook separado)
    const handleBlurCep = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length === 8) {
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setValue('address', data.logradouro);
                    setValue('neighborhood', data.bairro);
                    setValue('city', data.localidade);
                    setValue('state', data.uf);
                    setValue('ibgeCode', data.ibge);
                }
            } catch (error) {
                console.error("Erro ao buscar CEP");
            }
        }
    }

    const onSubmit = async (data: CompanyFormData) => {
        setLoading(true)
        setError("")

        // Limpar máscaras antes de enviar
        const payload = {
            ...data,
            cnpj: cleanString(data.cnpj),
            cep: data.cep ? cleanString(data.cep) : undefined,
            phone: data.phone ? cleanString(data.phone) : undefined,
        };

        console.log("Submitting:", payload);
        try {
            await api.post("/companies", payload)
            router.push("/dashboard/companies")
        } catch (err: any) {
            console.error(err)
            setError("Erro ao cadastrar empresa. " + (err.response?.data?.message || err.message))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Cadastro de Empresa</CardTitle>
                    <CardDescription>Dados necessários para emissão de NFe/NFCe.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-6">
                        {error && <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">{error}</div>}

                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Dados Gerais</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cnpj">CNPJ *</Label>
                                    <Input
                                        id="cnpj"
                                        maxLength={18}
                                        placeholder="00.000.000/0000-00"
                                        {...register("cnpj", {
                                            onChange: (e) => {
                                                e.target.value = e.target.value
                                                    .replace(/\D/g, '')
                                                    .replace(/^(\d{2})(\d)/, '$1.$2')
                                                    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                                                    .replace(/\.(\d{3})(\d)/, '.$1/$2')
                                                    .replace(/(\d{4})(\d)/, '$1-$2')
                                                    .slice(0, 18);
                                            }
                                        })}
                                        onBlur={handleBlurCnpj}
                                    />
                                    {errors.cnpj && <span className="text-red-500 text-xs">{errors.cnpj.message}</span>}
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="ie">Inscrição Estadual *</Label>
                                        <a href="https://dfe-portal.svrs.rs.gov.br/Nfe/Ccc" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                                            Não sei a IE
                                        </a>
                                    </div>
                                    <Input
                                        id="ie"
                                        maxLength={15}
                                        {...register("ie", {
                                            onChange: (e) => {
                                                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 15);
                                            }
                                        })}
                                    />
                                    {errors.ie && <span className="text-red-500 text-xs">{errors.ie.message}</span>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Razão Social *</Label>
                                <Input id="name" maxLength={150} {...register("name")} />
                                {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tradeName">Nome Fantasia</Label>
                                    <Input id="tradeName" maxLength={150} {...register("tradeName")} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="crt">Regime Tributário</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        {...register("crt")}
                                    >
                                        <option value="1">Simples Nacional</option>
                                        <option value="3">Regime Normal</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="my-4 border-t" />

                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Endereço</h3>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-1 space-y-2">
                                    <Label htmlFor="cep">CEP</Label>
                                    <Input
                                        id="cep"
                                        maxLength={9}
                                        placeholder="00000-000"
                                        {...register("cep", {
                                            onChange: (e) => {
                                                e.target.value = e.target.value
                                                    .replace(/\D/g, '')
                                                    .replace(/^(\d{5})(\d)/, '$1-$2')
                                                    .slice(0, 9);
                                            }
                                        })}
                                        onBlur={handleBlurCep}
                                    />
                                </div>
                                <div className="col-span-3 space-y-2">
                                    <Label htmlFor="address">Logradouro *</Label>
                                    <Input id="address" {...register("address")} />
                                    {errors.address && <span className="text-red-500 text-xs">{errors.address.message}</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-1 space-y-2">
                                    <Label htmlFor="number">Número *</Label>
                                    <Input id="number" {...register("number")} />
                                    {errors.number && <span className="text-red-500 text-xs">{errors.number.message}</span>}
                                </div>
                                <div className="col-span-1 space-y-2">
                                    <Label htmlFor="complement">Compl.</Label>
                                    <Input id="complement" {...register("complement")} />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="neighborhood">Bairro *</Label>
                                    <Input id="neighborhood" {...register("neighborhood")} />
                                    {errors.neighborhood && <span className="text-red-500 text-xs">{errors.neighborhood.message}</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-3 space-y-2">
                                    <Label htmlFor="city">Cidade *</Label>
                                    <Input id="city" {...register("city")} />
                                    {errors.city && <span className="text-red-500 text-xs">{errors.city.message}</span>}
                                </div>
                                <div className="col-span-1 space-y-2">
                                    <Label htmlFor="state">UF *</Label>
                                    <Input id="state" maxLength={2} {...register("state")} />
                                    {errors.state && <span className="text-red-500 text-xs">{errors.state.message}</span>}
                                </div>
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Salvando..." : "Salvar Empresa"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
