import { db } from "@/lib/firebase/client";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { goalConverter } from "./goalService";
import { getMaxLaunches, type GoalFrequency } from "@/types/goal";
import type { FirestoreLaunch } from "@/types/launch";

// --- CÁLCULO DE PROGRESSO ---
const calculateProgress = (
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

    // CORREÇÃO: Não definir rejection_reason como undefined
    const newLaunch: FirestoreLaunch = {
      id: newId,
      seq: launchData.seq,
      value: launchData.value,
      status: launchData.status,
      updated_by: launchData.updated_by,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    };

    // Adiciona nota apenas se existir (evita undefined)
    if (launchData.note) {
      newLaunch.note = launchData.note;
    }

    currentLaunches.push(newLaunch);

    const newProgress = calculateProgress(currentLaunches, goalData.frequency);

    await updateDoc(goalRef, {
      launches: currentLaunches,
      progress: newProgress,
    });

    console.log(`Lançamento criado com sucesso! ID: ${newId}`);
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

    // Atualiza valores se existirem
    if (updateData.value !== undefined) updatedLaunch.value = updateData.value;
    if (updateData.note !== undefined) updatedLaunch.note = updateData.note;

    // CORREÇÃO: Lógica para limpar ou definir rejection_reason
    if (updateData.rejection_reason) {
      // Se veio uma razão (rejeição), salvamos
      updatedLaunch.rejection_reason = updateData.rejection_reason;
    } else if (
      updateData.status === "approved" ||
      updateData.status === "pending"
    ) {
      // Se foi aprovado ou reenviado, REMOVEMOS o campo usando delete
      delete updatedLaunch.rejection_reason;
    }

    launches[launchIndex] = updatedLaunch;

    const newProgress = calculateProgress(launches, goalData.frequency);

    await updateDoc(goalRef, {
      launches: launches,
      progress: newProgress,
    });

    console.log(`Lançamento atualizado. Novo Progresso: ${newProgress}%`);
  } catch (error) {
    console.error("Erro ao atualizar lançamento:", error);
    throw error;
  }
};
