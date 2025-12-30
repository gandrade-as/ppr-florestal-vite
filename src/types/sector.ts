import z from "zod";

export interface Sector {
  id: string;
  acronym: string;
  name: string;
}

export const FirestoreSectorSchema = z.object({
  id: z.string(),
  acronym: z.string(),
  name: z.string(),
});

export type FirestoreSector = z.infer<typeof FirestoreSectorSchema>;
