import { useState } from "react";
import { Camera, Maximize2, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryImage } from "@/data/mockOffers";

interface Props {
  gallery: GalleryImage[];
  productName: string;
  photoSourceLabel: string;
}

const PhotoGallery = ({ gallery, productName, photoSourceLabel }: Props) => {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const imgs = gallery.length > 0
    ? gallery
    : [{ src: "/placeholder.svg", alt: productName, caption: "", sourceLabel: "" }];

  const goPrev = () => setActive((p) => (p === 0 ? imgs.length - 1 : p - 1));
  const goNext = () => setActive((p) => (p === imgs.length - 1 ? 0 : p + 1));

  return (
    <div className="space-y-3">
      {/* Source label */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Camera className="h-3 w-3" />
        <span>{photoSourceLabel}</span>
      </div>

      {/* Main image with nav arrows */}
      <div className="group relative overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-center bg-muted/20 h-[420px]">
          <img
            src={imgs[active].src}
            alt={imgs[active].alt}
            className="max-h-full max-w-full object-contain cursor-zoom-in"
            onClick={() => setLightbox(true)}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }}
          />
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
              onClick={() => setActive(i)}
              className={`overflow-hidden rounded-lg border-2 transition-colors ${i === active ? "border-primary" : "border-border hover:border-muted-foreground/50"}`}
              style={{ width: 72, height: 54 }}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90" onClick={() => setLightbox(false)}>
          <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
          {imgs.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); goPrev(); }} className="absolute left-4 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); goNext(); }} className="absolute right-4 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20">
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <img
            src={imgs[active].src}
            alt={imgs[active].alt}
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }}
          />
          {imgs[active].caption && (
            <p className="absolute bottom-6 text-sm text-white/70">{imgs[active].caption}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
