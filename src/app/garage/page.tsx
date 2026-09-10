"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Button from "@/components/ui/Button";
import CarFormModal from "@/components/garage/CarFormModal";
import { fetchMyCars } from "@/lib/firebase/cars";
import { fetchTaxonomies } from "@/lib/firebase/tracks";
import type { Car, Taxonomy } from "@/types";

export default function GaragePage() {
  const { user, profile, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [cars, setCars] = useState<Car[]>([]);
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [busy, setBusy] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  const load = useCallback(() => {
    if (!user) return;
    setBusy(true);
    Promise.all([fetchMyCars(user.uid), fetchTaxonomies()]).then(([c, tax]) => {
      setCars(c);
      setTaxonomies(tax);
      setBusy(false);
    });
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const taxLabel = (id: string | null) => (id ? taxonomies.find((t) => t.id === id)?.label : null);

  if (loading || !user || !profile) {
    return <p className="pt-8 text-center text-track-muted">…</p>;
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div>
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-track-orange">
          {profile.displayName}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold">🔧 {t("garage_title")}</h1>
      </div>

      <Button onClick={() => setModalOpen(true)}>{t("garage_add_car")}</Button>

      {busy && <p className="text-center text-sm text-track-muted">{t("home_loading")}</p>}

      {!busy && cars.length === 0 && (
        <p className="text-center text-sm text-track-muted">{t("garage_no_cars")}</p>
      )}

      <div className="flex flex-col gap-3">
        {cars.map((car) => (
          <Link
            key={car.id}
            href={`/garage/${car.id}`}
            className="flex items-center gap-3 rounded-xl2 border border-track-border bg-track-surface p-3"
          >
            {car.photoURL ? (
              <span className="relative block h-16 w-16 overflow-hidden rounded-lg">
                <Image src={car.photoURL} alt={car.name} fill sizes="64px" className="object-cover" />
              </span>
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-track-surface2 text-2xl">
                🏎️
              </span>
            )}
            <div>
              <p className="font-display text-base font-bold">{car.name}</p>
              <p className="text-xs text-track-muted">
                {[taxLabel(car.disciplineId), taxLabel(car.scaleId)].filter(Boolean).join(" · ") ||
                  t("garage_not_specified")}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {modalOpen && (
        <CarFormModal
          ownerUid={user.uid}
          ownerName={profile.displayName}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
