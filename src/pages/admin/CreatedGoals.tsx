// src/pages/manager/CreatedGoals.tsx
import { useState } from "react";
import { PlusCircle, Search, Briefcase } from "lucide-react";
import { useCreatedGoals } from "@/hooks/useGoals";
import { GoalCard } from "@/components/GoalCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateGoalSheet } from "@/components/CreateGoalSheet";

export default function CreatedGoalsPage() {
  const { data: goals, isLoading, isError } = useCreatedGoals();
  const [searchTerm, setSearchTerm] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (isLoading) return <GoalsSkeleton />;

  if (isError) {
    return (
      <div className="p-4 text-red-500">Erro ao carregar metas criadas.</div>
    );
  }

  const filteredGoals = goals?.filter((goal) =>
    goal.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-primary" />
            Metas Criadas por Mim
          </h2>
          <p className="text-muted-foreground">
            Gerencie as metas que você definiu para sua equipe.
          </p>
        </div>

        <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
          <PlusCircle className="h-4 w-4" />
          Nova Meta
        </Button>
      </div>

      {/* Barra de Busca */}
      <div className="relative w-full md:w-96">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar metas criadas..."
          className="pl-9 bg-background"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid */}
      {filteredGoals?.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
          Nenhuma meta encontrada.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredGoals?.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      <CreateGoalSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}

function GoalsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 mt-8">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-64 rounded-xl" />
      ))}
    </div>
  );
}
