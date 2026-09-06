export const VENUE_OPTIONS = [
  { value: "home", label: "Ở nhà" },
  { value: "center", label: "Trung tâm" },
  { value: "online", label: "Online" },
] as const;

export type Venue = (typeof VENUE_OPTIONS)[number]["value"];

export function venueLabel(venue?: string | null): string | null {
  if (!venue) return null;
  return VENUE_OPTIONS.find((option) => option.value === venue)?.label ?? null;
}
