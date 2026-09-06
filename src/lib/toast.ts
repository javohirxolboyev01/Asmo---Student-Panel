// src/lib/toast.ts
import { toast } from "react-toastify";

export { toast };

export const getErrorMessage = (err: unknown, fallback: string): string =>
  err instanceof Error ? err.message : fallback;
