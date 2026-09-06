// src/utils/formatDate.ts
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { uz } from "date-fns/locale";

type DateInput = string | Date | null | undefined;

export const formatDate = (date: DateInput): string => {
  if (!date) return "-";
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "dd.MM.yyyy", { locale: uz });
};

export const formatDateTime = (date: DateInput): string => {
  if (!date) return "-";
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "dd.MM.yyyy, HH:mm", { locale: uz });
};

export const formatTime = (date: DateInput): string => {
  if (!date) return "-";
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "HH:mm", { locale: uz });
};

export const getRelativeTime = (date: DateInput): string => {
  if (!date) return "-";
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: uz });
};
