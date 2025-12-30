import { db } from "@/lib/firebase/client";
import { FirestoreSectorSchema, type FirestoreSector } from "@/types/sector"
import { doc, getDoc, type FirestoreDataConverter} from "firebase/firestore"

export const sectorConverter: FirestoreDataConverter<FirestoreSector> = {
  toFirestore: (sector: FirestoreSector) => sector,
  fromFirestore: (snapshot) => {
    const data = { id: snapshot.id, ...snapshot.data() };
    return FirestoreSectorSchema.parse(data);
  },
};

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
