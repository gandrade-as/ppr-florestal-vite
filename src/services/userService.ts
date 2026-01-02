import { db } from "@/lib/firebase/client";
import { FirestoreUserProfileSchema, type FirestoreUserProfile, type HydratedUserProfile } from "@/types/user"
import { collection, doc, getDoc, getDocs, query, QueryDocumentSnapshot, where, type FirestoreDataConverter, type SnapshotOptions } from "firebase/firestore"
import { fetchSectorFromFirestore } from "./sectorService";

export const userConverter: FirestoreDataConverter<FirestoreUserProfile> = {
  toFirestore: (user: FirestoreUserProfile) => user,

  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): FirestoreUserProfile {
    const data = snapshot.data(options);

    const result = FirestoreUserProfileSchema.safeParse(data);

    if (!result.success) {
      console.error(
        `Erro de validação no User DB (${snapshot.id}):`,
        result.error.format()
      );
      throw new Error("Dados de perfil inválidos/corrompidos.");
    }

    return result.data;
  },
};

export const fetchUserProfileFromFirestore = async (
  uid: string
): Promise<HydratedUserProfile | null> => {
  try {
    const userRef = doc(db, "users", uid).withConverter(userConverter);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return null;

    const userData = userSnap.data();

    const sector = await fetchSectorFromFirestore(userData.sector_id);

    if (!sector) {
      throw new Error(
        `Setor vinculado (${userData.sector_id}) não encontrado.`
      );
    }

    const { sector_id, ...userProps } = userData;

    const finalUser: HydratedUserProfile = {
      id: userSnap.id,
      ...userProps,
      sector: sector, 
    };

    return finalUser;
  } catch (error) {
    console.error("Erro no fetchUserProfileFromFirestore:", error);
    throw error;
  }
};

export const fecthUsersFromfirestore = async (): Promise<FirestoreUserProfile[]> => {
  try {
    const usersRef = collection(db, "users").withConverter(userConverter);

    const querySnapshot = await getDocs(usersRef);

    var users: FirestoreUserProfile[] = [];

    for (const docSnap of querySnapshot.docs) {
      users.push(docSnap.data());
    }

    return users;
  } catch (error) {
    console.error("Erro no fetchUsersFromFirestore:", error);
    throw error;
  }
}

export const fetchUsersBySectorFromFirestore = async (
  sector_id: string
): Promise<FirestoreUserProfile[]> => {
  try {
    const usersRef = collection(db, "users").withConverter(userConverter);

    const q = query(usersRef, where("sector_id", "==", sector_id));

    const querySnapshot = await getDocs(q);

    var users: FirestoreUserProfile[] = [];

    for (const docSnap of querySnapshot.docs) {
      users.push(docSnap.data());
    }

    return users;
  } catch (error) {
    console.error("Erro no fetchUsersBySectorFromFirestore:", error);
    throw error;
  }
}
