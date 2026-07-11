import clsx from "clsx";
import CertaintyGauge from "@/components/ui/CertaintyGauge";
import { useLanguage } from "@/contexts/LanguageContext";
import type { CertaintyLevel } from "@/types";

const LEVELS: CertaintyLevel[] = [25, 50, 75, 100];

export default function CertaintyPicker({
  value,
  onChange,
}: {
  value: CertaintyLevel;
  onChange: (v: CertaintyLevel) => void;
}) {
  const { t } = useLanguage();
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-track-muted">
        {t("session_certainty")}
      </p>
      <div className="flex justify-between gap-2">
        {LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            className={clsx(
              "flex flex-1 flex-col items-center gap-1 rounded-xl2 border py-2 transition-colors",
              value === level ? "border-track-orange bg-track-orange/10" : "border-track-border"
            )}
          >
            <CertaintyGauge value={level} size={40} />
          </button>
        ))}
      </div>
    </div>
  );
}
