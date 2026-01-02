import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useCreateGoal } from "@/hooks/useGoals";
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
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

interface CreateGoalSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateGoalSheet({ isOpen, onClose }: CreateGoalSheetProps) {
  const { mutate: createGoal, isPending } = useCreateGoal();
  const [currentStep, setCurrentStep] = useState(0);

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
      // Etapa 1
      title: "",
      description: "",
      deadline: "",
      priority: "medium",

      // Etapa 2
      sectorId: "",
      responsibleId: "",
      launcherId: "",

      // Etapa 3
      frequency: "mensal",
      inputType: "numeric",

      // Etapa 4
      levels: [{ targetValue: "", percentage: 100 }], // Inicial com 1 nível de 100%
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "levels",
  });

  // Watchers para lógica condicional e validação visual
  const inputType = watch("inputType");
  const levels = watch("levels");

  // Cálculo da soma das porcentagens em tempo real
  const totalPercentage = levels.reduce(
    (acc, curr) => acc + (Number(curr.percentage) || 0),
    0
  );
  const isTotalValid = totalPercentage === 100;

  // Resetar formulário ao fechar/abrir
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
      fields: ["title", "deadline", "priority", "description"],
    },
    {
      id: "people",
      title: "Pessoas e Setores",
      fields: ["sectorId", "responsibleId", "launcherId"],
    },
    { id: "config", title: "Configuração", fields: ["frequency", "inputType"] },
    { id: "levels", title: "Níveis de Avaliação", fields: ["levels"] },
  ];

  const handleNext = async () => {
    const fieldsToValidate = steps[currentStep].fields;
    // @ts-ignore - Trigger aceita string ou array de strings correspondentes aos nomes dos campos
    const isValid = await trigger(fieldsToValidate);

    if (isValid) {
      // Validação extra para a etapa de Setores (Placeholders)
      if (currentStep === 1) {
        console.log("Placeholder: Buscando usuários do setor selecionado...");
        console.log(
          "Placeholder: Buscando lista completa de usuários para lançador..."
        );
      }

      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // --- SUBMIT FINAL ---
  const onSubmit = (data: any) => {
    if (!isTotalValid) return; // Impede envio se soma != 100%

    // Ajuste dos dados para o formato do backend
    const payload = {
      ...data,
      deadline: new Date(data.deadline).toISOString(), // Converte string date para ISO
      // Converte values numéricos se necessário
      levels: data.levels.map((l: any) => ({
        targetValue:
          data.inputType === "numeric" ? Number(l.targetValue) : l.targetValue,
        percentage: Number(l.percentage),
      })),
      // Dados mockados para os selects que ainda não têm backend real conectado neste form
      responsibleName: "Nome Simulado (Resp)",
      launcherName: "Nome Simulado (Launch)",
      creatorId: "current-user-uid", // O hook useCreateGoal já deve injetar isso, mas garantindo
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

        {/* CORPO DO FORMULÁRIO (Scrollável) */}
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
                <div className="space-y-2">
                  <Label>
                    Setor Responsável <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(v) => {
                      setValue("sectorId", v);
                      console.log(
                        `Log: Setor alterado para ${v}. Buscando usuários...`
                      );
                    }}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecione um setor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ti">
                        Tecnologia da Informação
                      </SelectItem>
                      <SelectItem value="rh">Recursos Humanos</SelectItem>
                      <SelectItem value="comercial">Comercial</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* Input oculto para validação do hook-form */}
                  <input
                    type="hidden"
                    {...register("sectorId", { required: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Responsável pela Meta{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(v) => setValue("responsibleId", v)}
                    disabled={!watch("sectorId")}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue
                        placeholder={
                          !watch("sectorId")
                            ? "Selecione o setor primeiro"
                            : "Selecione o responsável"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uid-user-1">
                        João Silva (TI)
                      </SelectItem>
                      <SelectItem value="uid-user-2">
                        Maria Santos (TI)
                      </SelectItem>
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

                <div className="space-y-2">
                  <Label>
                    Lançador dos Dados <span className="text-red-500">*</span>
                  </Label>
                  <Select onValueChange={(v) => setValue("launcherId", v)}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecione quem fará os lançamentos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uid-user-1">João Silva</SelectItem>
                      <SelectItem value="uid-user-2">Maria Santos</SelectItem>
                      <SelectItem value="uid-gestor">Gabriel Gestor</SelectItem>
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
                        inputType === "numeric"
                          ? "bg-primary/5 border-primary ring-1 ring-primary"
                          : "bg-background"
                      )}
                      onClick={() => setValue("inputType", "numeric")}
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
                        inputType === "options"
                          ? "bg-primary/5 border-primary ring-1 ring-primary"
                          : "bg-background"
                      )}
                      onClick={() => setValue("inputType", "options")}
                    >
                      <span className="font-semibold text-sm">
                        Classes / Opções
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Texto descritivo (Ex: "Sim/Não", "Atingido/Parcial").
                      </span>
                    </div>
                  </div>
                  <input type="hidden" {...register("inputType")} />
                </div>
              </div>
            )}

            {/* --- ETAPA 4: NÍVEIS --- */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg border">
                  <div className="text-sm font-medium text-slate-700">
                    Total Distribuído:
                  </div>
                  <div
                    className={cn(
                      "font-bold text-lg flex items-center gap-2",
                      isTotalValid ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {isTotalValid ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                    {totalPercentage}%
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
                          {inputType === "numeric"
                            ? "Valor Alvo"
                            : "Descrição da Classe"}
                        </Label>
                        <Input
                          type={inputType === "numeric" ? "number" : "text"}
                          placeholder={
                            inputType === "numeric"
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
                        disabled={fields.length === 1} // Não pode remover o último
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

                {!isTotalValid && (
                  <p className="text-xs text-red-500 text-center font-medium bg-red-50 p-2 rounded">
                    A soma das porcentagens deve ser exatamente 100%.
                  </p>
                )}
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
