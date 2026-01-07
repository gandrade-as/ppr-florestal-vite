import { db } from "@/lib/firebase/client";
import { FirestoreUserProfileSchema, type FirestoreUserProfile, type HydratedUserProfile } from "@/types/user"
import { addDoc, collection, doc, getDoc, getDocs, query, QueryDocumentSnapshot, updateDoc, where, type FirestoreDataConverter, type SnapshotOptions } from "firebase/firestore"
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

const hydrateUser = async (
  userData: FirestoreUserProfile,
  id: string
): Promise<HydratedUserProfile> => {

  const sector = await fetchSectorFromFirestore(userData.sector_id);

  if (!sector) {
    throw new Error(`Setor vinculado (${userData.sector_id}) não encontrado.`);
  }

  const ids = userData.responsible_sectors_ids || [];

  const sectors = await Promise.all(
    ids.map(async (sector_id) => {
      let sec = await fetchSectorFromFirestore(sector_id);

      if (!sec) {
        throw new Error(`Setor vinculado (${sector_id}) não encontrado.`);
      }

      return sec;
    })
  );

  const { sector_id, ...userProps } = userData;

  const finalUser: HydratedUserProfile = {
    id: id,
    ...userProps,
    sector: sector,
    responsible_sectors: sectors,
  };

  return finalUser;
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

    const ids = userData.responsible_sectors_ids || [];

    const sectors = await Promise.all(
      ids.map(async (sector_id) => {
        let sec = await fetchSectorFromFirestore(sector_id)

        if (!sec) {
          throw new Error(
            `Setor vinculado (${sector_id}) não encontrado.`
          );
        }

        return sec;
      })
    );

    const { sector_id, ...userProps } = userData;

    const finalUser: HydratedUserProfile = {
      id: userSnap.id,
      ...userProps,
      sector: sector,
      responsible_sectors: sectors 
    };

    return finalUser;
  } catch (error) {
    console.error("Erro no fetchUserProfileFromFirestore:", error);
    throw error;
  }
};

export const fecthUsersFromfirestore = async (): Promise<HydratedUserProfile[]> => {
  try {
    const usersRef = collection(db, "users").withConverter(userConverter);

    const querySnapshot = await getDocs(usersRef);

    const promises = querySnapshot.docs.map((docSnap) =>
      hydrateUser(docSnap.data(), docSnap.id)
    );

    // 2. O Promise.all espera todas as promises serem resolvidas em paralelo
    // e retorna um array com os resultados na mesma ordem.
    const users: HydratedUserProfile[] = await Promise.all(promises);

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

export const createUserInFirestore = async (
  userData: Omit<FirestoreUserProfile, "uid">
): Promise<void> => {
  try {
    const usersRef = collection(db, "users");

    // 1. Cria o documento e gera o ID automaticamente
    const docRef = await addDoc(usersRef, {
      ...userData,
      uid: "temp", // Placeholder temporário
    });

    // 2. Atualiza o campo 'uid' com o ID gerado pelo Firestore
    // Isso garante consistência se sua aplicação usa o campo 'uid' interno
    await updateDoc(docRef, {
      uid: docRef.id,
    });

    console.log(`Usuário criado com ID: ${docRef.id}`);
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    throw error;
  }
};