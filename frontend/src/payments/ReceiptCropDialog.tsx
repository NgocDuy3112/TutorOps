import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ReceiptCropDialog({
  imageUrl,
  onOpenChange,
  onCropped,
}: {
  imageUrl: string | null;
  onOpenChange: (open: boolean) => void;
  onCropped: (area: Area) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);

  const complete = useCallback((_area: Area, pixels: Area) => setArea(pixels), []);

  return (
    <Dialog open={Boolean(imageUrl)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Crop biên lai</DialogTitle></DialogHeader>
        <div className="relative h-[min(65dvh,420px)] overflow-hidden rounded-xl bg-slate-950">
          {imageUrl && <Cropper image={imageUrl} crop={crop} zoom={zoom} aspect={4 / 3} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={complete} />}
        </div>
        <input aria-label="Thu phóng ảnh" type="range" min={1} max={3} step={0.1} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
        <Button type="button" className="min-h-12 w-full" disabled={!area} onClick={() => area && onCropped(area)}>Crop & đọc biên lai</Button>
      </DialogContent>
    </Dialog>
  );
}
