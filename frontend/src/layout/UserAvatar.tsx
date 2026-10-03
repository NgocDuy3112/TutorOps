import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { API } from "../lib/api";

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
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API}/auth/me`)
      .then((response) => (response.ok ? response.json() : null))
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => navigate("/settings")}
        className="rounded-full bg-violet-100 text-sm font-bold text-primary shadow-sm hover:translate-y-0 hover:scale-105 hover:bg-violet-100 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label="Mở cài đặt"
        title={profile?.fullName || profile?.email || "Cá nhân"}
      >
        {initials(profile)}
      </Button>
    </>
  );
}
