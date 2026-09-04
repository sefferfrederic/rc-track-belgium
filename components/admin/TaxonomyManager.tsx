"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createTaxonomy, deleteTaxonomy } from "@/lib/firebase/tracks";
import Button from "@/components/ui/Button";
import type { Taxonomy } from "@/types";

const TYPE_LABELS: Record<Taxonomy["type"], string> = {
  discipline: "Disciplines",
  surface: "Surfaces",
  scale: "Échelles",
};

export default function TaxonomyManager({
  taxonomies,
  onChanged,
}: {
  taxonomies: Taxonomy[];
  onChanged: () => void;
}) {
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<Taxonomy["type"]>("scale");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!newLabel.trim()) return;
    setSaving(true);
    try {
      await createTaxonomy(newLabel.trim(), newType);
      setNewLabel("");
      onChanged();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette catégorie ? Les pistes qui l'utilisent la perdront.")) return;
    await deleteTaxonomy(id);
    onChanged();
  }

  return (
    <div className="rounded-xl2 border border-track-border bg-track-surface p-4">
      <p className="font-display text-sm font-bold uppercase">Gérer les catégories</p>
      <p className="mt-1 text-xs text-track-muted">
        Ajoute librement des disciplines, surfaces ou échelles (ex. &quot;1/8&quot;, &quot;Tamiya
        TC&quot;...). Elles apparaîtront aussitôt dans le formulaire des pistes.
      </p>

      <div className="mt-3 flex gap-2">
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value as Taxonomy["type"])}
          className="rounded-lg border border-track-border bg-track-surface2 px-3 py-2 text-sm outline-none focus:border-track-orange"
        >
          <option value="discipline">Discipline</option>
          <option value="surface">Surface</option>
          <option value="scale">Échelle</option>
        </select>
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Nom (ex : 1/8)"
          className="flex-1 rounded-lg border border-track-border bg-track-surface2 px-3 py-2 text-sm outline-none focus:border-track-orange"
        />
        <Button onClick={handleAdd} disabled={saving || !newLabel.trim()}>
          Ajouter
        </Button>
      </div>

      {(["discipline", "surface", "scale"] as const).map((type) => {
        const items = taxonomies.filter((t) => t.type === type);
        if (items.length === 0) return null;
        return (
          <div key={type} className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-track-muted">
              {TYPE_LABELS[type]}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {items.map((t) => (
                <span
                  key={t.id}
                  className="flex items-center gap-1 rounded-full border border-track-border px-3 py-1 text-xs"
                >
                  {t.label}
                  <button onClick={() => handleDelete(t.id)} aria-label={`Supprimer ${t.label}`}>
                    <X size={12} className="text-track-muted hover:text-track-red" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
