"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { useLanguage } from "@/contexts/LanguageContext";

interface DayForecast {
  dayKey: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipProbability: number;
}

/** Codes météo WMO (norme utilisée par Open-Meteo) → emoji + libellé court. */
function weatherIcon(code: number): string {
  if (code === 0) return "☀️";
  if (code === 1 || code === 2) return "🌤️";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 51 && code <= 57) return "🌦️";
  if (code >= 61 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code >= 80 && code <= 82) return "🌦️";
  if (code >= 85 && code <= 86) return "🌨️";
  if (code >= 95) return "⛈️";
  return "🌡️";
}

function dayLabel(dayKey: string, index: number, locale: "fr" | "nl"): string {
  if (index === 0) return locale === "nl" ? "Vandaag" : "Aujourd'hui";
  if (index === 1) return locale === "nl" ? "Morgen" : "Demain";
  const d = new Date(`${dayKey}T00:00:00`);
  const label = d.toLocaleDateString(locale === "nl" ? "nl-BE" : "fr-BE", { weekday: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Prévisions à 3 jours pour une piste (lat/lng), via l'API gratuite Open-Meteo (sans clé). */
export default function WeatherForecast({
  lat,
  lng,
  trackName,
  selectedDayKey,
}: {
  lat: number;
  lng: number;
  trackName: string;
  selectedDayKey?: string;
}) {
  const { t, locale } = useLanguage();
  const [days, setDays] = useState<DayForecast[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDays(null);
    setError(false);

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
      `&timezone=auto&forecast_days=3`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("weather fetch failed");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const daily = data.daily;
        const result: DayForecast[] = daily.time.map((dayKey: string, i: number) => ({
          dayKey,
          weatherCode: daily.weathercode[i],
          tempMax: Math.round(daily.temperature_2m_max[i]),
          tempMin: Math.round(daily.temperature_2m_min[i]),
          precipProbability: daily.precipitation_probability_max[i],
        }));
        setDays(result);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  if (error) return null; // on n'affiche rien plutôt que de bloquer la page

  return (
    <section className="rounded-xl2 border border-track-border bg-track-surface p-4">
      <p className="font-display text-xs font-semibold uppercase tracking-wide text-track-muted">
        {t("weather_title")} — {trackName}
      </p>

      {!days && <p className="mt-3 text-sm text-track-muted">{t("home_loading")}</p>}

      {days && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {days.map((d, i) => (
            <div
              key={d.dayKey}
              className={clsx(
                "flex flex-col items-center gap-1 rounded-xl2 border p-3 text-center transition-colors",
                d.dayKey === selectedDayKey
                  ? "border-track-orange bg-track-orange/10"
                  : "border-track-border bg-track-surface2"
              )}
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-track-muted">
                {dayLabel(d.dayKey, i, locale)}
              </span>
              <span className="text-3xl">{weatherIcon(d.weatherCode)}</span>
              <span className="font-display text-sm font-bold">
                {d.tempMax}° <span className="font-normal text-track-muted">/ {d.tempMin}°</span>
              </span>
              {d.precipProbability > 20 && (
                <span className="text-xs text-track-muted">💧 {d.precipProbability}%</span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
