// src/components/CreateGoalSheet.tsx
import { useForm } from "react-hook-form";
import { useCreateGoal } from "@/hooks/useGoals";
import type { GoalFrequency, GoalPriority, GoalInputType } from "@/types/goal";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CreateGoalSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateGoalSheet({ isOpen, onClose }: CreateGoalSheetProps) {
  const { mutate: createGoal, isPending } = useCreateGoal();

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      title: "",
      description: "",
      deadline: "",
      frequency: "mensal" as GoalFrequency,
      priority: "medium" as GoalPriority,
      inputType: "numeric" as GoalInputType,
      targetValue: "", // Simplificação: vamos criar 1 nível de 100% com esse valor
    },
  });

  const onSubmit = (data: any) => {
    // Monta o objeto da meta
    const payload = {
      ...data,
      deadline: new Date(data.deadline).toISOString(),
      // Criação automática de níveis básicos para MVP
      levels: [
        {
          targetValue:
            data.inputType === "numeric" ? Number(data.targetValue) : "Sim",
          percentage: 100,
        },
      ],
      // Hardcoded para teste (ideal seria um Select de usuários)
      responsibleId: "uid-colaborador-1",
      responsibleName: "João da Silva",
    };

    createGoal(payload, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:w-135 sm:max-w-none p-0 flex flex-col">
        <SheetHeader className="p-6 border-b bg-muted/5">
          <SheetTitle>Nova Meta</SheetTitle>
          <SheetDescription>
            Defina os parâmetros da meta para sua equipe.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 bg-slate-50/50">
          <form
            id="create-goal-form"
            onSubmit={handleSubmit(onSubmit)}
            className="p-6 space-y-6"
          >
            <div className="space-y-2">
              <Label>Título da Meta</Label>
              <Input
                placeholder="Ex: Aumentar vendas em 10%"
                {...register("title", { required: true })}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Detalhes sobre como atingir..."
                {...register("description")}
                className="bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prazo Final</Label>
                <Input
                  type="date"
                  {...register("deadline", { required: true })}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  onValueChange={(v) => setValue("priority", v as GoalPriority)}
                  defaultValue="medium"
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-100">
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Frequência</Label>
                <Select
                  onValueChange={(v) =>
                    setValue("frequency", v as GoalFrequency)
                  }
                  defaultValue="mensal"
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-100">
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Medição</Label>
                <Select
                  onValueChange={(v) =>
                    setValue("inputType", v as GoalInputType)
                  }
                  defaultValue="numeric"
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-100">
                    <SelectItem value="numeric">Numérico</SelectItem>
                    <SelectItem value="options">Sim/Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Renderização Condicional do Alvo */}
            {watch("inputType") === "numeric" && (
              <div className="space-y-2">
                <Label>Meta Numérica (Alvo 100%)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 50000"
                  {...register("targetValue")}
                  className="bg-background"
                />
              </div>
            )}
          </form>
        </ScrollArea>

        <SheetFooter className="p-6 border-t bg-background">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="create-goal-form" disabled={isPending}>
            {isPending ? "Criando..." : "Criar Meta"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
