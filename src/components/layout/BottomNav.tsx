"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Home, CalendarDays, MapPin, Flag, PartyPopper, UserRound } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/i18n/translations";

const ITEMS: { href: string; key: TranslationKey; icon: typeof Home }[] = [
  { href: "/", key: "nav_home", icon: Home },
  { href: "/agenda", key: "nav_agenda", icon: CalendarDays },
  { href: "/carte", key: "nav_map", icon: MapPin },
  { href: "/pistes", key: "nav_tracks", icon: Flag },
  { href: "/evenements", key: "nav_events", icon: PartyPopper },
  { href: "/profil", key: "nav_profile", icon: UserRound },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1000] border-t border-track-border bg-track-surface/95 backdrop-blur">
      <ul className="mx-auto flex max-w-3xl items-stretch justify-between px-1">
        {ITEMS.map(({ href, key, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className="flex flex-col items-center gap-1 py-2.5 text-[0.65rem] font-display font-semibold uppercase tracking-wide"
              >
                <Icon
                  size={20}
                  strokeWidth={2.25}
                  className={clsx(active ? "text-track-orange" : "text-track-muted")}
                />
                <span className={clsx(active ? "text-track-white" : "text-track-muted")}>{t(key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
