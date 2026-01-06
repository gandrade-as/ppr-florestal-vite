// src/components/GoalCard.tsx
import { Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { HydratedGoal } from "@/types/goal";
import { useUserProfile } from "@/hooks/useUserProfile";
import { cn } from "@/lib/utils";

// Mapeamento de Cores (pode ficar aqui ou em um utils/constants.ts)
const statusMap: Record<
  string,
  { label: string; color: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pendente", color: "secondary" },
  in_progress: { label: "Em Andamento", color: "default" },
  completed: { label: "Concluída", color: "outline" },
  canceled: { label: "Cancelada", color: "destructive" },
};

export function GoalCard({ goal }: { goal: HydratedGoal }) {
  const { data: user } = useUserProfile();
  const statusInfo = statusMap[goal.status] || statusMap.pending;

  const isFullyAttained =
    goal.ppr_attained > 0 && goal.ppr_attained >= goal.ppr_percentage;

  return (
    <Card className="flex flex-col justify-between hover:shadow-md transition-shadow h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex gap-2">
            <Badge variant={statusInfo.color}>{statusInfo.label}</Badge>

            {/* --- NOVO BADGE DE REFERÊNCIA --- */}
            <Badge variant="outline" className="bg-slate-50">
              {goal.reference}
            </Badge>

            {/* --- NOVO BADGE DE PORCENTAGEM PPR --- */}
            <Badge
              variant="secondary"
              className={cn(
                "gap-1.5 transition-colors",
                isFullyAttained
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200"
                  : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              )}
              title="PPR Atingido / PPR Possível"
            >
              <span className="font-mono font-bold">{goal.ppr_attained}%</span>
              <span className="opacity-60 text-[10px]">
                / {goal.ppr_percentage}%
              </span>
            </Badge>
          </div>

          {goal.priority === "high" && (
            <Badge variant="destructive" className="text-[10px] px-1.5 h-5">
              Alta
            </Badge>
          )}
        </div>
        <CardTitle className="mt-2 text-xl truncate" title={goal.title}>
          {goal.title}
        </CardTitle>

        {/* NOVO: Mostra quem criou a meta se tiver o nome disponível */}
        {goal.creator.name && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <span className="mr-1">Atribuído por:</span>
            <span className="font-medium text-foreground">
              {goal.creator.name}
            </span>
          </div>
        )}

        <CardDescription className="line-clamp-2 min-h-10 mt-2">
          {goal.description || "Sem descrição."}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-2">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progresso</span>
            <span className="font-medium text-foreground">
              {goal.progress}%
            </span>
          </div>
          <Progress value={goal.progress} className="h-2" />
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t bg-muted/20 flex justify-between">
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="mr-2 h-4 w-4" />
          <span>{goal.deadline.toDate().toLocaleDateString("pt-BR")}</span>
        </div>

        {/* Dica visual se outra pessoa for lançar */}
        {goal.launcher.id !== user?.id && (
          <div
            title={`Lançamento feito por: ${goal.launcher.name}`}
            className="flex items-center text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
          >
            <User className="w-3 h-3 mr-1" />
            Lançamento Externo
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
