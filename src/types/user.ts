import z from "zod";
import { FirestoreSectorSchema } from "./sector";

export type UserRole =
  | "superuser"
  | "admin"
  | "gestor"
  | "avaliador"
  | "colaborador";

export interface Sector {
  id: string;
  acronym: string;
  name: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  avatarUrl?: string;
  sector: Sector;
}

export const FirestoreUserProfileSchema = z.object({
  name: z.string(),
  email: z.email(),
  roles: z.array(
    z.enum(["superuser", "admin", "gestor", "avaliador", "colaborador"])
  ),
  avatarUrl: z.url().optional(),
  sector_id: z.string(),
  uid: z.string(),
});

export const HydratedUserProfileSchema = FirestoreUserProfileSchema.omit({
  sector_id: true,
}).extend({
  id: z.string(),
  sector: FirestoreSectorSchema,
});

export type FirestoreUserProfile = z.infer<typeof FirestoreUserProfileSchema>;

export type HydratedUserProfile = z.infer<typeof HydratedUserProfileSchema>;
