import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type Profile = { email: string; fullName: string | null };

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

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

  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  return (
    <Link
      to="/settings"
      className="grid size-11 place-items-center rounded-full bg-violet-100 text-sm font-bold text-primary shadow-sm transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label="Mở trang cá nhân"
      title={profile?.fullName || profile?.email || "Cá nhân"}
    >
      {initials(profile)}
    </Link>
  );
}
