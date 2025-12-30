import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  Scale,
} from "lucide-react";
import { usePendingLaunches, useEvaluateLaunch } from "@/hooks/useLaunches";
import type { PendingLaunch, GoalInputType } from "@/types/goal";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // npx shadcn@latest add textarea

export default function EvaluationPage() {
  const { data: pendingItems, isLoading } = usePendingLaunches();

  if (isLoading) return <div className="p-10">Carregando auditoria...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Scale className="h-8 w-8 text-primary" />
          Auditoria de Lançamentos
        </h2>
        <p className="text-muted-foreground">
          Analise, defira ou indefira os lançamentos realizados pela equipe.
        </p>
      </div>

      {!pendingItems?.length ? (
        <div className="flex flex-col items-center justify-center h-60 border-2 border-dashed rounded-lg bg-muted/10">
          <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
          <h3 className="font-semibold text-lg">Tudo limpo!</h3>
          <p className="text-muted-foreground">
            Não há lançamentos pendentes de análise.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {pendingItems.map((item) => (
            <EvaluationCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTE: CARD DE AVALIAÇÃO ---

function EvaluationCard({ item }: { item: PendingLaunch }) {
  const { mutate: evaluate, isPending } = useEvaluateLaunch();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  // Helper de formatação
  const formatValue = (val: string | number, type: GoalInputType) => {
    if (type === "numeric" && typeof val === "number") {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(val);
    }
    return val;
  };

  const handleApprove = () => {
    if (confirm("Tem certeza que deseja deferir este lançamento?")) {
      evaluate({ launchId: item.id, goalId: item.goalId, status: "approved" });
    }
  };

  const handleReject = () => {
    if (!reason) return;
    evaluate(
      {
        launchId: item.id,
        goalId: item.goalId,
        status: "rejected",
        rejectionReason: reason,
      },
      {
        onSuccess: () => {
          setRejectOpen(false);
          setReason("");
        },
      }
    );
  };

  return (
    <>
      <Card className="flex flex-col border-l-4 border-l-yellow-400">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <Badge
              variant="secondary"
              className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
            >
              Pendente
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(item.createdAt).toLocaleDateString("pt-BR")}
            </span>
          </div>
          <CardTitle className="text-base font-medium text-muted-foreground mt-2">
            {item.goalTitle}
          </CardTitle>
          <div className="text-2xl font-bold text-foreground mt-1">
            {formatValue(item.value, item.goalInputType)}
          </div>
        </CardHeader>

        <CardContent className="flex-1 pb-4 text-sm">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium text-foreground">Autor:</span>{" "}
              {item.authorName}
            </div>

            {item.note && (
              <div className="bg-muted p-2 rounded-md italic text-xs border">
                "{item.note}"
              </div>
            )}

            <a
              href={item.evidenceUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:underline p-2 bg-blue-50 rounded-md border border-blue-100 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Ver Documentação Anexa
            </a>
          </div>
        </CardContent>

        <CardFooter className="pt-2 gap-2 border-t bg-muted/10 p-4">
          <Button
            variant="outline"
            className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
            onClick={() => setRejectOpen(true)}
            disabled={isPending}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Indeferir
          </Button>

          <Button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={handleApprove}
            disabled={isPending}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Deferir
          </Button>
        </CardFooter>
      </Card>

      {/* MODAL DE INDEFERIMENTO */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Indeferir Lançamento</DialogTitle>
            <DialogDescription>
              Por favor, explique o motivo da rejeição para que o colaborador
              possa corrigir.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="reason" className="mb-2 block">
              Motivo / Feedback
            </Label>
            <Textarea
              id="reason"
              placeholder="Ex: O documento anexado está ilegível..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!reason || isPending}
            >
              {isPending ? "Processando..." : "Confirmar Indeferimento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
