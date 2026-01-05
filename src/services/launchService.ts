import { db } from "@/lib/firebase/client";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { goalConverter } from "./goalService";
import type { FirestoreLaunch } from "@/types/launch";

// Função existente de atualização
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

    if (!goalSnap.exists()) {
      throw new Error("Meta não encontrada.");
    }

    const goalData = goalSnap.data();
    const launches = [...(goalData.launches || [])];
    const launchIndex = launches.findIndex((l) => l.id === launch_id);

    if (launchIndex === -1) {
      throw new Error("Lançamento não encontrado nesta meta.");
    }

    const updatedLaunch: FirestoreLaunch = {
      ...launches[launchIndex],
      status: updateData.status,
      updated_at: Timestamp.now(),
    };

    if (updateData.value !== undefined) updatedLaunch.value = updateData.value;
    if (updateData.note !== undefined) updatedLaunch.note = updateData.note;

    if (updateData.rejection_reason !== undefined) {
      updatedLaunch.rejection_reason = updateData.rejection_reason;
    }

    launches[launchIndex] = updatedLaunch;

    await updateDoc(goalRef, {
      launches: launches,
    });

    console.log(
      `Lançamento ${launch_id} atualizado para status: ${updateData.status}`
    );
  } catch (error) {
    console.error("Erro ao atualizar lançamento:", error);
    throw error;
  }
};

// --- NOVA FUNÇÃO DE CRIAÇÃO ---
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

    if (!goalSnap.exists()) {
      throw new Error("Meta não encontrada.");
    }

    const goalData = goalSnap.data();
    const currentLaunches = [...(goalData.launches || [])];

    // Gera um ID simples (em produção, uuid ou similar é melhor, mas random string serve)
    const newId = Math.random().toString(36).substr(2, 9);

    const newLaunch: FirestoreLaunch = {
      id: newId,
      seq: launchData.seq,
      value: launchData.value,
      note: launchData.note,
      status: launchData.status,
      updated_by: launchData.updated_by,
      // Datas geradas no servidor/serviço
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    };

    // Adiciona ao final do array
    currentLaunches.push(newLaunch);

    await updateDoc(goalRef, {
      launches: currentLaunches,
    });

    console.log(`Novo lançamento criado com sucesso! ID: ${newId}`);
  } catch (error) {
    console.error("Erro ao criar lançamento:", error);
    throw error;
  }
};
