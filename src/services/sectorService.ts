import { db } from "@/lib/firebase/client";
import { FirestoreSectorSchema, type FirestoreSector } from "@/types/sector"
import { doc, getDoc, QueryDocumentSnapshot, type FirestoreDataConverter, type SnapshotOptions } from "firebase/firestore"

const sectorConverter: FirestoreDataConverter<FirestoreSector> = {
    toFirestore(sector: FirestoreSector) {
        const {id, ...data} = sector;
        return data;
    },

    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions
    ): FirestoreSector {
        const data = snapshot.data(options);

        const dataWithId = { id: snapshot.id, ...data };

        const result = FirestoreSectorSchema.safeParse(dataWithId);

        if (!result.success) {
            console.error("Erro ao converter Sector do Firestore:", result.error);
            throw new Error("Dados de setor inválidos/corrompidos.");
        }

        return result.data as FirestoreSector;
    }
}

export const fetchSectorFromFirestore = async (
  id: string
): Promise<FirestoreSector | null> => {
  try {
    const sectorRef = doc(db, "sectors", id).withConverter(sectorConverter);

    const sectorSnap = await getDoc(sectorRef);

    if (sectorSnap.exists()) {
      return sectorSnap.data();
    }

    return null;
  } catch (error) {
    console.error("Erro no fetchSectorFromFirestore:", error);
    throw error;
  }
};
