export type GoalStatus = "pending" | "in_progress" | "completed" | "canceled";
export type GoalPriority = "low" | "medium" | "high";
export type GoalFrequency = "mensal" | "trimestral" | "semestral";
export type GoalInputType = "numeric" | "options";

export interface AchievementLevel {
  targetValue: string | number;
  percentage: number;
}

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

  // OS TRÊS PAPÉIS DO SISTEMA
  creatorId: string; // Quem criou
  creatorName?: string; // (Facilitador para UI)

  responsibleId: string; // O DONO DA META (Filtro da pág Minhas Metas)
  responsibleName?: string;

  launcherId: string; // Quem pode lançar dados
  launcherName?: string;
}

export type LaunchStatus = "pending" | "approved" | "rejected";

export interface Launch {
  id: string;
  date: string; // ISO String
  value: string | number; // O valor atingido/lançado
  note?: string; // Observação opcional

  evidenceUrl: string; // Link da documentação
  status: LaunchStatus;
  rejectionReason?: string;

  authorName: string; // Quem lançou
  createdAt: string;
}

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
