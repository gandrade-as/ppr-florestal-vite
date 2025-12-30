import { useState } from "react";
import { Plus, ExternalLink, AlertCircle, RotateCcw } from "lucide-react";
import {
  useGoalLaunches,
  useCreateLaunch,
  useUpdateLaunch,
} from "@/hooks/useLaunches";
import { type Goal, type Launch, getMaxLaunches } from "@/types/goal";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface GoalDetailsSheetProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
  readOnly?: boolean;
}

export function GoalDetailsSheet({
  goal,
  isOpen,
  onClose,
  readOnly = false,
}: GoalDetailsSheetProps) {
  const { data: launches } = useGoalLaunches(goal?.id || "", isOpen);
  const { mutate: createLaunch, isPending: isCreating } = useCreateLaunch();
  const { mutate: updateLaunch, isPending: isUpdating } = useUpdateLaunch();

  // Estados do Formulário
  const [editingId, setEditingId] = useState<string | null>(null);
  const [valValue, setValValue] = useState("");
  const [valNote, setValNote] = useState("");
  const [valEvidence, setValEvidence] = useState("");

  if (!goal) return null;

  const maxLaunches = getMaxLaunches(goal.frequency);
  const currentCount = launches?.length || 0;
  const canLaunch = !readOnly && currentCount < maxLaunches;
  const isSaving = isCreating || isUpdating;

  // Helper para formatar exibição (Dinheiro ou Texto)
  const formatValue = (val: string | number) => {
    if (typeof val === "number") {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(val);
    }
    return val;
  };

  // Função para carregar um rejeitado no formulário
  const handleEdit = (launch: Launch) => {
    setEditingId(launch.id);
    setValValue(String(launch.value));
    setValNote(launch.note || "");
    setValEvidence(launch.evidenceUrl || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setValValue("");
    setValNote("");
    setValEvidence("");
  };

  const handleSave = () => {
    if (!valValue || !valEvidence) return;

    // LÓGICA DE CORREÇÃO:
    // Se a meta é numérica, converte a string do input para Number.
    // Se é texto (opções), mantém como string.
    const finalValue =
      goal.inputType === "numeric" ? Number(valValue) : valValue;

    const payload = {
      value: finalValue,
      note: valNote,
      evidenceUrl: valEvidence,
      date: new Date().toISOString(),
    };

    if (editingId) {
      updateLaunch(
        {
          goalId: goal.id,
          launchId: editingId,
          data: payload,
        },
        { onSuccess: handleCancelEdit }
      );
    } else {
      createLaunch(
        {
          goalId: goal.id,
          data: payload,
        },
        { onSuccess: handleCancelEdit }
      );
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Mantive suas classes de largura customizada */}
      <SheetContent className="w-100 sm:w-135 flex flex-col h-full p-0 gap-0 overflow-y-auto">
        <SheetHeader className="px-6 pt-6 pb-4 bg-muted/5 border-b">
          <SheetTitle className="text-xl">{goal.title}</SheetTitle>

          {/* CORREÇÃO AQUI: Adicione 'asChild' */}
          <SheetDescription asChild>
            <div className="mt-2 text-xs text-muted-foreground">
              <span className="font-semibold block mb-1">
                Critérios de Avaliação:
              </span>
              <div className="flex gap-2 flex-wrap">
                {goal.levels?.map((level, idx) => (
                  <Badge key={idx} variant="outline" className="bg-background">
                    {formatValue(level.targetValue)}
                    <span className="ml-1 text-muted-foreground">
                      → {level.percentage}%
                    </span>
                  </Badge>
                ))}
                {!goal.levels?.length && (
                  <span className="text-muted-foreground">
                    Nenhum nível definido
                  </span>
                )}
              </div>
            </div>
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 h-full bg-slate-50/50">
          <div className="flex flex-col gap-6 p-6">
            {/* FORMULÁRIO */}
            {(canLaunch || editingId) && (
              <div
                className={cn(
                  "space-y-4 p-4 rounded-lg border shadow-sm transition-colors",
                  editingId ? "bg-orange-50 border-orange-200" : "bg-white"
                )}
              >
                <h4
                  className={cn(
                    "font-semibold text-sm flex items-center gap-2",
                    editingId ? "text-orange-700" : "text-primary"
                  )}
                >
                  {editingId ? (
                    <RotateCcw className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {editingId ? "Corrigir Lançamento" : "Novo Lançamento"}
                </h4>

                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        {goal.inputType === "numeric"
                          ? "Valor Atingido"
                          : "Resultado Obtido"}
                      </Label>

                      {/* RENDERIZAÇÃO CONDICIONAL: INPUT vs SELECT */}
                      {goal.inputType === "numeric" ? (
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={valValue}
                          onChange={(e) => setValValue(e.target.value)}
                          className="bg-background"
                        />
                      ) : (
                        <Select value={valValue} onValueChange={setValValue}>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {goal.levels?.map((level, idx) => (
                              <SelectItem
                                key={idx}
                                value={String(level.targetValue)}
                              >
                                {String(level.targetValue)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Link Comprobatório</Label>
                      <Input
                        placeholder="https://drive..."
                        value={valEvidence}
                        onChange={(e) => setValEvidence(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição / Defesa</Label>
                    <Input
                      placeholder="Explique este lançamento..."
                      value={valNote}
                      onChange={(e) => setValNote(e.target.value)}
                      className="bg-background"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving || !valValue || !valEvidence}
                      className="flex-1"
                    >
                      {isSaving
                        ? "Enviando..."
                        : editingId
                        ? "Reenviar para Análise"
                        : "Lançar"}
                    </Button>
                    {editingId && (
                      <Button variant="outline" onClick={handleCancelEdit}>
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* LISTA DE LANÇAMENTOS */}
            <div className="flex flex-col gap-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Lançamentos ({currentCount}/{maxLaunches})
              </h4>

              {launches?.map((launch) => (
                <div
                  key={launch.id}
                  className={cn(
                    "flex flex-col p-4 border rounded-lg bg-white shadow-sm transition-all",
                    launch.status === "rejected" &&
                      "border-red-200 bg-red-50/50"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <span className="font-bold text-lg text-foreground">
                        {/* Formatação Inteligente */}
                        {formatValue(launch.value)}
                      </span>
                      <a
                        href={launch.evidenceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                      >
                        <ExternalLink className="h-3 w-3" /> Ver Documento
                      </a>
                    </div>

                    <Badge
                      variant={
                        launch.status === "approved"
                          ? "default"
                          : launch.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {launch.status === "approved" && "Deferido"}
                      {launch.status === "rejected" && "Indeferido"}
                      {launch.status === "pending" && "Em Análise"}
                    </Badge>
                  </div>

                  {launch.note && (
                    <p className="text-sm text-muted-foreground italic mb-2">
                      "{launch.note}"
                    </p>
                  )}

                  {launch.status === "rejected" && (
                    <div className="mt-2 pt-2 border-t border-red-200">
                      <div className="flex items-start gap-2 text-red-700 text-sm mb-2">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span className="font-medium">
                          Motivo:{" "}
                          {launch.rejectionReason || "Não especificado."}
                        </span>
                      </div>
                      {!readOnly && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-red-300 text-red-700 hover:bg-red-100"
                          onClick={() => handleEdit(launch)}
                        >
                          Corrigir e Reenviar
                        </Button>
                      )}
                    </div>
                  )}

                  {launch.status !== "rejected" && (
                    <div className="mt-2 text-[10px] text-muted-foreground text-right">
                      Enviado em:{" "}
                      {new Date(launch.createdAt).toLocaleDateString("pt-BR")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
