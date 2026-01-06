import { db } from "@/lib/firebase/client";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { goalConverter } from "./goalService";
import { getMaxLaunches, type GoalStatus } from "@/types/goal";
import type { FirestoreLaunch } from "@/types/launch";
import type { FirestoreGoal, GoalFrequency } from "@/types/goal";

// --- NOVA LÓGICA DE CÁLCULO DE PPR ---
const calculatePprAttained = (
  goal: FirestoreGoal,
  launches: FirestoreLaunch[]
): number => {
  const maxLaunches = getMaxLaunches(goal.frequency);
  if (maxLaunches === 0) return 0;

  // Peso de cada lançamento (Ex: Meta de 30% com 2 lançamentos = 15% cada)
  const weightPerLaunch = goal.ppr_percentage / maxLaunches;

  let totalAttained = 0;

  // Preparação para metas numéricas (Cache da ordenação)
  let sortedLevels: { targetValue: number; percentage: number }[] = [];
  let isInverse = false; // true = quanto menor melhor (ex: acidentes)

  if (goal.input_type === "numeric" && goal.levels.length > 0) {
    // 1. Converter e ordenar por porcentagem CRESCENTE
    const levelsByPercentage = [...goal.levels]
      .map((l) => ({
        targetValue: Number(l.targetValue),
        percentage: l.percentage,
      }))
      .sort((a, b) => a.percentage - b.percentage);

    // 2. Inferir Direção
    if (levelsByPercentage.length >= 2) {
      const first = levelsByPercentage[0]; // Menor %
      const last = levelsByPercentage[levelsByPercentage.length - 1]; // Maior %
      isInverse = first.targetValue > last.targetValue;
    }

    // 3. Reordenar por porcentagem DECRESCENTE para verificação "waterfall"
    sortedLevels = levelsByPercentage.sort(
      (a, b) => b.percentage - a.percentage
    );
  }

  launches.forEach((launch) => {
    // Apenas lançamentos APROVADOS entram no cálculo financeiro
    if (launch.status === "approved") {
      let attainedPercentage = 0;

      if (goal.input_type === "numeric") {
        const val = Number(launch.value);

        for (const level of sortedLevels) {
          const target = level.targetValue;

          if (isInverse) {
            if (val <= target) {
              attainedPercentage = level.percentage;
              break;
            }
          } else {
            if (val >= target) {
              attainedPercentage = level.percentage;
              break;
            }
          }
        }
      } else {
        // LÓGICA DE OPÇÕES
        const matchedLevel = goal.levels.find(
          (level) => String(level.targetValue) === String(launch.value)
        );
        if (matchedLevel) {
          attainedPercentage = matchedLevel.percentage;
        }
      }

      const attainedInLaunch = (attainedPercentage / 100) * weightPerLaunch;
      totalAttained += attainedInLaunch;
    }
  });

  return Math.round(totalAttained * 100) / 100;
};

// --- CÁLCULO DE PROGRESSO VISUAL ---
const calculateTaskProgress = (
  launches: FirestoreLaunch[],
  frequency: GoalFrequency
): number => {
  const maxLaunches = getMaxLaunches(frequency);
  if (maxLaunches === 0) return 0;

  let score = 0;
  launches.forEach((launch) => {
    if (launch.status === "approved") score += 1;
    else if (launch.status === "pending") score += 0.5;
  });

  const progress = (score / maxLaunches) * 100;
  return Math.min(Math.round(progress), 100);
};

// --- NOVA FUNÇÃO: DETERMINAR STATUS DA META ---
const determineNewGoalStatus = (
  currentStatus: GoalStatus,
  launches: FirestoreLaunch[],
  newProgress: number
): GoalStatus => {
  // 1. Se estiver cancelada, geralmente mantemos cancelada (a menos que haja reativação explícita)
  if (currentStatus === "canceled") return "canceled";

  // 2. Verifica se está Concluída
  // Regra: Progresso 100% E todos os lançamentos aprovados.
  // Nota: calculateTaskProgress só retorna 100 se score == maxLaunches.
  // Como 'pending' vale 0.5, é matematicamente possível ter 100% sem tudo aprovado
  // se houver mais lançamentos que o max, mas assumindo integridade:
  const allApproved = launches.every((l) => l.status === "approved");

  if (newProgress >= 100 && allApproved) {
    return "completed";
  }

  // 3. Verifica se está Em Andamento
  // Regra: Se tem pelo menos um lançamento e não está concluída.
  if (launches.length > 0) {
    return "in_progress";
  }

  // 4. Caso contrário, Pendente (sem lançamentos)
  return "pending";
};

// --- CREATE ---
export const createLaunchInFirestore = async (
  goal_id: string,
  launchData: {
    seq: number;
    value: string | number;
    note?: string;
    status: "pending" | "approved" | "rejected";
    updated_by: string;
  }
): Promise<void> => {
  try {
    const goalRef = doc(db, "goals", goal_id).withConverter(goalConverter);
    const goalSnap = await getDoc(goalRef);

    if (!goalSnap.exists()) throw new Error("Meta não encontrada.");

    const goalData = goalSnap.data();
    const currentLaunches = [...(goalData.launches || [])];
    const newId = Math.random().toString(36).substr(2, 9);

    const newLaunch: FirestoreLaunch = {
      id: newId,
      seq: launchData.seq,
      value: launchData.value,
      status: launchData.status,
      updated_by: launchData.updated_by,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    };

    if (launchData.note) {
      newLaunch.note = launchData.note;
    }

    currentLaunches.push(newLaunch);

    // 1. Cálculos de métricas
    const newPprAttained = calculatePprAttained(goalData, currentLaunches);
    const newProgress = calculateTaskProgress(
      currentLaunches,
      goalData.frequency
    );

    // 2. Determinar novo Status da Meta
    // Se era 'pending' e adicionou um lançamento, vira 'in_progress' automaticamente
    const newStatus = determineNewGoalStatus(
      goalData.status,
      currentLaunches,
      newProgress
    );

    await updateDoc(goalRef, {
      launches: currentLaunches,
      progress: newProgress,
      ppr_attained: newPprAttained,
      status: newStatus, // Atualiza o status
    });

    console.log(
      `Lançamento criado. Status: ${newStatus}. Progresso: ${newProgress}%`
    );
  } catch (error) {
    console.error("Erro ao criar lançamento:", error);
    throw error;
  }
};

// --- UPDATE ---
export const updateLaunchInFirestore = async (
  goal_id: string,
  launch_id: string,
  updateData: {
    value?: string | number;
    note?: string;
    status: "pending" | "approved" | "rejected";
    rejection_reason?: string;
  }
): Promise<void> => {
  try {
    const goalRef = doc(db, "goals", goal_id).withConverter(goalConverter);
    const goalSnap = await getDoc(goalRef);

    if (!goalSnap.exists()) throw new Error("Meta não encontrada.");

    const goalData = goalSnap.data();
    const launches = [...(goalData.launches || [])];
    const launchIndex = launches.findIndex((l) => l.id === launch_id);

    if (launchIndex === -1) throw new Error("Lançamento não encontrado.");

    const updatedLaunch: FirestoreLaunch = {
      ...launches[launchIndex],
      status: updateData.status,
      updated_at: Timestamp.now(),
    };

    if (updateData.value !== undefined) updatedLaunch.value = updateData.value;
    if (updateData.note !== undefined) updatedLaunch.note = updateData.note;

    if (updateData.rejection_reason) {
      updatedLaunch.rejection_reason = updateData.rejection_reason;
    } else if (
      updateData.status === "approved" ||
      updateData.status === "pending"
    ) {
      delete updatedLaunch.rejection_reason;
    }

    launches[launchIndex] = updatedLaunch;

    // 1. Cálculos de métricas
    const newPprAttained = calculatePprAttained(goalData, launches);
    const newProgress = calculateTaskProgress(launches, goalData.frequency);

    // 2. Determinar novo Status da Meta
    // Aqui verifica se a aprovação completou a meta ou se uma reprovação voltou para 'in_progress'
    const newStatus = determineNewGoalStatus(
      goalData.status,
      launches,
      newProgress
    );

    await updateDoc(goalRef, {
      launches: launches,
      progress: newProgress,
      ppr_attained: newPprAttained,
      status: newStatus, // Atualiza o status
    });

    console.log(`Lançamento atualizado. Status da Meta: ${newStatus}`);
  } catch (error) {
    console.error("Erro ao atualizar lançamento:", error);
    throw error;
  }
};
