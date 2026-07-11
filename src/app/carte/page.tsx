"use client";

import dynamic from "next/dynamic";
import { useLanguage } from "@/contexts/LanguageContext";

const TracksMap = dynamic(() => import("@/components/map/TracksMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] items-center justify-center rounded-xl2 border border-track-border text-sm text-track-muted">
      Chargement de la carte…
    </div>
  ),
});

export default function CartePage() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-4 pt-2">
      <div>
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-track-orange">
          Belgique
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold">{t("map_title")}</h1>
      </div>
      <TracksMap />
    </div>
  );
}
