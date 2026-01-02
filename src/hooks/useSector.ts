import { fetchSectorsFromFirestore } from "@/services/sectorService";
import { useQuery } from "@tanstack/react-query";

export function useSectors() {
  return useQuery({
    queryKey: ["sectors"],
    queryFn: () => fetchSectorsFromFirestore(),
    staleTime: 1000 * 60 * 30,
  });
}
