/** Formate une Date en "AAAA-MM-JJ" en utilisant le fuseau horaire LOCAL (pas UTC,
 * contrairement à toISOString(), pour éviter un décalage d'un jour près de minuit). */
export function toDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayDayKey(): string {
  return toDayKey(new Date());
}

export function addDays(dayKey: string, delta: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return toDayKey(dt);
}

export function addMonths(dayKey: string, delta: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setMonth(dt.getMonth() + delta);
  return toDayKey(dt);
}

export function monthStartKey(dayKey: string): string {
  const [y, m] = dayKey.split("-").map(Number);
  return toDayKey(new Date(y, m - 1, 1));
}

export function monthEndKey(dayKey: string): string {
  const [y, m] = dayKey.split("-").map(Number);
  return toDayKey(new Date(y, m, 0));
}
