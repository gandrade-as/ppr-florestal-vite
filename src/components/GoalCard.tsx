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
  const statusInfo = statusMap[goal.status] || statusMap.pending;

  return (
    <Card className="flex flex-col justify-between hover:shadow-md transition-shadow h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge variant={statusInfo.color}>{statusInfo.label}</Badge>
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
        {goal.launcher.id !== goal.responsible.id && (
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
