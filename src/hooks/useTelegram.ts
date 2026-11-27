// src/hooks/useTelegram.ts — React side of lib/telegram (no-ops outside Telegram).
import { useEffect, useRef } from "react";
import { holdClosingConfirmation, pushTelegramBack } from "@/lib/telegram";

/**
 * While `active`, Telegram's back button (and Android's hardware back inside
 * Telegram) runs `handler`. The newest registration wins, so an open sheet
 * closes before the page goes back.
 */
export const useTelegramBack = (handler: () => void, active = true) => {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => (active ? pushTelegramBack(() => ref.current()) : undefined), [active]);
};

/** While `active`, closing the Mini App asks for confirmation first. */
export const useClosingConfirmation = (active: boolean) => {
  useEffect(() => (active ? holdClosingConfirmation() : undefined), [active]);
};
