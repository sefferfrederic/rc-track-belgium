"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchPublicSetups } from "@/lib/firebase/cars";
import { fetchTracks, fetchTaxonomies } from "@/lib/firebase/tracks";
import type { CarSetup, Track, Taxonomy } from "@/types";

const WEATHER_ICON: Record<string, string> = { sec: "☀️", nuageux: "☁️", pluie: "🌧️" };

export default function ReglagesPublicsPage() {
  const { t, locale } = useLanguage();
  const [setups, setSetups] = useState<CarSetup[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    Promise.all([fetchPublicSetups(), fetchTracks(), fetchTaxonomies()]).then(([s, t, tax]) => {
      setSetups(s);
      setTracks(t);
      setTaxonomies(tax);
      setBusy(false);
    });
  }, []);

  const trackName = (id: string | null) => (id ? tracks.find((tr) => tr.id === id)?.name : null);
  const taxLabel = (id: string | null) => (id ? taxonomies.find((tx) => tx.id === id)?.label : null);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Link href="/" className="flex items-center gap-1 text-sm text-track-muted hover:text-track-white">
        <ChevronLeft size={16} /> {t("nav_home")}
      </Link>

      <div>
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-track-orange">
          Belgique
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold">🔧 {t("garage_public_setups_title")}</h1>
      </div>

      {busy && <p className="text-center text-sm text-track-muted">{t("home_loading")}</p>}

      {!busy && setups.length === 0 && (
        <p className="text-center text-sm text-track-muted">{t("garage_public_setups_none")}</p>
      )}

      <div className="flex flex-col gap-3">
        {setups.map((s) => (
          <div key={s.id} className="rounded-xl2 border border-track-border bg-track-surface p-4">
            <div className="flex items-center justify-between">
              <p className="font-display text-base font-bold">{s.carName}</p>
              <p className="text-xs text-track-muted">
                {new Date(`${s.date}T00:00:00`).toLocaleDateString(locale === "nl" ? "nl-BE" : "fr-BE", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>
            <p className="text-xs text-track-muted">
              {t("garage_by")} {s.authorName}
              {trackName(s.trackId) ? ` · ${trackName(s.trackId)}` : ""}
            </p>

            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-track-muted">
              {s.weather && <span>{WEATHER_ICON[s.weather]} {t(`garage_weather_${s.weather}` as any)}</span>}
              {taxLabel(s.surfaceId) && <span>🏁 {taxLabel(s.surfaceId)}</span>}
              {s.gripLevel && <span>🛞 {t(`garage_grip_${s.gripLevel}` as any)}</span>}
              {(s.tireBrand || s.tireCompound) && (
                <span>
                  🏎️ {[s.tireBrand, s.tireCompound ? t(`garage_tire_${s.tireCompound}` as any) : null].filter(Boolean).join(" · ")}
                </span>
              )}
            </div>

            {(s.rideHeightFront != null || s.rideHeightRear != null) && (
              <p className="mt-2 text-xs">
                <span className="text-track-muted">{t("garage_ride_height")} : </span>
                {s.rideHeightFront ?? "—"} / {s.rideHeightRear ?? "—"} mm
              </p>
            )}
            {(s.diffOilFront || s.diffOilCenter || s.diffOilRear) && (
              <p className="mt-1 text-xs">
                <span className="text-track-muted">{t("garage_diff_oil")} : </span>
                {s.diffOilFront ?? "—"} / {s.diffOilCenter ?? "—"} / {s.diffOilRear ?? "—"}
              </p>
            )}
            {(s.shockOilFront || s.shockOilRear) && (
              <p className="mt-1 text-xs">
                <span className="text-track-muted">{t("garage_shock_oil")} : </span>
                {s.shockOilFront ?? "—"} / {s.shockOilRear ?? "—"}
              </p>
            )}

            {s.notes && <p className="mt-2 text-sm text-track-white">{s.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
