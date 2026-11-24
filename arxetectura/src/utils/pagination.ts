// src/utils/pagination.ts — optional ?limit=&offset= for list routes.
//
// Without either param a list route returns everything, exactly as before
// (backward compatible). With them it returns one page in the same response
// shape and reports the full count in the X-Total-Count header.
import { httpError } from "./teacherScope.js";

export type Page = { skip: number; take: number };

const intParam = (value: unknown) =>
  typeof value === "string" && /^\d+$/.test(value) ? Number(value) : Number.NaN;

/** The requested page, null when none was asked for, or a 400 for bad values. */
export const parsePage = (req: any): Page | null => {
  const { limit, offset } = req.query ?? {};
  if (limit === undefined && offset === undefined) return null;
  const take = limit === undefined ? 100 : intParam(limit);
  const skip = offset === undefined ? 0 : intParam(offset);
  if (!Number.isInteger(take) || take < 1 || take > 500) throw httpError(400, "limit must be 1..500");
  if (!Number.isInteger(skip) || skip < 0 || skip > 1_000_000) throw httpError(400, "offset must be >= 0");
  return { skip, take };
};

export const setTotalCount = (res: any, total: number) => res.setHeader("X-Total-Count", String(total));
