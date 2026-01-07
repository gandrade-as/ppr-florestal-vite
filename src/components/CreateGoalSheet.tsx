import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useCreateGoal, useSectorGoals } from "@/hooks/useGoals"; // Importar useSectorGoals

import { useSectors } from "@/hooks/useSector";
import { useUsers, useSectorUsers } from "@/hooks/useUserProfile";

import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Info,
} from "lucide-react";

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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Timestamp } from "firebase/firestore";

interface CreateGoalSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateGoalSheet({ isOpen, onClose }: CreateGoalSheetProps) {
  const { mutate: createGoal, isPending } = useCreateGoal();
  const [currentStep, setCurrentStep] = useState(0);

  // --- HOOKS DE DADOS GERAIS ---
  const { data: sectors, isLoading: isLoadingSectors } = useSectors();
  const { data: allUsers } = useUsers();

  // Configuração do Formulário
  const {
    register,
    control,
    handleSubmit,
    reset,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      // Etapa 1: Básico & Setor
      title: "",
      description: "",
      reference: "",
      deadline: "",
      sectorId: "", // Movido para etapa 1

      // Etapa 2: Pessoas & Peso
      ppr_percentage: 0, // Movido para etapa 2
      priority: "medium", // Mantive aqui para equilibrar o form ou pode ir para 1
      responsibleId: "",
      launcherId: "",

      // Etapa 3: Configuração
      frequency: "mensal",
      input_type: "numeric",

      // Etapa 4: Níveis
      levels: [{ targetValue: "", percentage: 100 }],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "levels",
  });

  // --- WATCHERS PARA LÓGICA DINÂMICA ---
  const input_type = watch("input_type");
  const selectedSectorId = watch("sectorId");
  const selectedReference = watch("reference");
  const currentPprInput = watch("ppr_percentage");

  // --- DADOS ESPECÍFICOS ---

  // 1. Setores Válidos (Apenas com usuários)
  const activeSectors = useMemo(() => {
    if (!sectors || !allUsers) return [];

    // Cria um Set com IDs dos setores que os usuários possuem
    const sectorIdsWithUsers = new Set(allUsers.map((u) => u.sector.id));

    return sectors.filter((s) => sectorIdsWithUsers.has(s.id));
  }, [sectors, allUsers]);

  // 2. Usuários do Setor Selecionado (Responsável)
  const { data: sectorUsers, isLoading: isLoadingSectorUsers } =
    useSectorUsers(selectedSectorId);

  // 3. Metas do Setor (Para cálculo de soma de PPR)
  const { data: existingSectorGoals } = useSectorGoals(selectedSectorId);

  // 4. Cálculo da Soma de PPR Atual
  const pprMetrics = useMemo(() => {
    if (!existingSectorGoals || !selectedReference) return { sum: 0, count: 0 };

    const goalsInPeriod = existingSectorGoals.filter(
      (g) => g.reference === selectedReference
    );

    const sum = goalsInPeriod.reduce(
      (acc, curr) => acc + (curr.ppr_percentage || 0),
      0
    );

    return { sum, count: goalsInPeriod.length };
  }, [existingSectorGoals, selectedReference]);

  const totalPprPredicted = pprMetrics.sum + Number(currentPprInput || 0);
  const isOverLimit = totalPprPredicted > 100;

  // --- NAVEGAÇÃO ---
  const steps = [
    {
      id: "basic",
      title: "Definição e Escopo",
      fields: ["title", "description", "reference", "deadline", "sectorId"],
    },
    {
      id: "people",
      title: "Pesos e Responsáveis",
      fields: ["ppr_percentage", "priority", "responsibleId", "launcherId"],
    },
    {
      id: "config",
      title: "Configuração da Medição",
      fields: ["frequency", "input_type"],
    },
    { id: "levels", title: "Níveis de Atingimento", fields: ["levels"] },
  ];

  // Resetar formulário ao abrir/fechar
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      reset();
    }
  }, [isOpen, reset]);

  const handleNext = async () => {
    // @ts-ignore
    const isValid = await trigger(steps[currentStep].fields);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const onSubmit = (data: any) => {
    // Validação final de níveis
    const levelsValid =
      data.levels.length > 0 &&
      data.levels.every((l: any) => Number(l.percentage) >= 0);
    if (!levelsValid) return;

    const payload: any = {
      title: data.title,
      reference: data.reference,
      ppr_percentage: Number(data.ppr_percentage),
      description: data.description,
      status: "pending",
      priority: data.priority,
      progress: 0,
      deadline: Timestamp.fromDate(new Date(data.deadline)),
      frequency: data.frequency,
      input_type: data.input_type,
      sector_id: data.sectorId,
      responsible_id: data.responsibleId,
      launcher_id: data.launcherId,
      levels: data.levels.map((l: any) => ({
        targetValue:
          data.input_type === "numeric" ? Number(l.targetValue) : l.targetValue,
        percentage: Number(l.percentage),
      })),
      launches: [],
    };

    createGoal(payload, {
      onSuccess: () => {
        onClose();
        reset();
      },
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:w-150 sm:max-w-none p-0 flex flex-col bg-slate-50/50">
        {/* HEADER */}
        <SheetHeader className="px-6 pt-6 pb-2 bg-background border-b shadow-sm z-10">
          <div className="flex items-center justify-between mb-2">
            <SheetTitle>Nova Meta</SheetTitle>
            <span className="text-xs text-muted-foreground font-medium">
              Etapa {currentStep + 1} de {steps.length}
            </span>
          </div>
          <Progress
            value={((currentStep + 1) / steps.length) * 100}
            className="h-1.5"
          />
          <SheetDescription className="pt-2">
            {steps[currentStep].title}
          </SheetDescription>
        </SheetHeader>

        {/* CORPO */}
        <ScrollArea className="flex-1">
          <form
            id="create-goal-form"
            onSubmit={handleSubmit(onSubmit)}
            className="p-6 space-y-6"
          >
            {/* ============================================================
                ETAPA 1: BÁSICO + SETOR
               ============================================================ */}
            {currentStep === 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <Label>
                    Título da Meta <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Ex: Aumentar vendas em 10%"
                    {...register("title", {
                      required: "O título é obrigatório",
                    })}
                    className="bg-background"
                  />
                  {errors.title && (
                    <span className="text-xs text-red-500">
                      {errors.title.message as string}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Detalhes operacionais sobre como atingir esta meta..."
                    {...register("description")}
                    className="bg-background min-h-24"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Referência (Semestre){" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="AAAA/01 ou AAAA/02"
                      maxLength={7}
                      {...register("reference", {
                        required: "Referência obrigatória",
                        pattern: {
                          value: /^\d{4}\/(01|02)$/,
                          message: "Formato inválido. Use 2024/01, 2024/02...",
                        },
                      })}
                      className="bg-background"
                    />
                    {errors.reference && (
                      <span className="text-xs text-red-500">
                        {errors.reference.message as string}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Prazo Final <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      {...register("deadline", {
                        required: "Data obrigatória",
                      })}
                      className="bg-background"
                    />
                    {errors.deadline && (
                      <span className="text-xs text-red-500">
                        {errors.deadline.message as string}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Label>
                    Setor (Escopo da Meta){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(v) => {
                      setValue("sectorId", v);
                      setValue("responsibleId", ""); // Reseta o responsável pois mudou o setor
                    }}
                    value={watch("sectorId")}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue
                        placeholder={
                          isLoadingSectors
                            ? "Carregando..."
                            : "Selecione o setor"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {activeSectors.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id}>
                          {sector.name} ({sector.acronym})
                        </SelectItem>
                      ))}
                      {activeSectors.length === 0 && !isLoadingSectors && (
                        <div className="p-2 text-xs text-muted-foreground text-center">
                          Nenhum setor com usuários ativos encontrado.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <input
                    type="hidden"
                    {...register("sectorId", { required: true })}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Apenas setores com usuários cadastrados aparecem aqui.
                  </p>
                </div>
              </div>
            )}

            {/* ============================================================
                ETAPA 2: PESO + RESPONSÁVEL + LANÇADOR
               ============================================================ */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* BLOCO DE PESO PPR */}
                <div className="space-y-3 bg-white p-4 rounded-xl border shadow-sm">
                  <div className="flex justify-between items-center">
                    <Label className="flex items-center gap-2">
                      Peso no PPR (%) <span className="text-red-500">*</span>
                    </Label>
                    <div
                      className={cn(
                        "text-xs font-bold px-2 py-1 rounded",
                        isOverLimit
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-50 text-blue-700"
                      )}
                    >
                      Total do Setor: {totalPprPredicted}%
                    </div>
                  </div>

                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="Ex: 30"
                      {...register("ppr_percentage", {
                        required: true,
                        min: 0,
                        max: 100,
                      })}
                      className={cn(
                        "pr-8",
                        isOverLimit &&
                          "border-red-300 focus-visible:ring-red-200"
                      )}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                      %
                    </span>
                  </div>

                  <div className="flex gap-2 items-start text-xs text-muted-foreground">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      Existem <strong>{pprMetrics.count}</strong> metas neste
                      setor para o período {selectedReference || "..."} somando{" "}
                      <strong>{pprMetrics.sum}%</strong>.
                      {isOverLimit && (
                        <span className="text-red-600 block font-semibold mt-1">
                          Atenção: O total ultrapassa 100%.
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* RESPONSÁVEL (Filtro por Setor) */}
                <div className="space-y-2">
                  <Label>
                    Responsável (Dono da Meta){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(v) => setValue("responsibleId", v)}
                    value={watch("responsibleId")}
                    disabled={isLoadingSectorUsers}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecione o colaborador do setor" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectorUsers?.map((user) => (
                        <SelectItem key={user.uid} value={user.uid}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input
                    type="hidden"
                    {...register("responsibleId", { required: true })}
                  />
                </div>

                {/* LANÇADOR (Todos os Usuários) */}
                <div className="space-y-2">
                  <Label>
                    Quem fará os lançamentos?{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(v) => setValue("launcherId", v)}
                    value={watch("launcherId")}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecione o usuário lançador" />
                    </SelectTrigger>
                    <SelectContent>
                      {allUsers?.map((user) => (
                        <SelectItem key={user.uid} value={user.uid}>
                          {user.name} - {user.sector.acronym}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input
                    type="hidden"
                    {...register("launcherId", { required: true })}
                  />
                </div>

                {/* PRIORIDADE (Campo Menor) */}
                <div className="space-y-2">
                  <Label>Nível de Prioridade</Label>
                  <Select
                    onValueChange={(v) => setValue("priority", v)}
                    defaultValue="medium"
                  >
                    <SelectTrigger className="bg-background w-1/2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* ============================================================
                ETAPA 3: CONFIGURAÇÃO (Mantida igual)
               ============================================================ */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-3">
                  <Label>Frequência de Lançamento</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {["mensal", "trimestral", "semestral"].map((freq) => (
                      <div
                        key={freq}
                        className={cn(
                          "cursor-pointer border rounded-lg p-3 text-center transition-all hover:border-primary",
                          watch("frequency") === freq
                            ? "bg-primary/5 border-primary ring-1 ring-primary"
                            : "bg-background"
                        )}
                        onClick={() => setValue("frequency", freq as any)}
                      >
                        <span className="capitalize text-sm font-medium">
                          {freq}
                        </span>
                      </div>
                    ))}
                  </div>
                  <input type="hidden" {...register("frequency")} />
                </div>

                <div className="space-y-3">
                  <Label>Tipo de Medição</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={cn(
                        "cursor-pointer border rounded-lg p-4 flex flex-col gap-2 hover:border-primary transition-all",
                        input_type === "numeric"
                          ? "bg-primary/5 border-primary ring-1 ring-primary"
                          : "bg-background"
                      )}
                      onClick={() => setValue("input_type", "numeric")}
                    >
                      <span className="font-semibold text-sm">Numérico</span>
                      <span className="text-xs text-muted-foreground">
                        Quantitativo (Unidades, Kg, R$).
                      </span>
                    </div>
                    <div
                      className={cn(
                        "cursor-pointer border rounded-lg p-4 flex flex-col gap-2 hover:border-primary transition-all",
                        input_type === "options"
                          ? "bg-primary/5 border-primary ring-1 ring-primary"
                          : "bg-background"
                      )}
                      onClick={() => setValue("input_type", "options")}
                    >
                      <span className="font-semibold text-sm">
                        Classes / Opções
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Qualitativo (Sim/Não, Atingido).
                      </span>
                    </div>
                  </div>
                  <input type="hidden" {...register("input_type")} />
                </div>
              </div>
            )}

            {/* ============================================================
                ETAPA 4: NÍVEIS (Mantida igual)
               ============================================================ */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg border">
                  <div className="text-sm font-medium text-slate-700">
                    Regras de Atingimento
                  </div>
                  <div className="font-bold text-lg text-blue-600">
                    {fields.length} Nível(is)
                  </div>
                </div>

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex gap-2 items-end group animate-in slide-in-from-bottom-2"
                    >
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          {input_type === "numeric"
                            ? "Valor Alvo"
                            : "Descrição"}
                        </Label>
                        <Input
                          type={input_type === "numeric" ? "number" : "text"}
                          placeholder={
                            input_type === "numeric"
                              ? "Ex: 1000"
                              : "Ex: Concluído"
                          }
                          {...register(`levels.${index}.targetValue` as const, {
                            required: true,
                          })}
                          className="bg-background"
                        />
                      </div>
                      <div className="w-24 space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Peso (%)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...register(`levels.${index}.percentage` as const, {
                            required: true,
                            min: 0,
                            max: 100,
                          })}
                          className="bg-background text-center font-mono"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mb-0.5 text-muted-foreground hover:text-red-500"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed gap-2"
                  onClick={() => append({ targetValue: "", percentage: 0 })}
                >
                  <Plus className="h-4 w-4" /> Adicionar Nível
                </Button>
              </div>
            )}
          </form>
        </ScrollArea>

        {/* FOOTER */}
        <SheetFooter className="p-6 border-t bg-background flex flex-row justify-between">
          <Button
            variant="ghost"
            onClick={currentStep === 0 ? onClose : handleBack}
            disabled={isPending}
          >
            {currentStep === 0 ? (
              "Cancelar"
            ) : (
              <>
                <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
              </>
            )}
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext}>
              Próximo <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={isPending || isOverLimit}
            >
              {isPending ? "Criando..." : "Finalizar"}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
