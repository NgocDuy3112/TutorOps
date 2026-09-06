import type { ReactNode } from "react";
import { Plus } from "lucide-react";

/**
 * Floating action button, bottom-right. Sits above the mobile bottom nav
 * (bottom-24 clears nav + safe area); docks to the corner on desktop.
 */
export function Fab({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-24 right-4 z-30 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6"
    >
      {children ?? <Plus size={24} aria-hidden />}
    </button>
  );
}
