// src/hooks/useAuthOptions.ts — public sign-in settings (Telegram-only students, bot name).
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/authService";

export const useAuthOptions = () =>
  useQuery({
    queryKey: ["auth", "options"],
    queryFn: authService.getOptions,
    staleTime: 5 * 60_000,
  });
