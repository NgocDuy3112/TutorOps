import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";


export function Fab({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children?: ReactNode;
}) {
  return createPortal(
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-24 right-4 z-30 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6"
    >
      {children ?? <Plus size={24} aria-hidden />}
    </button>,
    document.body,
  );
}
