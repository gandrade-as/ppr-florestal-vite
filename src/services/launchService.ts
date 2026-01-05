import type { HydratedGoal } from "@/types/goal";
import { fetchGoalFromFirestore } from "./goalService";

export const updateLaunchInFirestore = async (
  goal_id: string,
  launch_id: string
): Promise<HydratedGoal> => {
  try {
    const goal = await fetchGoalFromFirestore(goal_id);

    
  } catch (error) {
    console.error("Erro no fetchGoalFromFirestore:", error);
    throw error;
  }
};