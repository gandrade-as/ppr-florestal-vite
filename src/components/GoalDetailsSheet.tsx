import { useState, useEffect } from "react";
import {
  FileText,
  ChevronLeft,
  Calendar,
  Hash, // Ícone trocado de DollarSign para Hash
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Save,
  ThumbsUp,
  ThumbsDown,
  Plus,
} from "lucide-react";
import { format } from "date-fns";

// Hooks e Tipos
import { useUpdateLaunch, useCreateLaunch } from "@/hooks/useLaunches";
import { useGoal } from "@/hooks/useGoals";
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

  // Sincronização com o Firestore via TanStack Query
  const { data: freshGoal } = useGoal(initialGoal?.id);
  const goal = freshGoal || initialGoal;

  useEffect(() => {
    if (!isOpen) {
      setSelectedLaunchId(null);
      setIsCreating(false);
    }
  }, [isOpen]);

  if (!goal) return null;

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
            mode={mode}
            onBack={() => setSelectedLaunchId(null)}
          />
        ) : (
          <GoalOverview
            goal={goal}
            mode={mode}
            onSelectLaunch={(id) => setSelectedLaunchId(id)}
            onCreateNew={() => setIsCreating(true)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

// ==========================================
// 1. VIEW: LISTA DE LANÇAMENTOS (Overview)
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
  const sortedLaunches = [...(goal.launches || [])].sort(
    (a, b) => b.seq - a.seq
  );

  // Lógica de limite de lançamentos
  const maxAllowed = getMaxLaunches(goal.frequency);
  const currentCount = goal.launches?.length || 0;
  const canCreateMore = currentCount < maxAllowed;

  return (
    <>
      <SheetHeader className="px-6 py-6 bg-background border-b shadow-sm shrink-0">
        <div className="flex justify-between items-start gap-4">
          <div>
            <Badge variant="secondary" className="mb-2 uppercase">
              {goal.frequency}
            </Badge>
            <SheetTitle className="text-2xl font-bold text-primary">
              {goal.title}
            </SheetTitle>
            <SheetDescription className="mt-1 line-clamp-2">
              {goal.description}
            </SheetDescription>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-blue-600">
              {goal.progress}%
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">
              Progresso
            </p>
          </div>
        </div>
      </SheetHeader>

      <ScrollArea className="flex-1 px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-lg flex items-center gap-2 text-slate-800">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Lançamentos ({currentCount}/{maxAllowed})
          </h3>

          {mode === "launcher" && canCreateMore && (
            <Button size="sm" onClick={onCreateNew} className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" /> Novo Lançamento
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-3 pb-6">
          {sortedLaunches.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed rounded-2xl bg-slate-50 text-muted-foreground">
              <p className="text-sm">Nenhum lançamento registado.</p>
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
// 2. VIEW: FORMULÁRIO DE CRIAÇÃO
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
// 3. VIEW: DETALHES E EDIÇÃO (Linear)
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
              : newStatus === "approved"
              ? ""
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
