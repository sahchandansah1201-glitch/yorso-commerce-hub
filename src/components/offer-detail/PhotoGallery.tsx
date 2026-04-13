import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Maximize2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { GalleryImage } from "@/data/mockOffers";

interface Props {
  gallery: GalleryImage[];
  productName: string;
  photoSourceLabel: string;
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0 }),
};

const PhotoGallery = ({ gallery, productName, photoSourceLabel }: Props) => {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const touchStart = useRef<number | null>(null);
  const pinchStart = useRef<number | null>(null);
  const zoomStart = useRef(1);
  const panStart = useRef({ x: 0, y: 0 });
  const lastPanPoint = useRef({ x: 0, y: 0 });
  const lastTap = useRef(0);

  const imgs = gallery.length > 0
    ? gallery
    : [{ src: "/placeholder.svg", alt: productName, caption: "", sourceLabel: "" }];

  const goPrev = () => { setDirection(-1); setZoom(1); setPan({ x: 0, y: 0 }); setActive((p) => (p === 0 ? imgs.length - 1 : p - 1)); };
  const goNext = () => { setDirection(1); setZoom(1); setPan({ x: 0, y: 0 }); setActive((p) => (p === imgs.length - 1 ? 0 : p + 1)); };
  const goTo = (i: number) => { setDirection(i > active ? 1 : -1); setActive(i); };

  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(diff) > 50) { diff > 0 ? goPrev() : goNext(); }
    touchStart.current = null;
  };

  const getDistance = (t: React.TouchList) => {
    const dx = t[0].clientX - t[1].clientX;
    const dy = t[0].clientY - t[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getMidpoint = (t: React.TouchList) => ({
    x: (t[0].clientX + t[1].clientX) / 2,
    y: (t[0].clientY + t[1].clientY) / 2,
  });

  const onLightboxTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      pinchStart.current = getDistance(e.touches);
      zoomStart.current = zoom;
      panStart.current = { ...pan };
      lastPanPoint.current = getMidpoint(e.touches);
    } else if (e.touches.length === 1 && zoom > 1) {
      lastPanPoint.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStart.current = { ...pan };
    } else if (e.touches.length === 1) {
      touchStart.current = e.touches[0].clientX;
    }
  };

  const onLightboxTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStart.current !== null) {
      e.preventDefault();
      const newDist = getDistance(e.touches);
      const scale = Math.min(Math.max(zoomStart.current * (newDist / pinchStart.current), 1), 4);
      setZoom(scale);
      const mid = getMidpoint(e.touches);
      setPan({
        x: panStart.current.x + (mid.x - lastPanPoint.current.x),
        y: panStart.current.y + (mid.y - lastPanPoint.current.y),
      });
    } else if (e.touches.length === 1 && zoom > 1) {
      setPan({
        x: panStart.current.x + (e.touches[0].clientX - lastPanPoint.current.x),
        y: panStart.current.y + (e.touches[0].clientY - lastPanPoint.current.y),
      });
    }
  };

  const onLightboxTouchEnd = (e: React.TouchEvent) => {
    if (pinchStart.current !== null && e.touches.length < 2) {
      pinchStart.current = null;
      if (zoom <= 1.05) { setZoom(1); setPan({ x: 0, y: 0 }); }
      return;
    }
    if (zoom > 1) return; // don't swipe when zoomed
    if (touchStart.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(diff) > 50) { diff > 0 ? goPrev() : goNext(); }
    touchStart.current = null;
  };

  useEffect(() => {
    if (!lightbox) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") { setLightbox(false); setZoom(1); setPan({ x: 0, y: 0 }); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightbox, active, imgs.length]);

  return (
    <div className="space-y-3">
      {/* Source label */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Camera className="h-3 w-3" />
        <span>{photoSourceLabel}</span>
      </div>

      {/* Main image with nav arrows */}
      <div className="group relative overflow-hidden rounded-xl border border-border bg-card" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="flex items-center justify-center bg-muted/20 h-[280px] sm:h-[350px] lg:h-[420px] relative overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.img
              key={active}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              src={imgs[active].src}
              alt={imgs[active].alt}
              className="max-h-full max-w-full object-contain cursor-zoom-in absolute"
              onClick={() => setLightbox(true)}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }}
            />
          </AnimatePresence>
        </div>

        {/* Prev / Next arrows on the main image */}
        {imgs.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg bg-background/80 p-1.5 text-foreground backdrop-blur opacity-0 transition-opacity group-hover:opacity-100 hover:bg-background"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-background/80 p-1.5 text-foreground backdrop-blur opacity-0 transition-opacity group-hover:opacity-100 hover:bg-background"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Fullscreen button */}
        <button
          onClick={() => setLightbox(true)}
          className="absolute top-3 right-3 rounded-lg bg-background/80 p-1.5 text-foreground opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        {/* Counter */}
        {imgs.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-md bg-background/80 px-2 py-0.5 text-xs font-medium text-foreground backdrop-blur">
            {active + 1} / {imgs.length}
          </span>
        )}

        {/* Caption */}
        {imgs[active].caption && (
          <span className="absolute bottom-3 left-3 rounded-md bg-background/80 px-2 py-0.5 text-xs text-muted-foreground backdrop-blur">
            {imgs[active].caption}
          </span>
        )}
      </div>

      {/* Thumbnail strip */}
      {imgs.length > 1 && (
        <div className="flex gap-2">
          {imgs.map((img, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`overflow-hidden rounded-lg border-2 transition-colors ${i === active ? "border-primary" : "border-border hover:border-muted-foreground/50"}`}
              style={{ width: 60, height: 60 }}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="h-full w-full object-cover"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 touch-none"
          onClick={() => { if (zoom <= 1) setLightbox(false); else { setZoom(1); setPan({ x: 0, y: 0 }); } }}
          onTouchStart={onLightboxTouchStart}
          onTouchMove={onLightboxTouchMove}
          onTouchEnd={onLightboxTouchEnd}
        >
          <button onClick={(e) => { e.stopPropagation(); setLightbox(false); }} className="absolute top-4 right-4 z-10 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
          {zoom > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="absolute top-4 left-4 z-10 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
            >
              Reset zoom
            </button>
          )}
          {imgs.length > 1 && zoom <= 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); goPrev(); }} className="absolute left-4 z-10 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); goNext(); }} className="absolute right-4 z-10 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20">
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.img
              key={active}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              src={imgs[active].src}
              alt={imgs[active].alt}
              className="max-h-[85vh] max-w-[90vw] object-contain"
              style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
              onClick={(e) => e.stopPropagation()}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }}
            />
          </AnimatePresence>
          {imgs[active].caption && (
            <p className="absolute bottom-6 text-sm text-white/70">{imgs[active].caption}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
