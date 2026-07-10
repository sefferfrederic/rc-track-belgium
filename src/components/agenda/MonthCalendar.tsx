"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toDayKey, todayDayKey } from "@/lib/date";

const WEEKDAY_LABELS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

interface DayCell {
  dayKey: string;
  dayNumber: number;
  inMonth: boolean;
}

function buildMonthGrid(monthDayKey: string): DayCell[] {
  const [y, m] = monthDayKey.split("-").map(Number);
  const firstOfMonth = new Date(y, m - 1, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // 0 = lundi
  const gridStart = new Date(y, m - 1, 1 - startWeekday);

  const cells: DayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push({
      dayKey: toDayKey(d),
      dayNumber: d.getDate(),
      inMonth: d.getMonth() === m - 1,
    });
  }
  return cells;
}

export default function MonthCalendar({
  monthDayKey,
  selectedDayKey,
  countsByDay,
  eventDayKeys,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
}: {
  monthDayKey: string; // n'importe quel jour du mois affiché
  selectedDayKey: string;
  countsByDay: Record<string, number>; // nombre de pilotes par jour (0 ou absent = vide)
  eventDayKeys?: Set<string>; // jours contenant un événement (course, bourse...)
  onSelectDay: (dayKey: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const cells = buildMonthGrid(monthDayKey);
  const [labelYear, labelMonth] = monthDayKey.split("-").map(Number);
  const monthLabel = new Date(labelYear, labelMonth - 1, 1).toLocaleDateString("fr-BE", {
    month: "long",
    year: "numeric",
  });
  const today = todayDayKey();

  return (
    <div className="rounded-xl2 border border-track-border bg-track-surface p-3">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={onPrevMonth} aria-label="Mois précédent">
          <ChevronLeft className="text-track-muted" />
        </button>
        <span className="font-display text-sm font-bold uppercase tracking-wide">
          {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
        </span>
        <button onClick={onNextMonth} aria-label="Mois suivant">
          <ChevronRight className="text-track-muted" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_LABELS.map((w) => (
          <span key={w} className="pb-1 text-[0.65rem] font-semibold uppercase text-track-muted">
            {w}
          </span>
        ))}

        {cells.map((cell) => {
          const count = countsByDay[cell.dayKey] ?? 0;
          const hasActivity = count > 0;
          const hasEvent = eventDayKeys?.has(cell.dayKey) ?? false;
          const isSelected = cell.dayKey === selectedDayKey;
          const isToday = cell.dayKey === today;

          return (
            <button
              key={cell.dayKey}
              onClick={() => onSelectDay(cell.dayKey)}
              className={clsx(
                "relative aspect-square rounded-lg text-xs font-semibold transition-colors",
                !cell.inMonth && "opacity-30",
                hasActivity
                  ? "bg-flag-gradient text-track-bg"
                  : "bg-track-surface2 text-track-muted",
                isSelected && "ring-2 ring-track-white",
                isToday && !isSelected && "ring-1 ring-track-orange/70"
              )}
            >
              {cell.dayNumber}
              {hasActivity && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-track-bg px-1 text-[0.55rem] font-bold text-track-white">
                  {count}
                </span>
              )}
              {hasEvent && (
                <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-track-red ring-1 ring-track-bg" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.65rem] text-track-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded bg-track-surface2" /> Personne
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded bg-flag-gradient" /> Ça roule (nombre de pilotes)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-track-red" /> Événement
        </span>
      </div>
    </div>
  );
}
