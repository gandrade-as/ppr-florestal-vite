import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useCreateGoal } from "@/hooks/useGoals";

import { useSectors } from "@/hooks/useSector";
import { useUsers, useSectorUsers } from "@/hooks/useUserProfile";

import { ChevronRight, ChevronLeft, Plus, Trash2 } from "lucide-react";

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

  // --- HOOKS DE DADOS ---
  const { data: sectors, isLoading: isLoadingSectors } = useSectors();
  const { data: allUsers, isLoading: isLoadingAllUsers } = useUsers();

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
      // Etapa 1: Básico
      title: "",
      reference: "",
      description: "",
      deadline: "",
      priority: "medium",

      // Etapa 2: Pessoas (Nomes do Form em camelCase)
      sectorId: "",
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

  // Watchers
  const input_type = watch("input_type");
  const levels = watch("levels");

  // Observa o setor selecionado para buscar os usuários correspondentes
  const selectedSectorId = watch("sectorId");
  const { data: sectorUsers, isLoading: isLoadingSectorUsers } =
    useSectorUsers(selectedSectorId);

  // Cálculo da soma das porcentagens em tempo real
  // const totalPercentage = levels.reduce(
  //   (acc, curr) => acc + (Number(curr.percentage) || 0),
  //   0
  // );

  const isTotalValid =
    levels.length > 0 && levels.every((l) => Number(l.percentage) >= 0);

  // Resetar formulário ao abrir/fechar
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      reset();
    }
  }, [isOpen, reset]);

  // --- NAVEGAÇÃO ---
  const steps = [
    {
      id: "basic",
      title: "Informações Básicas",
      fields: ["title", "reference", "deadline", "priority", "description"],
    },
    {
      id: "people",
      title: "Pessoas e Setores",
      fields: ["sectorId", "responsibleId", "launcherId"],
    },
    {
      id: "config",
      title: "Configuração",
      fields: ["frequency", "input_type"],
    },
    { id: "levels", title: "Níveis de Avaliação", fields: ["levels"] },
  ];

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

  // --- SUBMIT FINAL ---
  const onSubmit = (data: any) => {
    if (!isTotalValid) return;

    // Transformação dos dados para o formato do Firestore (snake_case)
    const payload: any = {
      title: data.title,
      reference: data.reference,
      description: data.description,
      status: "pending", // Status inicial padrão
      priority: data.priority,
      progress: 0,
      deadline: Timestamp.fromDate(new Date(data.deadline)), // Converte para Timestamp do Firestore
      frequency: data.frequency,
      input_type: data.input_type,

      // Mapeamento dos relacionamentos (Form -> Firestore)
      sector_id: data.sectorId,
      responsible_id: data.responsibleId,
      launcher_id: data.launcherId,

      // O creator_id é injetado automaticamente pelo hook useCreateGoal usando o AuthContext

      // Tratamento dos níveis
      levels: data.levels.map((l: any) => ({
        targetValue:
          data.input_type === "numeric" ? Number(l.targetValue) : l.targetValue,
        percentage: Number(l.percentage),
      })),

      launches: [], // Inicializa array vazio
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
        {/* HEADER com Barra de Progresso */}
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

        {/* CORPO DO FORMULÁRIO */}
        <ScrollArea className="flex-1">
          <form
            id="create-goal-form"
            onSubmit={handleSubmit(onSubmit)}
            className="p-6 space-y-6"
          >
            {/* --- ETAPA 1: BÁSICO --- */}
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
                    placeholder="Detalhes sobre como atingir..."
                    {...register("description")}
                    className="bg-background min-h-25"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Referência (Semestre){" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Ex: 2026/01"
                      maxLength={7}
                      {...register("reference", {
                        required: "Referência obrigatória",
                        pattern: {
                          value: /^\d{4}\/(01|02)$/,
                          message: "Use o formato AAAA/01 ou AAAA/02",
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
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select
                      onValueChange={(v) => setValue("priority", v)}
                      defaultValue="medium"
                    >
                      <SelectTrigger className="bg-background">
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
              </div>
            )}

            {/* --- ETAPA 2: PESSOAS E SETORES --- */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Seleção de Setor */}
                <div className="space-y-2">
                  <Label>
                    Setor Responsável <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(v) => {
                      setValue("sectorId", v);
                      setValue("responsibleId", ""); // Reseta responsável ao mudar setor
                    }}
                    value={watch("sectorId")}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue
                        placeholder={
                          isLoadingSectors
                            ? "Carregando setores..."
                            : "Selecione um setor"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors?.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id}>
                          {sector.name} ({sector.acronym})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input
                    type="hidden"
                    {...register("sectorId", { required: true })}
                  />
                </div>

                {/* Seleção de Responsável (Filtrado pelo Setor) */}
                <div className="space-y-2">
                  <Label>
                    Responsável pela Meta{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(v) => setValue("responsibleId", v)}
                    value={watch("responsibleId")}
                    disabled={!selectedSectorId || isLoadingSectorUsers}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue
                        placeholder={
                          !selectedSectorId
                            ? "Selecione o setor primeiro"
                            : isLoadingSectorUsers
                            ? "Carregando usuários..."
                            : "Selecione o responsável"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {sectorUsers?.map((user) => (
                        <SelectItem key={user.uid} value={user.uid}>
                          {user.name}
                        </SelectItem>
                      ))}
                      {sectorUsers?.length === 0 && (
                        <div className="p-2 text-xs text-muted-foreground text-center">
                          Nenhum usuário encontrado neste setor.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <input
                    type="hidden"
                    {...register("responsibleId", { required: true })}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Quem será cobrado pelo resultado.
                  </p>
                </div>

                {/* Seleção de Lançador (Todos os Usuários) */}
                <div className="space-y-2">
                  <Label>
                    Lançador dos Dados <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(v) => setValue("launcherId", v)}
                    value={watch("launcherId")}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue
                        placeholder={
                          isLoadingAllUsers
                            ? "Carregando..."
                            : "Selecione quem fará os lançamentos"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {allUsers?.map((user) => (
                        <SelectItem key={user.uid} value={user.uid}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input
                    type="hidden"
                    {...register("launcherId", { required: true })}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Geralmente o próprio responsável ou seu gestor.
                  </p>
                </div>
              </div>
            )}

            {/* --- ETAPA 3: CONFIGURAÇÃO --- */}
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
                        Valores monetários (R$), quantidades, porcentagens
                        absolutas.
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
                        Texto descritivo (Ex: "Sim/Não", "Atingido/Parcial").
                      </span>
                    </div>
                  </div>
                  <input type="hidden" {...register("input_type")} />
                </div>
              </div>
            )}

            {/* --- ETAPA 4: NÍVEIS --- */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg border">
                  <div className="text-sm font-medium text-slate-700">
                    Níveis de Atingimento:
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
                            : "Descrição da Classe"}
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
                          placeholder="%"
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
                        className="mb-0.5 text-muted-foreground hover:text-red-500 hover:bg-red-50"
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
                  className="w-full border-dashed gap-2 text-muted-foreground hover:text-primary hover:border-primary"
                  onClick={() => append({ targetValue: "", percentage: 0 })}
                >
                  <Plus className="h-4 w-4" /> Adicionar Nível
                </Button>
              </div>
            )}
          </form>
        </ScrollArea>

        {/* FOOTER DA NAVEGAÇÃO */}
        <SheetFooter className="p-6 border-t bg-background flex flex-row justify-between items-center sm:justify-between">
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
              disabled={!isTotalValid || isPending}
              className={cn(!isTotalValid && "opacity-50 cursor-not-allowed")}
            >
              {isPending ? "Criando..." : "Finalizar e Criar"}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
