import { db } from "@/lib/firebase/client";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { goalConverter } from "./goalService";
import type { FirestoreLaunch, LauncherMessage } from "@/types/launch";

export const updateLaunchInFirestore = async (
  goal_id: string,
  launch_id: string,
  updateData: {
    last_achievement_level?: string | number;
    newMessage?: LauncherMessage;
    status?: "pending" | "approved"; 
  }
): Promise<void> => {
  try {
    const goalRef = doc(db, "goals", goal_id).withConverter(goalConverter);
    const goalSnap = await getDoc(goalRef);

    if (!goalSnap.exists()) {
      throw new Error("Meta não encontrada.");
    }

    const goalData = goalSnap.data();
    const launches = goalData.launches || [];

    const launchIndex = launches.findIndex((l) => l.id === launch_id);

    if (launchIndex === -1) {
      throw new Error("Lançamento não encontrado nesta meta.");
    }

    const currentLaunch = launches[launchIndex];

    const updatedLaunch: FirestoreLaunch = {
      ...currentLaunch,
      updated_at: Timestamp.now(), 
    };

    if (updateData.last_achievement_level !== undefined) {
      updatedLaunch.last_achievement_level = updateData.last_achievement_level;
    }

    if (updateData.newMessage) {
      updatedLaunch.thread = [
        ...(updatedLaunch.thread || []),
        updateData.newMessage,
      ];
    }

    if (updateData.status) {
      updatedLaunch.status = updateData.status;
    }

    launches[launchIndex] = updatedLaunch;

    await updateDoc(goalRef, {
      launches: launches,
    });

    console.log(`Lançamento ${launch_id} atualizado com sucesso!`);
  } catch (error) {
    console.error("Erro ao atualizar lançamento:", error);
    throw error;
  }
};
