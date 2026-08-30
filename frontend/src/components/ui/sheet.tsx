import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-slate-900/40 data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out",
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const startY = React.useRef(0);
  const startTime = React.useRef(0);

  React.useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    function onTouchStart(e: TouchEvent) {
      // Only allow drag from the handle area or top 40px
      const rect = el!.getBoundingClientRect();
      const touchY = e.touches[0].clientY - rect.top;
      if (touchY > 40) return;

      startY.current = e.touches[0].clientY;
      startTime.current = Date.now();
      setIsDragging(true);
    }

    function onTouchMove(e: TouchEvent) {
      if (!isDragging) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0) {
        setDragOffset(delta);
      }
    }

    function onTouchEnd() {
      if (!isDragging) return;
      const elapsed = Date.now() - startTime.current;
      const velocity = dragOffset / elapsed;
      const shouldDismiss = dragOffset > 100 || velocity > 0.5;

      if (shouldDismiss) {
        setDragOffset(el!.offsetHeight); // animate out
        setTimeout(() => {
          setDragOffset(0);
          setIsDragging(false);
          // Trigger close via Radix
          el!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        }, 150);
      } else {
        setDragOffset(0);
        setIsDragging(false);
      }
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDragging, dragOffset]);

  return (
    <DialogPrimitive.Portal>
      <SheetOverlay />
      <DialogPrimitive.Content
        ref={(node) => {
          contentRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-3xl bg-background shadow-lg data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out sm:inset-x-auto sm:right-0 sm:bottom-0 sm:top-0 sm:w-full sm:max-w-md sm:rounded-l-3xl sm:rounded-tr-none",
          isDragging && "transition-none",
          className,
        )}
        style={{
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          opacity: dragOffset > 0 ? 1 - dragOffset / 500 : undefined,
        }}
        {...props}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <span className="h-1.5 w-12 rounded-full bg-slate-300" />
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-6">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
SheetContent.displayName = "SheetContent";

export const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-1.5 pb-4 text-left", className)}
    {...props}
  />
);

export const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
));
SheetTitle.displayName = DialogPrimitive.Title.displayName;

export const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = DialogPrimitive.Description.displayName;
