"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Home, CalendarDays, MapPin, Flag, PartyPopper, UserRound } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/carte", label: "Carte", icon: MapPin },
  { href: "/pistes", label: "Pistes", icon: Flag },
  { href: "/evenements", label: "Events", icon: PartyPopper },
  { href: "/profil", label: "Profil", icon: UserRound },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1000] border-t border-track-border bg-track-surface/95 backdrop-blur">
      <ul className="mx-auto flex max-w-3xl items-stretch justify-between px-1">
        {ITEMS.map(({ href, label, icon: Icon }) => {
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
                <span className={clsx(active ? "text-track-white" : "text-track-muted")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
