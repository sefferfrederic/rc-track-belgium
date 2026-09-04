"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import { compressImage } from "@/lib/compressImage";
import { fetchTaxonomies } from "@/lib/firebase/tracks";
import { createCar, updateCar, type CarInput } from "@/lib/firebase/cars";
import { useLanguage } from "@/contexts/LanguageContext";
import Button from "@/components/ui/Button";
import type { Taxonomy, Car } from "@/types";

export default function CarFormModal({
  car,
  ownerUid,
  ownerName,
  onClose,
  onSaved,
}: {
  car?: Car | null;
  ownerUid: string;
  ownerName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t, locale } = useLanguage();
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [name, setName] = useState(car?.name ?? "");
  const [disciplineId, setDisciplineId] = useState(car?.disciplineId ?? "");
  const [scaleId, setScaleId] = useState(car?.scaleId ?? "");
  const [photoURL, setPhotoURL] = useState<string | null>(car?.photoURL ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTaxonomies().then(setTaxonomies);
  }, []);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    const path = `cars/${ownerUid}/${Date.now()}-${compressed.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, compressed);
    const url = await getDownloadURL(storageRef);
    setPhotoURL(url);
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError(locale === "nl" ? "Geef een naam op." : "Indique un nom.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input: CarInput = {
        name: name.trim(),
        disciplineId: disciplineId || null,
        scaleId: scaleId || null,
        photoURL,
      };
      if (car) {
        await updateCar(car.id, input);
      } else {
        await createCar(input, ownerUid, ownerName);
      }
      onSaved();
    } catch {
      setError(locale === "nl" ? "Kan niet opslaan, probeer opnieuw." : "Impossible d'enregistrer, réessaie.");
    } finally {
      setSaving(false);
    }
  }

  const disciplines = taxonomies.filter((tx) => tx.type === "discipline");
  const scales = taxonomies.filter((tx) => tx.type === "scale");

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-xl2 border border-track-border bg-track-surface p-5 md:rounded-xl2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold uppercase">
            {car ? t("garage_edit") : t("garage_add_car")}
          </h2>
          <button onClick={onClose} aria-label={t("close")}>
            <X size={20} className="text-track-muted" />
          </button>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
            {t("garage_car_name")}
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("garage_car_name_hint")}
            className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
            {t("session_discipline")}
          </label>
          <select
            value={disciplineId}
            onChange={(e) => setDisciplineId(e.target.value)}
            className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
          >
            <option value="">{t("garage_not_specified")}</option>
            {disciplines.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
            {t("session_scale")}
          </label>
          <select
            value={scaleId}
            onChange={(e) => setScaleId(e.target.value)}
            className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
          >
            <option value="">{t("garage_not_specified")}</option>
            {scales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
            Photo
          </label>
          {photoURL && (
            <div className="relative mb-2 h-32 w-full overflow-hidden rounded-lg">
              <Image src={photoURL} alt="" fill sizes="400px" className="object-cover" />
            </div>
          )}
          <input type="file" accept="image/*" onChange={handlePhotoChange} className="text-sm" />
        </div>

        {error && <p className="text-sm text-track-red">{error}</p>}

        <Button onClick={handleSubmit} disabled={saving} className="w-full">
          {saving ? t("profile_saving") : t("profile_save")}
        </Button>
      </div>
    </div>
  );
}
