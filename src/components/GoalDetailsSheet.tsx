import { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  FileText,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  Plus,
  Calendar,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { z } from "zod";
import { Timestamp } from "firebase/firestore";

// Hooks e Contextos
import { useAddLaunchMessage } from "@/hooks/useLaunches";
import { useGoal } from "@/hooks/useGoals";

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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Tipos
import type { HydratedGoal } from "@/types/goal";
import type { LauncherMessageSchema, AuditMessageSchema } from "@/types/launch";
import { useUserProfile } from "@/hooks/useUserProfile";

// Tipos Inferidos
type LauncherMessage = z.infer<typeof LauncherMessageSchema>;
type AuditMessage = z.infer<typeof AuditMessageSchema>;

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

  const { data: freshGoal } = useGoal(initialGoal?.id);
  const goal = freshGoal || initialGoal;

  useEffect(() => {
    if (!isOpen) setSelectedLaunchId(null);
  }, [isOpen, goal?.id]);

  if (!goal) return null;

  const selectedLaunch = goal.launches?.find((l) => l.id === selectedLaunchId);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:w-135 p-0 flex flex-col h-full bg-slate-50/50 z-50">
        {selectedLaunchId && selectedLaunch ? (
          <LaunchThread
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
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

// ============================================================================
// 1. VIEW: VISÃO GERAL DA META (Lista de Lançamentos)
// ============================================================================

interface GoalOverviewProps {
  goal: HydratedGoal;
  mode: SheetMode;
  onSelectLaunch: (id: string) => void;
}

function GoalOverview({ goal, mode, onSelectLaunch }: GoalOverviewProps) {
  const sortedLaunches = [...(goal.launches || [])].sort(
    (a, b) => b.seq - a.seq
  );

  const canCreateLaunch = mode !== "readonly";

  return (
    <>
      <SheetHeader className="px-6 py-6 bg-background border-b shadow-sm z-10 shrink-0">
        <div className="flex justify-between items-start gap-2">
          <div>
            <Badge variant="secondary" className="mb-2">
              {goal.frequency.toUpperCase()}
            </Badge>
            <SheetTitle className="text-2xl font-bold text-primary">
              {goal.title}
            </SheetTitle>
            <SheetDescription className="mt-1 text-sm">
              {goal.description}
            </SheetDescription>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-2xl font-bold text-blue-600">
              {goal.progress}%
            </div>
            <span className="text-[10px] uppercase text-muted-foreground font-semibold">
              Progresso
            </span>
          </div>
        </div>
      </SheetHeader>

      {/* CORREÇÃO AQUI: Adicionado min-h-0 */}
      <ScrollArea className="flex-1 min-h-0 px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Histórico de Lançamentos
          </h3>

          {canCreateLaunch && (
            <Button
              size="sm"
              className="gap-1"
              onClick={() => console.log("Abrir modal de criação (TODO)")}
            >
              <Plus className="h-4 w-4" />
              Novo Lançamento
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-3 pb-6">
          {sortedLaunches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed rounded-xl bg-slate-50">
              <div className="bg-slate-100 p-3 rounded-full mb-3">
                <FileText className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-muted-foreground font-medium">
                Nenhum lançamento registrado.
              </p>
              {canCreateLaunch && (
                <p className="text-xs text-muted-foreground mt-1">
                  Clique em "Novo Lançamento" para iniciar.
                </p>
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
  launch: any;
  inputType: string;
  onClick: () => void;
}) {
  const statusConfig = {
    pending: {
      label: "Em Análise",
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    },
    approved: {
      label: "Deferido",
      className: "bg-green-100 text-green-700 border-green-200",
    },
    rejected: {
      label: "Indeferido",
      className: "bg-red-100 text-red-700 border-red-200",
    },
  };

  const status =
    statusConfig[launch.status as keyof typeof statusConfig] ||
    statusConfig.pending;

  const lastMsg =
    Array.isArray(launch.thread) && launch.thread.length > 0
      ? launch.thread[launch.thread.length - 1]
      : null;

  const lastMsgContent =
    lastMsg && "content" in lastMsg ? lastMsg.content : "Atualização de status";

  const displayValue =
    launch.last_achievement_level !== undefined
      ? launch.last_achievement_level
      : lastMsg?.achievement_level;

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group border-slate-200"
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 text-sm">
              #{launch.seq}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-semibold border",
                status.className
              )}
            >
              {status.label}
            </Badge>
          </div>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(launch.created_at?.toDate() || new Date(), "dd/MM/yyyy")}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="bg-slate-100 p-1.5 rounded text-slate-600">
            <DollarSign className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-bold">
              Valor Lançado
            </p>
            <p className="font-semibold text-lg text-slate-800">
              {inputType === "numeric"
                ? new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(displayValue || 0))
                : displayValue ?? "—"}
            </p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground line-clamp-1 border-t pt-2 mt-2 flex justify-between items-center group-hover:text-blue-600 transition-colors">
          <span>{lastMsgContent}</span>
          <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// 2. VIEW: THREAD DO LANÇAMENTO (Chat Detalhado)
// ============================================================================

interface LaunchThreadProps {
  launch: any;
  goal: HydratedGoal;
  mode: SheetMode;
  onBack: () => void;
}

function LaunchThread({ launch, goal, mode, onBack }: LaunchThreadProps) {
  const { data: user } = useUserProfile();
  const { mutate: sendMessage, isPending } = useAddLaunchMessage();

  const [newMessage, setNewMessage] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<
    string | number | undefined
  >(launch.last_achievement_level || undefined);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [launch.thread?.length]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    if (mode === "launcher" && selectedLevel === undefined) {
      alert("Por favor, selecione o nível de atingimento atual.");
      return;
    }

    const messagePayload = {
      sender_name: user?.name || "Usuário",
      achievement_level: selectedLevel!,
      content: newMessage,
      timestamp: Timestamp.now(),
      attachments: [],
    };

    sendMessage(
      {
        goalId: goal.id,
        launchId: launch.id,
        message: messagePayload,
        newLevel: selectedLevel!,
      },
      {
        onSuccess: () => {
          setNewMessage("");
        },
        onError: (error) => {
          console.error("Erro ao enviar:", error);
          alert("Erro ao enviar mensagem. Tente novamente.");
        },
      }
    );
  };

  const handleEvaluate = (status: "approved" | "rejected") => {
    console.log("Avaliando:", status, "Justificativa:", newMessage);
    setNewMessage("");
  };

  return (
    <>
      <div className="px-4 py-3 bg-background border-b shadow-sm z-10 flex items-center gap-3 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0 -ml-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h4 className="font-bold text-sm">Lançamento #{launch.seq}</h4>
          <p className="text-xs text-muted-foreground truncate max-w-50">
            {goal.title}
          </p>
        </div>
        <Badge variant="outline" className="bg-slate-50">
          {launch.status === "approved"
            ? "Deferido"
            : launch.status === "rejected"
            ? "Indeferido"
            : "Em Análise"}
        </Badge>
      </div>

      {/* CORREÇÃO AQUI: Adicionado min-h-0 */}
      <ScrollArea className="flex-1 min-h-0 px-4 py-6 bg-slate-50/50">
        <div className="flex flex-col gap-4 pb-4">
          {launch.thread?.map((msg: any, idx: number) => {
            const isAuditMsg = "status" in msg;
            let isSelf = false;

            if (mode === "launcher" && !isAuditMsg) isSelf = true;
            if (mode === "evaluator" && isAuditMsg) isSelf = true;

            return isAuditMsg ? (
              <AuditBubble
                key={idx}
                message={msg as AuditMessage}
                isSelf={isSelf}
              />
            ) : (
              <LauncherBubble
                key={idx}
                message={msg as LauncherMessage}
                isSelf={isSelf}
              />
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {mode !== "readonly" && (
        <div className="p-4 bg-background border-t mt-auto space-y-3 shrink-0">
          {mode === "launcher" && (
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border">
              <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap pl-1">
                Atingimento Atual:
              </span>

              {goal.input_type === "numeric" ? (
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                    R$
                  </span>
                  <Input
                    type="number"
                    placeholder="0,00"
                    className="h-8 pl-8 bg-white"
                    value={selectedLevel as number}
                    onChange={(e) => setSelectedLevel(Number(e.target.value))}
                  />
                </div>
              ) : (
                <Select
                  value={
                    selectedLevel !== undefined
                      ? String(selectedLevel)
                      : undefined
                  }
                  onValueChange={(val) => setSelectedLevel(val)}
                >
                  <SelectTrigger className="h-8 bg-white flex-1">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>

                  <SelectContent className="z-60">
                    {goal.levels.map((level, idx) => (
                      <SelectItem key={idx} value={String(level.targetValue)}>
                        {level.targetValue} ({level.percentage}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="relative flex gap-2 items-end">
            <Input
              placeholder={
                mode === "evaluator"
                  ? "Escreva uma justificativa..."
                  : "Adicione um comentário..."
              }
              className="flex-1 h-12 py-3 bg-slate-50"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={isPending}
            />

            {mode === "launcher" && (
              <Button
                size="icon"
                className="h-12 w-12"
                onClick={handleSendMessage}
                disabled={!newMessage || isPending}
              >
                {isPending ? (
                  <span className="animate-spin text-xs">...</span>
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>

          {mode === "evaluator" && (
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
                onClick={() => handleEvaluate("approved")}
              >
                <ThumbsUp className="h-4 w-4" /> Aprovar
              </Button>
              <Button
                variant="destructive"
                className="flex-1 gap-2"
                onClick={() => handleEvaluate("rejected")}
              >
                <ThumbsDown className="h-4 w-4" /> Reprovar
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleSendMessage}
                title="Apenas Comentar"
                disabled={isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function LauncherBubble({
  message,
  isSelf,
}: {
  message: LauncherMessage;
  isSelf: boolean;
}) {
  const date =
    message.timestamp && typeof message.timestamp.toDate === "function"
      ? message.timestamp.toDate()
      : new Date();
  return (
    <div
      className={cn(
        "flex gap-3 max-w-[90%]",
        isSelf ? "ml-auto flex-row-reverse" : ""
      )}
    >
      <Avatar className="h-8 w-8 mt-1 border">
        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
          {message.sender_name.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "flex flex-col p-3 rounded-2xl shadow-sm text-sm min-w-50",
          isSelf
            ? "bg-blue-600 text-white rounded-tr-none"
            : "bg-white border rounded-tl-none"
        )}
      >
        <div className="flex justify-between items-baseline gap-4 mb-1">
          <span
            className={cn(
              "font-bold text-xs",
              isSelf ? "text-blue-100" : "text-slate-700"
            )}
          >
            {message.sender_name}
          </span>
          <span
            className={cn(
              "text-[10px]",
              isSelf ? "text-blue-200" : "text-slate-400"
            )}
          >
            {format(date, "HH:mm", { locale: ptBR })}
          </span>
        </div>
        <div
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 rounded mb-2 w-fit text-xs font-semibold",
            isSelf ? "bg-blue-700/50 text-white" : "bg-slate-100 text-slate-700"
          )}
        >
          <FileText className="h-3 w-3" /> Resultado:{" "}
          {message.achievement_level}
        </div>
        <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/20">
            <p className="text-xs opacity-80 flex items-center gap-1">
              <Paperclip className="h-3 w-3" /> {message.attachments.length}{" "}
              anexo(s)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function AuditBubble({
  message,
  isSelf,
}: {
  message: AuditMessage;
  isSelf: boolean;
}) {
  const isApproved = message.status === "approved";
  const date =
    message.timestamp && typeof message.timestamp.toDate === "function"
      ? message.timestamp.toDate()
      : new Date();
  return (
    <div className={cn("flex max-w-[90%] my-1", isSelf ? "ml-auto" : "")}>
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl border shadow-sm text-sm w-full",
          isApproved
            ? "bg-green-50 border-green-200 text-green-900"
            : "bg-red-50 border-red-200 text-red-900"
        )}
      >
        {isApproved ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 shrink-0 text-red-600" />
        )}
        <div className="flex flex-col">
          <span className="font-semibold flex items-center gap-2">
            {isApproved ? "Lançamento Deferido" : "Lançamento Indeferido"}
            <span className="text-[10px] font-normal opacity-60">
              {format(date, "dd/MM - HH:mm")}
            </span>
          </span>
          <span className="text-xs opacity-80 mt-0.5">
            por {message.sender_name}
          </span>
        </div>
      </div>
    </div>
  );
}
