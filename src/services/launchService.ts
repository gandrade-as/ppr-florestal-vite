import { db } from "@/lib/firebase/client";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { goalConverter } from "./goalService";
import { getMaxLaunches } from "@/types/goal";
import type { FirestoreLaunch } from "@/types/launch";
import type { FirestoreGoal, GoalFrequency } from "@/types/goal"; // Importe o tipo da meta

// --- NOVA LÓGICA DE CÁLCULO DE PPR ---
const calculatePprAttained = (
  goal: FirestoreGoal,
  launches: FirestoreLaunch[]
): number => {
  const maxLaunches = getMaxLaunches(goal.frequency);

  // Se não houver lançamentos previstos, retorna 0 para evitar divisão por zero
  if (maxLaunches === 0) return 0;

  // 1. Peso de CADA lançamento (Ex: Meta vale 30%, Trimestral (2 lançamentos) -> 15% por lançamento)
  const weightPerLaunch = goal.ppr_percentage / maxLaunches;

  let totalAttained = 0;

  launches.forEach((launch) => {
    // Só calculamos valor para lançamentos APROVADOS
    if (launch.status === "approved") {
      // Encontrar o nível correspondente ao valor lançado
      // Como pedido, focando em "options" (comparação exata de string)
      const matchedLevel = goal.levels.find(
        (level) => String(level.targetValue) === String(launch.value)
      );

      if (matchedLevel) {
        // Ex: Nível "Sim" vale 100%
        // Cálculo: (100% / 100) * 15% = 15% atingido neste lançamento
        const attainedInThisLaunch =
          (matchedLevel.percentage / 100) * weightPerLaunch;
        totalAttained += attainedInThisLaunch;
      }
    }
  });

  // Retorna o valor arredondado para 2 casas decimais para evitar flutuação (ex: 14.99999)
  return Math.round(totalAttained * 100) / 100;
};

// --- CÁLCULO DE PROGRESSO VISUAL (Opcional: Barra de progresso baseada em tarefas) ---
// Mantemos essa função auxiliar apenas para atualizar a barra "visual" de quantos lançamentos foram feitos
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

    // 1. Calcular o novo PPR Atingido
    const newPprAttained = calculatePprAttained(goalData, currentLaunches);

    // 2. Calcular progresso visual (tarefas)
    const newProgress = calculateTaskProgress(
      currentLaunches,
      goalData.frequency
    );

    await updateDoc(goalRef, {
      launches: currentLaunches,
      progress: newProgress, // Barra de progresso (visual)
      ppr_attained: newPprAttained, // Valor financeiro/percentual real (NOVO)
    });

    console.log(
      `Lançamento criado. PPR Atingido: ${newPprAttained}% de ${goalData.ppr_percentage}%`
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

    // 1. Recalcular o PPR Atingido com base nos novos status/valores
    const newPprAttained = calculatePprAttained(goalData, launches);

    // 2. Recalcular progresso visual
    const newProgress = calculateTaskProgress(launches, goalData.frequency);

    await updateDoc(goalRef, {
      launches: launches,
      progress: newProgress,
      ppr_attained: newPprAttained, // Atualiza o valor no banco
    });

    console.log(`Lançamento atualizado. PPR Atingido: ${newPprAttained}%`);
  } catch (error) {
    console.error("Erro ao atualizar lançamento:", error);
    throw error;
  }
};
