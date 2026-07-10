"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { fetchTracks, fetchTaxonomies } from "@/lib/firebase/tracks";
import { useAuth } from "@/contexts/AuthContext";
import SessionFormModal from "@/components/session/SessionFormModal";
import type { Track, Taxonomy } from "@/types";

// Belgique : centre approximatif + zoom qui montre tout le pays
const BELGIUM_CENTER: [number, number] = [50.6, 4.6];
const BELGIUM_ZOOM = 8;

// Une seule discipline = une couleur de la palette de marque (cohérence visuelle stricte)
const DISCIPLINE_COLORS: Record<string, string> = {
  "discipline-tt": "#E8102B", // rouge — tout-terrain, le plus "brut"
  "discipline-onroad": "#FF6A00", // orange — vitesse sur asphalte
  "discipline-indoor": "#FFC700", // jaune — lumière de salle
  "discipline-crawler": "#F5F5F7", // blanc — technique, neutre
};

function markerIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:22px;height:22px;border-radius:50%;
      background:${color};
      border:2.5px solid #0A0A0C;
      box-shadow:0 0 0 1px ${color}55;
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
}

export default function TracksMap() {
  const { user } = useAuth();
  const router = useRouter();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDiscipline, setActiveDiscipline] = useState<string | null>(null);
  const [sessionTrackId, setSessionTrackId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchTracks(), fetchTaxonomies()]).then(([t, tax]) => {
      setTracks(t);
      setTaxonomies(tax.filter((x) => x.type === "discipline"));
      setLoading(false);
    });
  }, []);

  const filteredTracks = useMemo(
    () =>
      activeDiscipline ? tracks.filter((t) => t.disciplineIds.includes(activeDiscipline)) : tracks,
    [tracks, activeDiscipline]
  );

  const disciplineLabel = (id: string) => taxonomies.find((t) => t.id === id)?.label ?? id;

  function handleCreateHere(trackId: string) {
    if (!user) {
      router.push("/login");
      return;
    }
    setSessionTrackId(trackId);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Filtres par discipline */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveDiscipline(null)}
          className={`rounded-full border px-3 py-1.5 text-xs font-display font-semibold uppercase tracking-wide transition-colors ${
            activeDiscipline === null
              ? "border-track-orange bg-track-orange/10 text-track-white"
              : "border-track-border text-track-muted"
          }`}
        >
          Toutes ({tracks.length})
        </button>
        {taxonomies.map((tax) => {
          const count = tracks.filter((t) => t.disciplineIds.includes(tax.id)).length;
          return (
            <button
              key={tax.id}
              onClick={() => setActiveDiscipline(tax.id)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-display font-semibold uppercase tracking-wide transition-colors ${
                activeDiscipline === tax.id
                  ? "border-track-orange bg-track-orange/10 text-track-white"
                  : "border-track-border text-track-muted"
              }`}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: DISCIPLINE_COLORS[tax.id] ?? "#8C8C96" }}
              />
              {tax.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="h-[60vh] w-full overflow-hidden rounded-xl2 border border-track-border">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-track-muted">
            Chargement des pistes…
          </div>
        ) : (
          <MapContainer
            center={BELGIUM_CENTER}
            zoom={BELGIUM_ZOOM}
            style={{ height: "100%", width: "100%", background: "#E5E3DF" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            {filteredTracks.map((track) => {
              const mainDiscipline = track.disciplineIds[0];
              const color = DISCIPLINE_COLORS[mainDiscipline] ?? "#8C8C96";
              return (
                <Marker key={track.id} position={[track.lat, track.lng]} icon={markerIcon(color)}>
                  <Popup className="track-popup">
                    <div className="font-body text-sm text-track-white">
                      <p className="font-display text-base font-bold text-track-white">{track.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-track-muted">
                        {track.disciplineIds.map(disciplineLabel).join(" · ")}
                      </p>
                      {track.website && (
                        <a
                          href={track.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-xs font-semibold text-track-orange underline"
                        >
                          Voir le site du club →
                        </a>
                      )}
                      <button
                        onClick={() => handleCreateHere(track.id)}
                        className="mt-3 w-full rounded-full bg-flag-gradient px-3 py-2 text-xs font-display font-semibold uppercase tracking-wide text-track-bg"
                      >
                        Créer une session ici
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>
      <p className="text-xs text-track-muted">
        {filteredTracks.length} piste{filteredTracks.length > 1 ? "s" : ""} affichée
        {filteredTracks.length > 1 ? "s" : ""}. Le niveau d'activité en temps réel (vert/orange/rouge)
        arrivera plus tard.
      </p>

      {sessionTrackId && (
        <SessionFormModal
          fixedTrackId={sessionTrackId}
          onClose={() => setSessionTrackId(null)}
          onSaved={() => setSessionTrackId(null)}
        />
      )}
    </div>
  );
}
