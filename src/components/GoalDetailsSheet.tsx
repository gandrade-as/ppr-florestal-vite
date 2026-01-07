import { useState, useEffect } from "react";
import {
  FileText,
  ChevronLeft,
  Calendar,
  Hash,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Save,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Pencil,
  Trash2,
  Target,
} from "lucide-react";
import { format } from "date-fns";

// Hooks e Tipos
import { useUpdateLaunch, useCreateLaunch } from "@/hooks/useLaunches";
import { useGoal, useUpdateGoal } from "@/hooks/useGoals"; // Certifique-se de ter criado o useUpdateGoal no hook
import { useUserProfile } from "@/hooks/useUserProfile";
import { getMaxLaunches, type HydratedGoal } from "@/types/goal";
import type { FirestoreLaunch } from "@/types/launch";

// Componentes UI
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type SheetMode = "readonly" | "launcher" | "evaluator";

interface GoalDetailsSheetProps {
  goal: HydratedGoal | null;
  isOpen: boolean;
  onClose: () => void;
  mode?: SheetMode;
}

export function GoalDetailsSheet({
  goal: initialGoal,
  isOpen,
  onClose,
  mode = "readonly",
}: GoalDetailsSheetProps) {
  const [selectedLaunchId, setSelectedLaunchId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // 1. Dados do Usuário Logado para verificação de permissão
  const { data: userProfile } = useUserProfile();

  // 2. Sincronização com o Firestore via TanStack Query
  const { data: freshGoal } = useGoal(initialGoal?.id);
  const goal = freshGoal || initialGoal;

  useEffect(() => {
    if (!isOpen) {
      setSelectedLaunchId(null);
      setIsCreating(false);
    }
  }, [isOpen]);

  if (!goal) return null;

  // 3. Lógica de "Modo Efetivo"
  const isUserTheLauncher = userProfile?.id === goal.launcher.id;

  const effectiveMode: SheetMode =
    mode === "evaluator" ? "evaluator" : isUserTheLauncher ? "launcher" : mode;

  const selectedLaunch = goal.launches?.find((l) => l.id === selectedLaunchId);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:w-150 p-0 flex flex-col h-full bg-slate-50/50 z-50">
        {isCreating ? (
          <CreateLaunchForm
            goal={goal}
            onBack={() => setIsCreating(false)}
            onSuccess={() => setIsCreating(false)}
          />
        ) : selectedLaunchId && selectedLaunch ? (
          <LaunchDetails
            launch={selectedLaunch}
            goal={goal}
            mode={effectiveMode}
            onBack={() => setSelectedLaunchId(null)}
          />
        ) : (
          <GoalOverview
            goal={goal}
            mode={effectiveMode}
            onSelectLaunch={(id) => setSelectedLaunchId(id)}
            onCreateNew={() => setIsCreating(true)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

// ==========================================
// 1. VIEW: LISTA DE LANÇAMENTOS (Overview) + EDIÇÃO
// ==========================================

function GoalOverview({
  goal,
  mode,
  onSelectLaunch,
  onCreateNew,
}: {
  goal: HydratedGoal;
  mode: SheetMode;
  onSelectLaunch: (id: string) => void;
  onCreateNew: () => void;
}) {
  // Hook de atualização da meta
  const { mutate: updateGoal, isPending: isUpdatingGoal } = useUpdateGoal();

  // Estados de controle de edição
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [description, setDescription] = useState(goal.description || "");
  const [levels, setLevels] = useState(goal.levels || []);

  // Sincroniza estados locais quando a meta muda ou sai do modo de edição
  useEffect(() => {
    if (!isEditingMeta) {
      setDescription(goal.description || "");
      setLevels(goal.levels || []);
    }
  }, [goal, isEditingMeta]);

  // Handler de Salvar
  const handleSaveMeta = () => {
    updateGoal(
      {
        goalId: goal.id,
        data: {
          description,
          levels,
        },
      },
      {
        onSuccess: () => setIsEditingMeta(false),
      }
    );
  };

  // Handlers de Manipulação de Níveis
  const handleLevelChange = (
    index: number,
    field: "targetValue" | "percentage",
    value: string
  ) => {
    const newLevels = [...levels];
    if (field === "percentage") {
      newLevels[index] = { ...newLevels[index], percentage: Number(value) };
    } else {
      newLevels[index] = {
        ...newLevels[index],
        targetValue: goal.input_type === "numeric" ? Number(value) : value,
      };
    }
    setLevels(newLevels);
  };

  const addLevel = () => {
    setLevels([...levels, { targetValue: "", percentage: 0 }]);
  };

  const removeLevel = (index: number) => {
    setLevels(levels.filter((_, i) => i !== index));
  };

  // Dados de Lançamentos
  const sortedLaunches = [...(goal.launches || [])].sort(
    (a, b) => b.seq - a.seq
  );
  const maxAllowed = getMaxLaunches(goal.frequency);
  const currentCount = goal.launches?.length || 0;
  const canCreateMore = currentCount < maxAllowed;

  // Permissão de Edição da Meta: Apenas Avaliador e Status Pendente
  const canEditMeta = mode === "evaluator" && goal.status === "pending";

  return (
    <>
      <SheetHeader className="px-6 py-6 bg-background border-b shadow-sm shrink-0">
        <div className="flex justify-between items-start gap-4">
          <div className="w-full">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="mb-2 uppercase">
                {goal.frequency}
              </Badge>

              {canEditMeta && !isEditingMeta && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingMeta(true)}
                  className="h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Pencil className="w-3 h-3 mr-1" /> Editar Meta
                </Button>
              )}
            </div>

            <SheetTitle className="text-2xl font-bold text-primary">
              {goal.title}
            </SheetTitle>

            {/* Descrição: Modo Edição vs Leitura */}
            {isEditingMeta ? (
              <div className="mt-4 space-y-2 animate-in fade-in">
                <Label
                  htmlFor="desc-edit"
                  className="text-xs text-muted-foreground"
                >
                  Descrição
                </Label>
                <Textarea
                  id="desc-edit"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-white min-h-20"
                />
              </div>
            ) : (
              <SheetDescription className="mt-1 line-clamp-3">
                {goal.description}
              </SheetDescription>
            )}
          </div>

          {!isEditingMeta && (
            <div className="text-right shrink-0">
              <div className="text-2xl font-bold text-blue-600">
                {goal.progress}%
              </div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase">
                Progresso
              </p>
            </div>
          )}
        </div>
      </SheetHeader>

      <ScrollArea className="flex-1 px-6 py-6 overflow-y-auto">
        {/* --- SEÇÃO DE NÍVEIS (EDITÁVEL) --- */}
        <div className="mb-8 border-b pb-6">
          <h3 className="font-semibold text-sm flex items-center gap-2 text-slate-800 mb-4">
            <Target className="h-4 w-4 text-muted-foreground" />
            Níveis de Atingimento (Regra)
          </h3>

          {isEditingMeta ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              {levels.map((lvl, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Input
                      placeholder={
                        goal.input_type === "numeric" ? "Valor" : "Opção"
                      }
                      type={goal.input_type === "numeric" ? "number" : "text"}
                      value={lvl.targetValue}
                      onChange={(e) =>
                        handleLevelChange(idx, "targetValue", e.target.value)
                      }
                      className="h-9 text-sm bg-white"
                    />
                  </div>
                  <div className="w-24">
                    <div className="relative">
                      <Input
                        type="number"
                        value={lvl.percentage}
                        onChange={(e) =>
                          handleLevelChange(idx, "percentage", e.target.value)
                        }
                        className="h-9 text-sm pr-6 text-center bg-white"
                      />
                      <span className="absolute right-2 top-2 text-xs text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => removeLevel(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={addLevel}
                className="w-full border-dashed mt-2 text-xs h-9"
              >
                <Plus className="h-3 w-3 mr-1" /> Adicionar Nível
              </Button>

              <div className="flex gap-2 mt-6 pt-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveMeta}
                  disabled={isUpdatingGoal}
                  className="flex-1 font-bold"
                >
                  {isUpdatingGoal ? "Salvando..." : "Salvar Alterações"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingMeta(false)}
                  disabled={isUpdatingGoal}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            // Modo Visualização
            <div className="flex flex-wrap gap-2">
              {[...goal.levels]
                .sort((a, b) => a.percentage - b.percentage)
                .map((lvl, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center bg-slate-50 border rounded-md px-3 py-2 min-w-20"
                  >
                    <span className="text-sm font-bold text-slate-700">
                      {lvl.targetValue}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground bg-slate-200/50 px-1.5 rounded mt-1">
                      {lvl.percentage}%
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* --- SEÇÃO DE LANÇAMENTOS --- */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-lg flex items-center gap-2 text-slate-800">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Lançamentos ({currentCount}/{maxAllowed})
          </h3>

          {/* O botão "Novo" aparecerá se effectiveMode for "launcher" */}
          {mode === "launcher" && canCreateMore && (
            <Button size="sm" onClick={onCreateNew} className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" /> Novo Lançamento
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-3 pb-6">
          {sortedLaunches.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed rounded-2xl bg-slate-50 text-muted-foreground">
              <p className="text-sm">Nenhum lançamento registrado.</p>
              {mode === "launcher" && (
                <p className="text-xs mt-1">Clique em "Novo" para começar.</p>
              )}
            </div>
          ) : (
            sortedLaunches.map((launch) => (
              <LaunchCard
                key={launch.id}
                launch={launch}
                inputType={goal.input_type}
                onClick={() => onSelectLaunch(launch.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </>
  );
}

// ==========================================
// 2. VIEW: CARD DE LANÇAMENTO (Visualização Individual)
// ==========================================

function LaunchCard({
  launch,
  inputType,
  onClick,
}: {
  launch: FirestoreLaunch;
  inputType: string;
  onClick: () => void;
}) {
  const statusConfig = {
    pending: {
      label: "Em Análise",
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    },
    approved: {
      label: "Aprovado",
      className: "bg-green-100 text-green-700 border-green-200",
    },
    rejected: {
      label: "Reprovado",
      className: "bg-red-100 text-red-700 border-red-200",
    },
  };
  const status = statusConfig[launch.status];

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:border-blue-300 transition-all border-slate-200 shadow-none hover:shadow-sm"
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <Badge
            variant="outline"
            className={cn("text-[10px] font-bold border", status.className)}
          >
            {status.label}
          </Badge>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
            <Calendar className="h-3 w-3" />#{launch.seq} •{" "}
            {format(launch.created_at.toDate(), "dd/MM/yyyy")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
            <Hash className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">
              Valor / Resultado
            </p>
            <p className="font-bold text-lg text-slate-800">
              {inputType === "numeric"
                ? new Intl.NumberFormat("pt-BR", {
                    style: "decimal",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  }).format(Number(launch.value))
                : launch.value}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-300" />
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// 3. VIEW: FORMULÁRIO DE CRIAÇÃO DE LANÇAMENTO
// ==========================================

function CreateLaunchForm({
  goal,
  onBack,
  onSuccess,
}: {
  goal: HydratedGoal;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const { mutate: createLaunch, isPending } = useCreateLaunch();
  const { data: profile } = useUserProfile();
  const [value, setValue] = useState<string>("");
  const [note, setNote] = useState("");

  const handleSave = () => {
    if (!value) return;
    const nextSeq = (goal.launches?.length || 0) + 1;

    createLaunch(
      {
        goalId: goal.id,
        data: {
          seq: nextSeq,
          value: goal.input_type === "numeric" ? Number(value) : value,
          note,
          status: "pending",
          updated_by: profile?.name || "Lançador",
        },
      },
      { onSuccess }
    );
  };

  return (
    <>
      <div className="px-4 py-4 bg-background border-b flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
          <ChevronLeft />
        </Button>
        <h4 className="font-bold text-sm">
          Novo Lançamento #{(goal.launches?.length || 0) + 1}
        </h4>
      </div>

      <ScrollArea className="flex-1 p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
              Valor do Resultado
            </label>
            {goal.input_type === "numeric" ? (
              <div className="relative">
                <Input
                  type="number"
                  className="bg-white"
                  placeholder="0"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
            ) : (
              <Select onValueChange={setValue}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecione a opção atingida" />
                </SelectTrigger>
                <SelectContent>
                  {goal.levels.map((l, i) => (
                    <SelectItem key={i} value={String(l.targetValue)}>
                      {l.targetValue} ({l.percentage}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
              Observações / Evidências
            </label>
            <Textarea
              placeholder="Descreva as justificativas para este resultado..."
              className="min-h-32 bg-white resize-none"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-background">
        <Button
          className="w-full h-11 font-bold"
          disabled={isPending || !value}
          onClick={handleSave}
        >
          {isPending ? "A enviar..." : "Finalizar e Enviar para Análise"}
        </Button>
      </div>
    </>
  );
}

// ==========================================
// 4. VIEW: DETALHES E EDIÇÃO DE LANÇAMENTO
// ==========================================

function LaunchDetails({
  launch,
  goal,
  mode,
  onBack,
}: {
  launch: FirestoreLaunch;
  goal: HydratedGoal;
  mode: SheetMode;
  onBack: () => void;
}) {
  const { mutate: updateLaunch, isPending } = useUpdateLaunch();

  const [value, setValue] = useState(launch.value);
  const [note, setNote] = useState(launch.note || "");
  const [rejectionReason, setRejectionReason] = useState(
    launch.rejection_reason || ""
  );

  const handleUpdate = (newStatus: "pending" | "approved" | "rejected") => {
    updateLaunch(
      {
        goalId: goal.id,
        launchId: launch.id,
        data: {
          value: mode === "launcher" ? value : undefined,
          note: mode === "launcher" ? note : undefined,
          rejection_reason:
            newStatus === "rejected"
              ? rejectionReason
              : newStatus === "approved" || newStatus === "pending"
              ? "" // Limpa o motivo se aprovou ou se reenviou (reset)
              : undefined,
          status: newStatus,
        },
      },
      { onSuccess: onBack }
    );
  };

  return (
    <>
      <div className="px-4 py-4 bg-background border-b flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
          <ChevronLeft />
        </Button>
        <div className="flex-1">
          <h4 className="font-bold text-sm">Detalhes #{launch.seq}</h4>
          <p className="text-xs text-muted-foreground truncate">{goal.title}</p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6 pb-6">
          <div
            className={cn(
              "p-4 rounded-xl border flex items-center gap-3",
              launch.status === "approved"
                ? "bg-green-50 border-green-200 text-green-900"
                : launch.status === "rejected"
                ? "bg-red-50 border-red-200 text-red-900"
                : "bg-yellow-50 border-yellow-200 text-yellow-900"
            )}
          >
            {launch.status === "approved" ? (
              <CheckCircle2 className="text-green-600" />
            ) : launch.status === "rejected" ? (
              <XCircle className="text-red-600" />
            ) : (
              <AlertCircle className="text-yellow-600" />
            )}

            <span className="font-bold uppercase text-xs">
              Status:{" "}
              {launch.status === "pending"
                ? "Em Análise"
                : launch.status === "approved"
                ? "Aprovado"
                : "Reprovado"}
            </span>
          </div>

          <div className="space-y-4">
            <h5 className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
              <FileText className="h-4 w-4" /> Dados do Lançamento
            </h5>
            <div className="grid gap-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase">
                  Valor Atingido
                </label>
                {goal.input_type === "numeric" ? (
                  <div className="relative">
                    <Input
                      // Permite editar se for o lançador E o status não estiver aprovado
                      disabled={
                        mode !== "launcher" || launch.status === "approved"
                      }
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      type="number"
                      className="bg-slate-50/50"
                    />
                  </div>
                ) : (
                  <Select
                    disabled={
                      mode !== "launcher" || launch.status === "approved"
                    }
                    value={String(value)}
                    onValueChange={(val) => setValue(val)}
                  >
                    <SelectTrigger className="bg-slate-50/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {goal.levels.map((l, i) => (
                        <SelectItem key={i} value={String(l.targetValue)}>
                          {l.targetValue}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase">
                  Observações
                </label>
                <Textarea
                  disabled={mode !== "launcher" || launch.status === "approved"}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="bg-slate-50/50 min-h-24 resize-none"
                />
              </div>
            </div>
          </div>

          {(launch.status === "rejected" || mode === "evaluator") && (
            <div className="pt-2 space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <h5 className="text-[11px] font-bold uppercase text-red-600 tracking-widest flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Auditoria / Motivo
              </h5>
              <div className="bg-red-50/30 p-4 rounded-2xl border border-red-100 shadow-sm">
                <Textarea
                  disabled={mode !== "evaluator" || launch.status !== "pending"}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explique o motivo da reprovação..."
                  className="bg-white min-h-24 resize-none border-red-100 focus-visible:ring-red-500"
                />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 bg-background border-t mt-auto shadow-lg">
        {mode === "launcher" && launch.status !== "approved" && (
          <Button
            className="w-full h-12 font-bold"
            // Ao clicar, envia status "pending", que limpa o rejection_reason
            onClick={() => handleUpdate("pending")}
            disabled={isPending || !value}
          >
            <Save className="h-4 w-4 mr-2" /> Gravar Alterações e Reenviar
          </Button>
        )}

        {mode === "evaluator" && launch.status === "pending" && (
          <div className="flex gap-3">
            <Button
              variant="destructive"
              className="flex-1 h-12 font-bold"
              onClick={() => handleUpdate("rejected")}
              disabled={isPending || !rejectionReason}
            >
              <ThumbsDown className="h-4 w-4 mr-2" /> Reprovar
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 h-12 font-bold"
              onClick={() => handleUpdate("approved")}
              disabled={isPending}
            >
              <ThumbsUp className="h-4 w-4 mr-2" /> Aprovar
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
