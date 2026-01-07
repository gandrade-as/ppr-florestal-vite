import { useMemo, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  AlertCircle,
  Target,
  TrendingUp,
  Award,
  Calendar,
  Briefcase, // Ícone para o seletor de setor
} from "lucide-react";
import { useSectorGoals } from "@/hooks/useGoals";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DashboardPage() {
  // 1. Estado Inicial de Datas
  const currentSemester = new Date().getMonth() < 6 ? "01" : "02";
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedSemester, setSelectedSemester] =
    useState<string>(currentSemester);

  // 2. Estado de Setor
  const [selectedSectorId, setSelectedSectorId] = useState<string>("");

  // 3. Dados do Usuário
  const { data: userProfile, isLoading: isUserLoading } = useUserProfile();

  // 4. Determina quais setores o usuário pode ver
  const availableSectors = useMemo(() => {
    return userProfile?.responsible_sectors || [];
  }, [userProfile]);

  const hasResponsibleSectors = availableSectors.length > 0;

  // 5. Efeito para selecionar o setor inicial
  useEffect(() => {
    if (isUserLoading) return;

    if (!selectedSectorId) {
      if (hasResponsibleSectors) {
        // Se tem setores responsáveis, seleciona o primeiro da lista
        setSelectedSectorId(availableSectors[0].id);
      } else if (userProfile?.sector?.id) {
        // Se não tem, usa o setor de lotação do usuário (fallback)
        setSelectedSectorId(userProfile.sector.id);
      }
    }
  }, [userProfile, hasResponsibleSectors, selectedSectorId, isUserLoading]);

  // 6. Busca Metas baseada no setor selecionado (Reativo)
  const {
    data: goals,
    isLoading: isGoalsLoading,
    isError,
    error,
  } = useSectorGoals(selectedSectorId);

  const isLoading = isUserLoading || (!!selectedSectorId && isGoalsLoading);

  // --- LÓGICA DE FILTROS E MÉTRICAS (MANTIDA) ---

  // Extrair anos disponíveis
  const availableYears = useMemo(() => {
    if (!goals) return [];
    const years = new Set<string>();
    goals.forEach((goal) => {
      if (goal.reference) {
        const [year] = goal.reference.split("/");
        if (year && year.length === 4) years.add(year);
      }
    });
    return Array.from(years).sort().reverse();
  }, [goals]);

  // Auto-seleção do ano
  useEffect(() => {
    if (availableYears.length > 0) {
      if (!selectedYear || !availableYears.includes(selectedYear)) {
        setSelectedYear(availableYears[0]);
      }
    }
  }, [availableYears, selectedYear]);

  // Filtragem
  const filteredGoals = useMemo(() => {
    if (!goals || !selectedYear) return [];

    return goals.filter((goal) => {
      const [refYear, refSemester] = (goal.reference || "").split("/");
      return refYear === selectedYear && refSemester === selectedSemester;
    });
  }, [goals, selectedYear, selectedSemester]);

  // Cálculo de Métricas
  const metrics = useMemo(() => {
    if (!filteredGoals || filteredGoals.length === 0) {
      return {
        totalPotential: 0,
        totalAttained: 0,
        avgProgress: 0,
        goalsCount: 0,
      };
    }

    const totalPotential = filteredGoals.reduce(
      (acc, curr) => acc + (curr.ppr_percentage || 0),
      0
    );
    const totalAttained = filteredGoals.reduce(
      (acc, curr) => acc + (curr.ppr_attained || 0),
      0
    );

    const totalProgress = filteredGoals.reduce(
      (acc, curr) => acc + (curr.progress || 0),
      0
    );
    const avgProgress = totalProgress / filteredGoals.length;

    return {
      totalPotential,
      totalAttained,
      avgProgress,
      goalsCount: filteredGoals.length,
    };
  }, [filteredGoals]);

  if (isError) {
    return (
      <div className="flex h-50 w-full items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600">
        <AlertCircle className="mr-2 h-5 w-5" />
        <span>Erro ao carregar dados: {(error as Error).message}</span>
      </div>
    );
  }

  // Se não estiver carregando e não tiver setor selecionado (caso raro de usuário sem setor)
  if (!isLoading && !selectedSectorId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <AlertCircle className="h-12 w-12 mb-4 opacity-20" />
        <h3 className="text-lg font-semibold">Sem setor vinculado</h3>
        <p>Contate o administrador para vincular seu usuário a um setor.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full w-full animate-in fade-in duration-500">
      {/* CABEÇALHO COM SELETORES */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            {/* Mostra o nome do setor que está sendo visualizado */}
            Visão geral de:{" "}
            <strong className="text-foreground">
              {hasResponsibleSectors
                ? availableSectors.find((s) => s.id === selectedSectorId)?.name
                : userProfile?.sector?.name}
            </strong>
          </p>
        </div>

        {/* ÁREA DE FILTROS */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
          {/* 1. SELETOR DE SETOR (Só aparece se tiver responsible_sectors) */}
          {hasResponsibleSectors && (
            <div className="w-full sm:w-60">
              <Select
                value={selectedSectorId}
                onValueChange={setSelectedSectorId}
                disabled={isLoading}
              >
                <SelectTrigger className="bg-background h-10 border-dashed border-slate-300">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    <SelectValue placeholder="Setor" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {availableSectors.map((sector) => (
                    <SelectItem key={sector.id} value={sector.id}>
                      {sector.name} ({sector.acronym})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 2. SELETORES DE DATA */}
          <div className="flex w-full sm:w-auto gap-2">
            <Select
              value={selectedYear}
              onValueChange={setSelectedYear}
              disabled={isLoading || availableYears.length === 0}
            >
              <SelectTrigger className="w-full sm:w-25 bg-background h-10">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedSemester}
              onValueChange={setSelectedSemester}
              disabled={isLoading || availableYears.length === 0}
            >
              <SelectTrigger className="w-full sm:w-35 bg-background h-10">
                <SelectValue placeholder="Semestre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="01">1º Semestre</SelectItem>
                <SelectItem value="02">2º Semestre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: CARDS DE KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 shrink-0">
        {/* ... (Conteúdo dos Cards mantém-se idêntico ao original) ... */}

        {/* CARD 1: CONQUISTA FINANCEIRA */}
        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conquista PPR
            </CardTitle>
            <Award className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-2 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-emerald-700">
                    {metrics.totalAttained.toFixed(2)}%
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {metrics.totalPotential.toFixed(2)}%
                  </span>
                </div>
                <Progress
                  value={
                    metrics.totalPotential > 0
                      ? (metrics.totalAttained / metrics.totalPotential) * 100
                      : 0
                  }
                  className="h-2 mt-3 bg-emerald-100 [&>div]:bg-emerald-500"
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* CARD 2: PROGRESSO OPERACIONAL */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Progresso Médio
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-2 w-full" />
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-blue-700">
                  {Math.round(metrics.avgProgress)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Média de avanço das metas
                </p>
                <Progress
                  value={metrics.avgProgress}
                  className="h-2 mt-3 bg-blue-100 [&>div]:bg-blue-500"
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* CARD 3: CONTAGEM DE METAS */}
        <Card className="hidden lg:flex flex-col border-l-4 border-l-orange-400 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Metas
            </CardTitle>
            <Target className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold text-slate-800">
                {metrics.goalsCount}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Metas ativas no período selecionado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO 2: LISTA DE METAS */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3 flex-1 min-h-0">
        {/* COLUNA ESQUERDA: VISÃO DETALHADA */}
        <Card className="col-span-1 lg:col-span-2 flex flex-col h-full overflow-hidden border shadow-sm">
          <CardHeader className="shrink-0 bg-slate-50/50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Acompanhamento Detalhado</CardTitle>
                <CardDescription>
                  Status individual das metas filtradas.
                </CardDescription>
              </div>
              <TrendingUp className="h-5 w-5 text-muted-foreground opacity-50" />
            </div>
          </CardHeader>

          <ScrollArea className="flex-1">
            <div className="p-6 grid gap-6 sm:grid-cols-2">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-3 border p-4 rounded-xl">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-2 w-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-10" />
                      <Skeleton className="h-3 w-10" />
                    </div>
                  </div>
                ))
              ) : filteredGoals.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center h-40 text-muted-foreground border-2 border-dashed rounded-xl bg-slate-50/50">
                  <Target className="h-8 w-8 mb-2 opacity-20" />
                  <p>Nenhuma meta encontrada para este período/setor.</p>
                </div>
              ) : (
                filteredGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="flex flex-col gap-3 p-4 rounded-xl border bg-card hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4
                        className="font-semibold text-sm line-clamp-2 leading-tight"
                        title={goal.title}
                      >
                        {goal.title}
                      </h4>
                      <Badge
                        variant="outline"
                        className="text-[10px] shrink-0 h-5"
                      >
                        {goal.reference}
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progresso</span>
                        <span className="font-bold text-blue-600">
                          {goal.progress}%
                        </span>
                      </div>
                      <Progress value={goal.progress} className="h-1.5" />
                    </div>

                    <div className="pt-2 mt-auto border-t flex justify-between items-center text-xs">
                      <div
                        className="flex items-center text-muted-foreground"
                        title="Prazo"
                      >
                        <Calendar className="mr-1 h-3 w-3" />
                        {goal.deadline
                          ? goal.deadline.toDate().toLocaleDateString("pt-BR")
                          : "--/--"}
                      </div>
                      <div className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-100">
                        {goal.ppr_attained}% / {goal.ppr_percentage}%
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* COLUNA DIREITA: ÚLTIMAS ATUALIZAÇÕES (Compacta) */}
        <Card className="col-span-1 flex flex-col h-full overflow-hidden shadow-sm">
          <CardHeader className="shrink-0 bg-slate-50/50 border-b pb-3">
            <CardTitle className="text-base">Lista Rápida</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1 p-0">
            <div className="flex flex-col divide-y">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                filteredGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50/80 transition-colors"
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        goal.status === "completed"
                          ? "bg-green-100 text-green-600"
                          : goal.status === "in_progress"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Target className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        title={goal.title}
                      >
                        {goal.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        Resp: {goal.responsible?.name || "N/A"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold block">
                        {goal.progress}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
