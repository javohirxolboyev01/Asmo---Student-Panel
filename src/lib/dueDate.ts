// src/lib/dueDate.ts — payment due dates: a <input type="date"> value is the
// end of that day in the teacher's local time.
const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-12-05" → ISO of 5 Dec 23:59 local; "" → undefined. */
export const dueInputToIso = (value: string) => (value ? new Date(`${value}T23:59:00`).toISOString() : undefined);

/** ISO → "2026-12-05" for a date input; null → "". */
export const isoToDueInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** ISO → "05.12.2026". */
export const formatDue = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
};

/** Today as a date-input value (min for new due dates). */
export const todayInput = () => isoToDueInput(new Date().toISOString());
