import { useEffect, useState } from "react";
import { API } from "../lib/api";
import { SettingsSheet } from "../settings/SettingsSheet";

type Profile = { email: string; fullName: string | null };

const initials = (profile: Profile | null) => {
  const source = profile?.fullName?.trim() || profile?.email || "T";
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

export function UserAvatar() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch(`${API}/auth/me`)
      .then((response) => (response.ok ? response.json() : null))
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid size-11 place-items-center rounded-full bg-violet-100 text-sm font-bold text-primary shadow-sm transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Mở menu cá nhân"
        aria-haspopup="dialog"
        title={profile?.fullName || profile?.email || "Cá nhân"}
      >
        {initials(profile)}
      </button>
      <SettingsSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
