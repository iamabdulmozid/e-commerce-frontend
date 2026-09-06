"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { ModalShell } from "@/components/ui/modal";

/**
 * A full-screen look at one product photograph.
 *
 * Product images are square thumbnails in the gallery; a shopper deciding
 * whether a fabric or a finish is right needs the whole file. Navigation stays
 * available inside the lightbox so they can compare shots without closing it.
 */
export function Lightbox({
  open,
  onClose,
  images,
  index,
  onIndexChange,
}: {
  open: boolean;
  onClose: () => void;
  images: Array<{ id: number; url: string; alt: string }>;
  index: number;
  onIndexChange: (index: number) => void;
}) {
  const image = images[index];

  if (!image) return null;

  const step = (delta: number) =>
    onIndexChange((index + delta + images.length) % images.length);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      label={image.alt}
      overlayClassName="bg-black/80 backdrop-blur-sm"
      className="inset-0 flex flex-col"
    >
      <div className="flex justify-end p-4">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close image"
          className="inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center gap-3 px-3 pb-8">
        {images.length > 1 && (
          <NavButton onClick={() => step(-1)} label="Previous image">
            <ChevronLeft className="size-6" />
          </NavButton>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.alt}
          className="max-h-full max-w-full rounded-xl object-contain"
        />

        {images.length > 1 && (
          <NavButton onClick={() => step(1)} label="Next image">
            <ChevronRight className="size-6" />
          </NavButton>
        )}
      </div>
    </ModalShell>
  );
}

function NavButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
    >
      {children}
    </button>
  );
}
