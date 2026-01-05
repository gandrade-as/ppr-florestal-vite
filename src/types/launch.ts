import { Timestamp } from "firebase/firestore";
import z from "zod";

/**
 * Schema principal do Lançamento (Modelo Linear).
 * Removido o histórico de mensagens (thread) para simplificar o fluxo de
 * lançamento, edição e aprovação.
 */
export const FirestoreLaunchSchema = z.object({
  id: z.string(),
  seq: z.number(), // Número sequencial (ex: #1, #2)

  // Dados do Lançamento
  value: z.union([z.string(), z.number()]), // Valor atingido
  note: z.string().optional(), // Comentário do lançador

  // Estado e Auditoria
  status: z.enum(["pending", "approved", "rejected"]), // Fluxo linear
  rejection_reason: z.string().optional(), // Justificativa do avaliador

  // Metadados
  updated_by: z.string(), // Nome/ID de quem fez a última alteração
  created_at: z.instanceof(Timestamp),
  updated_at: z.instanceof(Timestamp),
});

// Tipo inferido para uso no TypeScript
export type FirestoreLaunch = z.infer<typeof FirestoreLaunchSchema>;
