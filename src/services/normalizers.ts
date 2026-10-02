// src/services/normalizers.ts
// Backend javob maydonlari joylarda farq qilishi mumkin bo'lgani uchun,
// bir nechta ehtimoliy nom variantlarini qo'llab-quvvatlaydigan moslashtiruvchilar.
import { CoinRecord } from "@/types/coin";
import { AttendanceRecord } from "@/types/attendance";

interface RawCoinTransaction {
  id: string;
  amount: number;
  reason?: string;
  description?: string;
  type?: string;
  sourceType?: string;
  createdAt?: string;
  date?: string;
}

export const normalizeCoinTransaction = (raw: RawCoinTransaction): CoinRecord => ({
  id: raw.id,
  amount: raw.amount,
  reason: raw.reason ?? raw.description ?? raw.type ?? raw.sourceType ?? "Coin operatsiyasi",
  createdAt: raw.createdAt ?? raw.date ?? new Date().toISOString(),
});

interface RawAttendanceRecord {
  id: string;
  lessonId?: string;
  lessonTopic?: string;
  topic?: string;
  lesson?: { id?: string; topic?: string; lessonDate?: string; date?: string };
  // GET /attendance includes the Prisma relation as-is (capitalised).
  Lesson?: { id?: string; topic?: string; lessonDate?: string };
  lessonDate?: string;
  date?: string;
  status: string;
  markedAt?: string;
  createdAt?: string;
}

export const normalizeAttendanceRecord = (raw: RawAttendanceRecord): AttendanceRecord => ({
  id: raw.id,
  lessonId: raw.lessonId ?? raw.lesson?.id ?? raw.Lesson?.id ?? "",
  lessonTopic: raw.lessonTopic ?? raw.topic ?? raw.lesson?.topic ?? raw.Lesson?.topic ?? "Dars",
  lessonDate:
    raw.lessonDate ??
    raw.date ??
    raw.lesson?.lessonDate ??
    raw.lesson?.date ??
    raw.Lesson?.lessonDate ??
    raw.createdAt ??
    "",
  status: (raw.status?.toLowerCase() as AttendanceRecord["status"]) ?? "absent",
  markedAt: raw.markedAt ?? raw.createdAt ?? "",
});
