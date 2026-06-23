// src/utils/calculateDeadline.ts
import { differenceInHours, parseISO, isBefore } from "date-fns";

export const isOverdue = (deadline: string): boolean => {
  const now = new Date();
  const deadlineDate = parseISO(deadline);
  return isBefore(deadlineDate, now);
};

export const getHoursUntilDeadline = (deadline: string): number => {
  const now = new Date();
  const deadlineDate = parseISO(deadline);
  return Math.ceil(differenceInHours(deadlineDate, now));
};
