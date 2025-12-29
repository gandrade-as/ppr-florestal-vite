import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Activity, AlertCircle, CreditCard, DollarSign, Users } from "lucide-react";
import { useDashboardMetrics } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  // Destructuring do React Query: simples e poderoso
  const { data, isLoading, isError, error } = useDashboardMetrics();

  // Tratamento de Erro Visual
  if (isError) {
    return (
      <div className="flex h-50 w-full items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600">
        <AlertCircle className="mr-2 h-5 w-5" />
        <span>Erro ao carregar dados: {(error as Error).message}</span>
      </div>
    );
  }

  return (
    // 1. O container principal ocupa 100% da altura do <main> (h-full)
    // Usamos flex-col para empilhar: Título > KPIs > Gráficos
    <div className="flex flex-col gap-4 h-full w-full">
      {/* SEÇÃO 1: Cabeçalho (Tamanho automático/fixo) */}
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      {/* SEÇÃO 2: KPIs (Tamanho automático/fixo) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 shrink-0">
        {/* CARD 1: Receita */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-30" /> // Skeleton enquanto carrega
            ) : (
              <div className="text-2xl font-bold">
                {/* Formatação de moeda */}
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(data?.revenue || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* CARD 2: Assinaturas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">+{data?.subscriptions}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO 3: Conteúdo Principal (Ocupa TODO o resto do espaço) */}
      {/* flex-1: Cresce para ocupar o resto. 
          min-h-0: Permite encolher se a tela for pequena (evita overflow da página) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 flex-1 min-h-0">
        {/* Card Grande (Gráfico) */}
        <Card className="col-span-4 flex flex-col h-full">
          <CardHeader className="shrink-0">
            <CardTitle>Visão Geral</CardTitle>
          </CardHeader>
          {/* O conteúdo do card cresce para preencher o card */}
          <CardContent className="pl-2 flex-1 min-h-0 relative">
            <div className="absolute inset-0 flex items-center justify-center m-4 border border-dashed rounded bg-muted/20">
              <p className="text-muted-foreground">Gráfico Responsivo</p>
            </div>
          </CardContent>
        </Card>

        {/* Card Lista (Vendas Recentes) */}
        <Card className="col-span-3 flex flex-col h-full overflow-hidden">
          <CardHeader className="shrink-0">
            <CardTitle>Vendas Recentes</CardTitle>
            <CardDescription>265 vendas este mês.</CardDescription>
          </CardHeader>

          {/* overflow-y-auto AQUI DENTRO: Só a lista rola se precisar */}
          <CardContent className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-8">
              {/* Vários itens para testar o scroll interno */}
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/avatars/01.png" alt="Avatar" />
                    <AvatarFallback>OM</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Cliente {i + 1}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      email@exemplo.com
                    </p>
                  </div>
                  <div className="ml-auto font-medium">+R$ 1.999,00</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
