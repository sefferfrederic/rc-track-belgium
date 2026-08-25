"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { fetchTracks, fetchTaxonomies } from "@/lib/firebase/tracks";
import { createSetup, updateSetup, type SetupInput } from "@/lib/firebase/cars";
import { useLanguage } from "@/contexts/LanguageContext";
import { todayDayKey } from "@/lib/date";
import Button from "@/components/ui/Button";
import type { Track, Taxonomy, CarSetup } from "@/types";

export default function SetupFormModal({
  carId,
  carName,
  authorUid,
  authorName,
  setup,
  onClose,
  onSaved,
}: {
  carId: string;
  carName: string;
  authorUid: string;
  authorName: string;
  setup?: CarSetup | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t, locale } = useLanguage();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [surfaces, setSurfaces] = useState<Taxonomy[]>([]);

  const [trackId, setTrackId] = useState(setup?.trackId ?? "");
  const [date, setDate] = useState(setup?.date ?? todayDayKey());
  const [weather, setWeather] = useState<CarSetup["weather"]>(setup?.weather ?? null);
  const [surfaceId, setSurfaceId] = useState(setup?.surfaceId ?? "");
  const [gripLevel, setGripLevel] = useState<CarSetup["gripLevel"]>(setup?.gripLevel ?? null);
  const [rideHeightFront, setRideHeightFront] = useState(setup?.rideHeightFront?.toString() ?? "");
  const [rideHeightRear, setRideHeightRear] = useState(setup?.rideHeightRear?.toString() ?? "");
  const [diffOilFront, setDiffOilFront] = useState(setup?.diffOilFront ?? "");
  const [diffOilCenter, setDiffOilCenter] = useState(setup?.diffOilCenter ?? "");
  const [diffOilRear, setDiffOilRear] = useState(setup?.diffOilRear ?? "");
  const [shockOilFront, setShockOilFront] = useState(setup?.shockOilFront ?? "");
  const [shockOilRear, setShockOilRear] = useState(setup?.shockOilRear ?? "");
  const [notes, setNotes] = useState(setup?.notes ?? "");
  const [isPublic, setIsPublic] = useState(setup?.isPublic ?? false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchTracks(), fetchTaxonomies()]).then(([t, tax]) => {
      setTracks(t.sort((a, b) => a.name.localeCompare(b.name)));
      setSurfaces(tax.filter((x) => x.type === "surface"));
    });
  }, []);

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      const input: SetupInput = {
        trackId: trackId || null,
        date,
        weather,
        surfaceId: surfaceId || null,
        gripLevel,
        rideHeightFront: rideHeightFront ? Number(rideHeightFront) : null,
        rideHeightRear: rideHeightRear ? Number(rideHeightRear) : null,
        diffOilFront: diffOilFront.trim() || null,
        diffOilCenter: diffOilCenter.trim() || null,
        diffOilRear: diffOilRear.trim() || null,
        shockOilFront: shockOilFront.trim() || null,
        shockOilRear: shockOilRear.trim() || null,
        notes: notes.trim(),
        isPublic,
      };
      if (setup) {
        await updateSetup(carId, setup.id, input);
      } else {
        await createSetup(carId, carName, input, authorUid, authorName);
      }
      onSaved();
    } catch {
      setError(locale === "nl" ? "Kan niet opslaan, probeer opnieuw." : "Impossible d'enregistrer, réessaie.");
    } finally {
      setSaving(false);
    }
  }

  const weatherOptions: { value: NonNullable<CarSetup["weather"]>; key: "garage_weather_sec" | "garage_weather_nuageux" | "garage_weather_pluie" }[] = [
    { value: "sec", key: "garage_weather_sec" },
    { value: "nuageux", key: "garage_weather_nuageux" },
    { value: "pluie", key: "garage_weather_pluie" },
  ];

  const gripOptions: { value: NonNullable<CarSetup["gripLevel"]>; key: "garage_grip_fort" | "garage_grip_moyen" | "garage_grip_glissant" }[] = [
    { value: "fort", key: "garage_grip_fort" },
    { value: "moyen", key: "garage_grip_moyen" },
    { value: "glissant", key: "garage_grip_glissant" },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-xl2 border border-track-border bg-track-surface p-5 md:rounded-xl2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold uppercase">{t("garage_new_setup")}</h2>
          <button onClick={onClose} aria-label={t("close")}>
            <X size={20} className="text-track-muted" />
          </button>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
              {t("garage_setup_date")}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
            {t("garage_setup_track")}
          </label>
          <select
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
          >
            <option value="">{t("garage_not_specified")}</option>
            {tracks.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
            {t("garage_setup_weather")}
          </label>
          <div className="flex gap-2">
            {weatherOptions.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setWeather(weather === o.value ? null : o.value)}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold uppercase ${
                  weather === o.value ? "border-track-orange bg-track-orange/10 text-track-white" : "border-track-border text-track-muted"
                }`}
              >
                {t(o.key)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
            {t("garage_setup_surface")}
          </label>
          <select
            value={surfaceId}
            onChange={(e) => setSurfaceId(e.target.value)}
            className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
          >
            <option value="">{t("garage_not_specified")}</option>
            {surfaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
            {t("garage_setup_grip")}
          </label>
          <div className="flex gap-2">
            {gripOptions.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setGripLevel(gripLevel === o.value ? null : o.value)}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold uppercase ${
                  gripLevel === o.value ? "border-track-orange bg-track-orange/10 text-track-white" : "border-track-border text-track-muted"
                }`}
              >
                {t(o.key)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-track-muted">
            {t("garage_ride_height")}
          </p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-[0.65rem] text-track-muted">{t("garage_ride_height_front")}</label>
              <input
                type="number"
                inputMode="decimal"
                value={rideHeightFront}
                onChange={(e) => setRideHeightFront(e.target.value)}
                className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-2.5 text-sm outline-none focus:border-track-orange"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-[0.65rem] text-track-muted">{t("garage_ride_height_rear")}</label>
              <input
                type="number"
                inputMode="decimal"
                value={rideHeightRear}
                onChange={(e) => setRideHeightRear(e.target.value)}
                className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-2.5 text-sm outline-none focus:border-track-orange"
              />
            </div>
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-track-muted">
            {t("garage_diff_oil")}
          </p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-[0.65rem] text-track-muted">{t("garage_diff_front")}</label>
              <input
                value={diffOilFront}
                onChange={(e) => setDiffOilFront(e.target.value)}
                placeholder="cst"
                className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-2.5 text-sm outline-none focus:border-track-orange"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-[0.65rem] text-track-muted">{t("garage_diff_center")}</label>
              <input
                value={diffOilCenter}
                onChange={(e) => setDiffOilCenter(e.target.value)}
                placeholder="cst"
                className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-2.5 text-sm outline-none focus:border-track-orange"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-[0.65rem] text-track-muted">{t("garage_diff_rear")}</label>
              <input
                value={diffOilRear}
                onChange={(e) => setDiffOilRear(e.target.value)}
                placeholder="cst"
                className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-2.5 text-sm outline-none focus:border-track-orange"
              />
            </div>
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-track-muted">
            {t("garage_shock_oil")}
          </p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-[0.65rem] text-track-muted">{t("garage_shock_front")}</label>
              <input
                value={shockOilFront}
                onChange={(e) => setShockOilFront(e.target.value)}
                placeholder="cst"
                className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-2.5 text-sm outline-none focus:border-track-orange"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-[0.65rem] text-track-muted">{t("garage_shock_rear")}</label>
              <input
                value={shockOilRear}
                onChange={(e) => setShockOilRear(e.target.value)}
                placeholder="cst"
                className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-2.5 text-sm outline-none focus:border-track-orange"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
            {t("garage_notes")}
          </label>
          <p className="mb-1 text-xs text-track-muted">{t("garage_notes_hint")}</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
          />
        </div>

        <label className="flex items-start gap-3 rounded-lg border border-track-border bg-track-surface2 p-3">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-track-orange"
          />
          <span>
            <span className="block text-sm font-semibold">{t("garage_public_toggle")}</span>
            <span className="block text-xs text-track-muted">{t("garage_public_hint")}</span>
          </span>
        </label>

        {error && <p className="text-sm text-track-red">{error}</p>}

        <Button onClick={handleSubmit} disabled={saving} className="w-full">
          {saving ? t("profile_saving") : t("garage_save_setup")}
        </Button>
      </div>
    </div>
  );
}
