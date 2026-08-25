"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Button from "@/components/ui/Button";
import CarFormModal from "@/components/garage/CarFormModal";
import SetupFormModal from "@/components/garage/SetupFormModal";
import {
  fetchCar,
  fetchSetupsForCar,
  deleteCar,
  deleteSetup,
} from "@/lib/firebase/cars";
import { fetchTracks, fetchTaxonomies } from "@/lib/firebase/tracks";
import type { Car, CarSetup, Track, Taxonomy } from "@/types";

const WEATHER_ICON: Record<string, string> = { sec: "☀️", nuageux: "☁️", pluie: "🌧️" };

export default function CarDetailPage({ params }: { params: { carId: string } }) {
  const { carId } = params;
  const { user, profile, loading } = useAuth();
  const { t, locale } = useLanguage();
  const router = useRouter();

  const [car, setCar] = useState<Car | null>(null);
  const [setups, setSetups] = useState<CarSetup[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [busy, setBusy] = useState(true);
  const [editCarOpen, setEditCarOpen] = useState(false);
  const [setupModal, setSetupModal] = useState<{ open: boolean; setup: CarSetup | null }>({
    open: false,
    setup: null,
  });

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  const load = useCallback(() => {
    setBusy(true);
    Promise.all([fetchCar(carId), fetchSetupsForCar(carId), fetchTracks(), fetchTaxonomies()]).then(
      ([c, s, t, tax]) => {
        setCar(c);
        setSetups(s);
        setTracks(t);
        setTaxonomies(tax);
        setBusy(false);
      }
    );
  }, [carId]);

  useEffect(() => {
    load();
  }, [load]);

  const trackName = (id: string | null) => (id ? tracks.find((t) => t.id === id)?.name : null);
  const taxLabel = (id: string | null) => (id ? taxonomies.find((t) => t.id === id)?.label : null);

  async function handleDeleteCar() {
    if (!confirm(t("garage_delete_car_confirm"))) return;
    await deleteCar(carId);
    router.push("/garage");
  }

  async function handleDeleteSetup(setupId: string) {
    if (!confirm(t("garage_delete_setup_confirm"))) return;
    await deleteSetup(carId, setupId);
    load();
  }

  if (loading || busy || !user || !profile) {
    return <p className="pt-8 text-center text-track-muted">…</p>;
  }

  if (!car) {
    return <p className="pt-8 text-center text-track-muted">{t("garage_not_specified")}</p>;
  }

  const isOwner = car.ownerUid === user.uid;

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Link href="/garage" className="flex items-center gap-1 text-sm text-track-muted hover:text-track-white">
        <ChevronLeft size={16} /> {t("garage_back")}
      </Link>

      <div className="flex items-center gap-3">
        {car.photoURL ? (
          <img src={car.photoURL} alt={car.name} className="h-20 w-20 rounded-xl2 object-cover" />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-xl2 bg-track-surface2 text-3xl">
            🏎️
          </span>
        )}
        <div>
          <h1 className="font-display text-2xl font-bold">{car.name}</h1>
          <p className="text-xs text-track-muted">
            {[taxLabel(car.disciplineId), taxLabel(car.scaleId)].filter(Boolean).join(" · ") ||
              t("garage_not_specified")}
          </p>
        </div>
      </div>

      {isOwner && (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setEditCarOpen(true)} className="flex-1">
            {t("garage_edit")}
          </Button>
          <Button variant="ghost" onClick={handleDeleteCar}>
            {t("garage_delete_car")}
          </Button>
        </div>
      )}

      {isOwner && (
        <Button
          onClick={() => setSetupModal({ open: true, setup: null })}
          className="w-full"
        >
          {t("garage_new_setup")}
        </Button>
      )}

      {setups.length === 0 && (
        <p className="text-center text-sm text-track-muted">{t("garage_no_setups")}</p>
      )}

      <div className="flex flex-col gap-3">
        {setups.map((s) => (
          <div key={s.id} className="rounded-xl2 border border-track-border bg-track-surface p-4">
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-bold">
                {new Date(`${s.date}T00:00:00`).toLocaleDateString(locale === "nl" ? "nl-BE" : "fr-BE", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              {s.isPublic && (
                <span className="rounded-full bg-track-orange/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-track-orange">
                  {locale === "nl" ? "Openbaar" : "Public"}
                </span>
              )}
            </div>

            {trackName(s.trackId) && <p className="text-xs text-track-muted">{trackName(s.trackId)}</p>}

            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-track-muted">
              {s.weather && <span>{WEATHER_ICON[s.weather]} {t(`garage_weather_${s.weather}` as any)}</span>}
              {taxLabel(s.surfaceId) && <span>🏁 {taxLabel(s.surfaceId)}</span>}
              {s.gripLevel && <span>🛞 {t(`garage_grip_${s.gripLevel}` as any)}</span>}
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

            {isOwner && (
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" onClick={() => setSetupModal({ open: true, setup: s })}>
                  {t("garage_edit")}
                </Button>
                <Button variant="ghost" onClick={() => handleDeleteSetup(s.id)}>
                  {t("garage_delete")}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {editCarOpen && (
        <CarFormModal
          car={car}
          ownerUid={car.ownerUid}
          ownerName={car.ownerName}
          onClose={() => setEditCarOpen(false)}
          onSaved={() => {
            setEditCarOpen(false);
            load();
          }}
        />
      )}

      {setupModal.open && (
        <SetupFormModal
          carId={car.id}
          carName={car.name}
          authorUid={user.uid}
          authorName={profile.displayName}
          setup={setupModal.setup}
          onClose={() => setSetupModal({ open: false, setup: null })}
          onSaved={() => {
            setSetupModal({ open: false, setup: null });
            load();
          }}
        />
      )}
    </div>
  );
}
