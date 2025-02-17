// lib/utils.ts
import { v4 as uuidv4 } from "uuid";

export function generateSessionId(): string {
  return uuidv4();
}