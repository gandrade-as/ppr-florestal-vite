import { db } from "@/lib/firebase/client";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  QueryDocumentSnapshot,
  updateDoc,
  where,
  type FirestoreDataConverter,
  type SnapshotOptions,
} from "firebase/firestore";
import {
  FirestoreGoalSchema,
  type FirestoreGoal,
  type HydratedGoal,
} from "@/types/goal";
import { fetchUserProfileFromFirestore } from "./userService";
import { fetchSectorFromFirestore } from "./sectorService";

export const goalConverter: FirestoreDataConverter<FirestoreGoal> = {
  toFirestore: (user: FirestoreGoal) => user,

  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): FirestoreGoal {
    const data = snapshot.data(options);

    const result = FirestoreGoalSchema.safeParse(data);

    if (!result.success) {
      console.error(
        `Erro de validação no Goal DB (${snapshot.id}):`,
        result.error
      );
      throw new Error("Dados da meta inválidos/corrompidos.");
    }

    return result.data;
  },
};

const hydrateGoal = async (
  goalData: FirestoreGoal,
  id: string
): Promise<HydratedGoal> => {
  const creator = await fetchUserProfileFromFirestore(goalData.creator_id);
  const responsible = await fetchUserProfileFromFirestore(
    goalData.responsible_id
  );
  const launcher = await fetchUserProfileFromFirestore(goalData.launcher_id);

  const sector = await fetchSectorFromFirestore(goalData.sector_id);

  if (!creator || !responsible || !launcher) {
    throw new Error(`Usuários vinculados não encontrados para a meta (${id}).`);
  }

  if (!sector) {
    throw new Error(`Setor vinculado não encontrado para a meta (${id}).`);
  }

  const { creator_id, responsible_id, launcher_id, sector_id, ...goalProps } =
    goalData;

  const finalGoal: HydratedGoal = {
    id: id,
    ...goalProps,
    creator: creator,
    responsible: responsible,
    launcher: launcher,
    sector: sector,
  };

  return finalGoal;
};

export const fetchGoalsByResponsibleFromFirestore = async (
  uid: string
): Promise<HydratedGoal[]> => {
  try {
    const goalsRef = collection(db, "goals").withConverter(goalConverter);

    const q = query(goalsRef, where("responsible_id", "==", uid));

    const querySnapshot = await getDocs(q);

    const goalsPromises = querySnapshot.docs.map((docSnap) => 
      hydrateGoal(docSnap.data(), docSnap.id)
    );

    var goals = await Promise.all(goalsPromises);

    return goals;
  } catch (error) {
    console.error("Erro no fetchGoalsByResponsibleFromFirestore:", error);
    throw error;
  }
};

export const fetchGoalsBySectorFromFirestore = async (
  sector_id: string
): Promise<HydratedGoal[]> => {
  try {
    const goalsRef = collection(db, "goals").withConverter(goalConverter);

    const q = query(goalsRef, where("sector_id", "==", sector_id));

    const querySnapshot = await getDocs(q);

    const goalsPromises = querySnapshot.docs.map((docSnap) =>
      hydrateGoal(docSnap.data(), docSnap.id)
    );

    var goals = await Promise.all(goalsPromises);

    return goals;
  } catch (error) {
    console.error("Erro no fetchGoalsBySectorFromFirestore:", error);
    throw error;
  }
};

export const fetchGoalsByLauncherFromFirestore = async (
  launcher_id: string
): Promise<HydratedGoal[]> => {
  try {
    const goalsRef = collection(db, "goals").withConverter(goalConverter);

    const q = query(goalsRef, 
      where("launcher_id", "==", launcher_id),
      where("status", "in", ["in_progress", "pending"]),
    );

    const querySnapshot = await getDocs(q);

    const goalsPromises = querySnapshot.docs.map((docSnap) =>
      hydrateGoal(docSnap.data(), docSnap.id)
    );

    var goals = await Promise.all(goalsPromises);

    return goals;
  } catch (error) {
    console.error("Erro no fetchGoalsByLauncherFromFirestore:", error);
    throw error;
  }
};

export const fetchGoalsByCreatorFromFirestore = async (
  creator_id: string
): Promise<HydratedGoal[]> => {
  try {
    const goalsRef = collection(db, "goals").withConverter(goalConverter);

    const q = query(goalsRef, where("creator_id", "==", creator_id));

    const querySnapshot = await getDocs(q);

    const goalsPromises = querySnapshot.docs.map((docSnap) =>
      hydrateGoal(docSnap.data(), docSnap.id)
    );

    var goals = await Promise.all(goalsPromises);

    return goals;
  } catch (error) {
    console.error("Erro no fetchGoalsByCreatorFromFirestore:", error);
    throw error;
  }
};

export const fetchPendingGoalsFromFirestore = async (): Promise<HydratedGoal[]> => {
  try {
    const goalsRef = collection(db, "goals").withConverter(goalConverter);

    const q = query(goalsRef, where("status", "in", ["pending", "in_progress"]));

    const querySnapshot = await getDocs(q);

    const goalsPromises = querySnapshot.docs.map((docSnap) =>
      hydrateGoal(docSnap.data(), docSnap.id)
    );

    var goals = await Promise.all(goalsPromises);

    return goals;
  } catch (error) {
    console.error("Erro no fetchPendingGoalsFromFirestore:", error);
    throw error;
  }
};

export const fetchGoalFromFirestore = async (
  goal_id: string
): Promise<HydratedGoal> => {
  try {
    const goalRef = doc(db, "goals", goal_id).withConverter(goalConverter);

    const docSnap = await getDoc(goalRef);

    if (docSnap.exists()) {
      return hydrateGoal(docSnap.data(), docSnap.id);
    } else {
      throw new Error(`Documento com id ${goal_id} não encontrado.`);
    }
  } catch (error) {
    console.error("Erro no fetchGoalFromFirestore:", error);
    throw error;
  }
};

export const createGoalInFirestore = async (
  goalData: FirestoreGoal
): Promise<string> => {
  try {
    const goalsRef = collection(db, "goals").withConverter(goalConverter);

    const docRef = await addDoc(goalsRef, goalData);

    console.log(`Meta criada com sucesso! ID: ${docRef.id}`);

    return docRef.id;
  } catch (error) {
    console.error("Erro no createGoalInFirestore:", error);
    throw error;
  }
};

export const updateGoalInFirestore = async (
  goalId: string,
  updateData: {
    description?: string;
    levels?: { targetValue: string | number; percentage: number }[];
  }
): Promise<void> => {
  try {
    const goalRef = doc(db, "goals", goalId);
    // Atualiza apenas os campos passados
    await updateDoc(goalRef, updateData);
    console.log(`Meta ${goalId} atualizada com sucesso.`);
  } catch (error) {
    console.error("Erro ao atualizar meta:", error);
    throw error;
  }
};