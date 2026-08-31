"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Button from "@/components/ui/Button";
import { createListing, type ListingInput } from "@/lib/firebase/listings";
import type { ListingCategory } from "@/types";

const CATEGORY_OPTIONS: { id: ListingCategory; fr: string; nl: string }[] = [
  { id: "voiture_complete", fr: "Voiture complète", nl: "Volledige auto" },
  { id: "chassis", fr: "Châssis / voiture seule", nl: "Chassis / auto alleen" },
  { id: "electronique", fr: "Électronique", nl: "Elektronica" },
  { id: "moteur", fr: "Moteur", nl: "Motor" },
  { id: "esc", fr: "ESC (variateur)", nl: "ESC (regelaar)" },
  { id: "servo", fr: "Servo", nl: "Servo" },
  { id: "radio", fr: "Télécommande / radio", nl: "Afstandsbediening / radio" },
];

export default function ListingFormModal({
  sellerUid,
  onClose,
  onSaved,
}: {
  sellerUid: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { profile } = useAuth();
  const { locale, t } = useLanguage();
  const [category, setCategory] = useState<ListingCategory>("voiture_complete");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [photoURLs, setPhotoURLs] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || photoURLs.length >= 2) return;
    setUploading(true);
    try {
      const path = `listings/${sellerUid}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setPhotoURLs((prev) => [...prev, url]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removePhoto(url: string) {
    setPhotoURLs((prev) => prev.filter((p) => p !== url));
  }

  async function handleSubmit() {
    const priceNum = Number(price);
    if (!title.trim() || !priceNum || priceNum <= 0) {
      setError(t("vente_form_missing"));
      return;
    }
    if (!accepted) {
      setError(t("vente_form_accept_required"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input: ListingInput = {
        category,
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        photoURLs,
      };
      await createListing(input, sellerUid, profile?.displayName ?? "");
      onSaved();
    } catch {
      setError(locale === "nl" ? "Kan niet opslaan, probeer opnieuw." : "Impossible d'enregistrer, réessaie.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-xl2 border border-track-border bg-track-surface p-5 md:rounded-xl2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold uppercase">{t("vente_new_listing")}</h2>
          <button onClick={onClose} aria-label={t("close")}>
            <X size={20} className="text-track-muted" />
          </button>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
            {t("vente_form_category")}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ListingCategory)}
            className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {locale === "nl" ? c.nl : c.fr}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
            {t("vente_form_title")}
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
            {t("vente_form_price")}
          </label>
          <input
            type="number"
            min="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="€"
            className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
            {t("vente_form_description")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
            {t("vente_form_photos")} ({photoURLs.length}/2)
          </label>
          <div className="flex gap-2">
            {photoURLs.map((url) => (
              <div key={url} className="relative h-20 w-20">
                <img src={url} alt="" className="h-full w-full rounded-lg object-cover" />
                <button
                  onClick={() => removePhoto(url)}
                  className="absolute -right-1 -top-1 rounded-full bg-track-red p-0.5 text-white"
                  aria-label={t("garage_delete")}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          {photoURLs.length < 2 && (
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              disabled={uploading}
              className="mt-2 text-sm"
            />
          )}
        </div>

        <label className="flex items-start gap-2 rounded-lg border border-dashed border-track-orange/50 bg-track-orange/5 p-3 text-sm">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5"
          />
          <span>{t("vente_form_accept_30days")}</span>
        </label>

        {error && <p className="text-sm text-track-red">{error}</p>}

        <Button onClick={handleSubmit} disabled={saving || uploading} className="w-full">
          {saving ? t("vente_form_publishing") : t("vente_form_publish")}
        </Button>
      </div>
    </div>
  );
}
