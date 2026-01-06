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
  if (maxLaunches === 0) return 0;

  // Peso de cada lançamento (Ex: Meta de 30% com 2 lançamentos = 15% cada)
  const weightPerLaunch = goal.ppr_percentage / maxLaunches;

  let totalAttained = 0;

  // Preparação para metas numéricas (Cache da ordenação)
  let sortedLevels: { targetValue: number; percentage: number }[] = [];
  let isInverse = false; // true = quanto menor melhor (ex: acidentes)

  if (goal.input_type === "numeric" && goal.levels.length > 0) {
    // 1. Converter e ordenar por porcentagem CRESCENTE (0% -> 100%) para descobrir a direção
    const levelsByPercentage = [...goal.levels]
      .map((l) => ({
        targetValue: Number(l.targetValue),
        percentage: l.percentage,
      }))
      .sort((a, b) => a.percentage - b.percentage);

    // 2. Inferir Direção:
    // Se o alvo de menor % (ex: 20%) for MAIOR que o alvo de maior % (ex: 100%), é INVERSO.
    // Ex Inverso: 15 (20%) -> 10 (50%) -> 5 (100%). Aqui 15 > 5, então é inverso.
    if (levelsByPercentage.length >= 2) {
      const first = levelsByPercentage[0]; // Menor %
      const last = levelsByPercentage[levelsByPercentage.length - 1]; // Maior %
      isInverse = first.targetValue > last.targetValue;
    }

    // 3. Reordenar por porcentagem DECRESCENTE (100% -> 0%) para facilitar a verificação "waterfall"
    // Assim testamos se atingiu o máximo primeiro.
    sortedLevels = levelsByPercentage.sort((a, b) => b.percentage - a.percentage);
  }

  launches.forEach((launch) => {
    // Apenas lançamentos APROVADOS entram no cálculo financeiro
    if (launch.status === "approved") {
      let attainedPercentage = 0;

      if (goal.input_type === "numeric") {
        const val = Number(launch.value);

        // Verifica nos níveis (do maior % para o menor %)
        for (const level of sortedLevels) {
          const target = level.targetValue;

          if (isInverse) {
            // INVERSO: Para ganhar o %, o valor realizado deve ser MENOR ou IGUAL ao alvo
            // Ex: Alvo 5 (100%). Realizado 4. 4 <= 5? Sim. Ganha 100%.
            if (val <= target) {
              attainedPercentage = level.percentage;
              break; // Encontrou o maior nível possível, para.
            }
          } else {
            // PROPORCIONAL: Para ganhar o %, o valor realizado deve ser MAIOR ou IGUAL ao alvo
            // Ex: Alvo 15 (100%). Realizado 20. 20 >= 15? Sim. Ganha 100%.
            if (val >= target) {
              attainedPercentage = level.percentage;
              break; // Encontrou o maior nível possível, para.
            }
          }
        }
      } else {
        // LÓGICA DE OPÇÕES (Texto Exato)
        const matchedLevel = goal.levels.find(
          (level) => String(level.targetValue) === String(launch.value)
        );
        if (matchedLevel) {
          attainedPercentage = matchedLevel.percentage;
        }
      }

      // Converte a % do nível em % do PPR Real
      // Ex: Nível 50% * Peso 15% = 7.5% acumulado
      const attainedInLaunch = (attainedPercentage / 100) * weightPerLaunch;
      totalAttained += attainedInLaunch;
    }
  });

  // Arredonda para 2 casas
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
