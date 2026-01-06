import z from "zod";
import { HydratedUserProfileSchema } from "./user";
import { FirestoreSectorSchema } from "./sector";
import { Timestamp } from "firebase/firestore";
import { FirestoreLaunchSchema } from "./launch";

// 1. Tipos de Domínio da Meta
export type GoalStatus = "pending" | "in_progress" | "completed" | "canceled";
export type GoalPriority = "low" | "medium" | "high";
export type GoalFrequency = "mensal" | "trimestral" | "semestral";
export type GoalInputType = "numeric" | "options";

// 2. Interface de Atingimento (Níveis da Meta)
export interface AchievementLevel {
  targetValue: string | number;
  percentage: number;
}

// 3. Interface da Meta (Estrutura Principal)
export interface Goal {
  id: string;
  title: string;
  description?: string;
  status: GoalStatus;
  priority: GoalPriority;
  progress: number;
  deadline: string;
  frequency: GoalFrequency;
  inputType: GoalInputType;
  levels: AchievementLevel[];

  // IDs para relacionamentos no Firestore
  creatorId: string;
  responsibleId: string;
  launcherId: string;
  sectorId: string;
}

// 4. Schemas de Validação (Zod)
export const AchievementLevelSchema = z.object({
  targetValue: z.union([z.string(), z.number()]),
  percentage: z.number().min(0).max(100),
});

export const FirestoreGoalSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "canceled"]),
  reference: z.string().regex(/^\d{4}\/(01|02)$/),
  ppr_percentage: z.number().min(0),
  priority: z.enum(["low", "medium", "high"]),
  progress: z.number().min(0).max(100),
  deadline: z.instanceof(Timestamp),
  frequency: z.enum(["mensal", "trimestral", "semestral"]),
  launches: z.array(FirestoreLaunchSchema), // Importado de launch.ts

  input_type: z.enum(["numeric", "options"]),
  levels: z.array(AchievementLevelSchema),

  creator_id: z.string(),
  responsible_id: z.string(),
  launcher_id: z.string(),
  sector_id: z.string(),
});

// 5. Tipo "Hydrated" (Dados Populados para a UI)
export const HydratedGoalSchema = FirestoreGoalSchema.omit({
  creator_id: true,
  responsible_id: true,
  launcher_id: true,
  sector_id: true,
  launches: true,
}).extend({
  id: z.string(),
  creator: HydratedUserProfileSchema,
  responsible: HydratedUserProfileSchema,
  launcher: HydratedUserProfileSchema,
  sector: FirestoreSectorSchema,
  launches: z.array(FirestoreLaunchSchema),
});

export type FirestoreGoal = z.infer<typeof FirestoreGoalSchema>;
export type HydratedGoal = z.infer<typeof HydratedGoalSchema>;

// 6. Utilitários
export const getMaxLaunches = (freq: GoalFrequency): number => {
  switch (freq) {
    case "mensal":
      return 6;
    case "trimestral":
      return 2;
    case "semestral":
      return 1;
    default:
      return 0;
  }
};
