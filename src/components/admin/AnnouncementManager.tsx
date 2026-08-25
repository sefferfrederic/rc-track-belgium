"use client";

import { useState } from "react";
import clsx from "clsx";
import { useLanguage } from "@/contexts/LanguageContext";
import Button from "@/components/ui/Button";
import {
  createAnnouncement,
  setAnnouncementActive,
  deleteAnnouncement,
} from "@/lib/firebase/announcements";
import type { Announcement, AnnouncementType } from "@/types";

const TYPE_STYLES: Record<AnnouncementType, string> = {
  info: "border-track-border",
  important: "border-track-red",
  evenement: "border-track-orange",
};

export default function AnnouncementManager({
  announcements,
  createdBy,
  onChanged,
}: {
  announcements: Announcement[];
  createdBy: string;
  onChanged: () => void;
}) {
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<AnnouncementType>("info");
  const [saving, setSaving] = useState(false);

  async function handlePublish() {
    if (!title.trim() || !message.trim()) return;
    setSaving(true);
    try {
      await createAnnouncement({ title: title.trim(), message: message.trim(), type }, createdBy);
      setTitle("");
      setMessage("");
      setType("info");
      onChanged();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(a: Announcement) {
    await setAnnouncementActive(a.id, !a.active);
    onChanged();
  }

  async function handleDelete(id: string) {
    if (!confirm(t("admin_announcement_delete_confirm"))) return;
    await deleteAnnouncement(id);
    onChanged();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl2 border border-track-border bg-track-surface p-4">
        <p className="font-display text-sm font-bold uppercase">{t("admin_announcement_new")}</p>

        <div className="mt-3 flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-track-muted">
              {t("admin_announcement_title")}
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-track-border bg-track-surface2 px-3 py-2 text-sm outline-none focus:border-track-orange"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-track-muted">
              {t("admin_announcement_message")}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-track-border bg-track-surface2 px-3 py-2 text-sm outline-none focus:border-track-orange"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-track-muted">
              {t("admin_announcement_type")}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AnnouncementType)}
              className="mt-1 w-full rounded-lg border border-track-border bg-track-surface2 px-3 py-2 text-sm outline-none focus:border-track-orange"
            >
              <option value="info">{t("admin_announcement_type_info")}</option>
              <option value="important">{t("admin_announcement_type_important")}</option>
              <option value="evenement">{t("admin_announcement_type_evenement")}</option>
            </select>
          </div>

          <Button onClick={handlePublish} disabled={saving || !title.trim() || !message.trim()}>
            {saving ? t("admin_announcement_publishing") : t("admin_announcement_publish")}
          </Button>
        </div>
      </div>

      <div>
        <p className="font-display text-sm font-bold uppercase">{t("admin_announcement_history")}</p>

        {announcements.length === 0 && (
          <p className="mt-2 text-sm text-track-muted">{t("admin_announcement_none")}</p>
        )}

        <div className="mt-2 flex flex-col gap-3">
          {announcements.map((a) => (
            <div
              key={a.id}
              className={clsx("rounded-xl2 border bg-track-surface p-4", TYPE_STYLES[a.type])}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-base font-bold">{a.title}</p>
                <span
                  className={clsx(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold uppercase",
                    a.active ? "bg-track-orange/10 text-track-orange" : "text-track-muted"
                  )}
                >
                  {a.active ? t("admin_announcement_active") : t("admin_announcement_inactive")}
                </span>
              </div>
              <p className="mt-1 text-sm text-track-muted">{a.message}</p>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" onClick={() => handleToggle(a)}>
                  {a.active ? t("admin_announcement_deactivate") : t("admin_announcement_activate")}
                </Button>
                <Button variant="ghost" onClick={() => handleDelete(a.id)}>
                  {t("admin_announcement_delete")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
