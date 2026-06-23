// src/utils/formatDate.ts
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { uz } from "date-fns/locale";

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "dd.MM.yyyy", { locale: uz });
};

export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "dd.MM.yyyy, HH:mm", { locale: uz });
};

export const formatTime = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "HH:mm", { locale: uz });
};

export const getRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: uz });
};
