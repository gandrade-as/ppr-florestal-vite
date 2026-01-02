import { Timestamp } from "firebase/firestore";
import z from "zod";

export const LauncherMessageSchema = z.object({
  sender_name: z.string(),
  achievement_level: z.union([z.string(), z.number()]),
  content: z.string(),
  attachments: z.array(z.string()).optional(),
  timestamp: z.instanceof(Timestamp),
});

export const AuditMessageSchema = z.object({
  sender_name: z.string(),
  status: z.enum(["approved", "rejected"]),
  timestamp: z.instanceof(Timestamp),
});

export const FirestoreLaunchSchema = z.object({
  seq: z.number(),
  thread: z.array(z.union([LauncherMessageSchema, AuditMessageSchema])),
  status: z.enum(["pending", "approved"]),
  deadline: z.instanceof(Timestamp),
  updated_by: z.string(),
  created_at: z.instanceof(Timestamp),
  updated_at: z.instanceof(Timestamp),
});
