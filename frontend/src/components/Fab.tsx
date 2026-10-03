import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";


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
    <Button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-24 right-4 z-30 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:translate-y-0 hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6"
    >
      {children ?? <Plus size={24} aria-hidden />}
    </Button>,
    document.body,
  );
}
