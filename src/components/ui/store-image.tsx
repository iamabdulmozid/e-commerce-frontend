"use client";

import { ImageOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/*
 * Every catalog image on the storefront goes through here.
 *
 * Why a plain <img> and not next/image (PRD 5A, D3): media is served from each
 * tenant's own hostname, and `images.remotePatterns` cannot enumerate an
 * open-ended set of tenant domains. What next/image would have given us that
 * actually matters here - a reserved box so nothing shifts, lazy loading, and
 * a graceful failure - is cheap to do directly.
 *
 * A client component only because of `onError`: a missing file, an expired
 * URL or a tenant whose disk moved must not leave a broken-image glyph in the
 * middle of a product grid. Everything else about it renders on the server.
 */

const RATIOS = {
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  landscape: "aspect-[3/2]",
  wide: "aspect-[16/9]",
  banner: "aspect-[21/9]",
} as const;

interface StoreImageProps {
  src?: string | null;
  alt: string;
  ratio?: keyof typeof RATIOS;
  /** Above-the-fold images should not be lazy - it delays the LCP. */
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  /** Shown in the placeholder when there is no usable image. */
  fallbackLabel?: string;
  sizes?: string;
}

export function StoreImage({
  src,
  alt,
  ratio = "square",
  priority = false,
  className,
  imageClassName,
  fallbackLabel,
  sizes,
}: StoreImageProps) {
  const [failed, setFailed] = useState(false);
  const show = src && !failed;

  return (
    <div
      className={cn(
        "bg-muted relative isolate overflow-hidden rounded-xl",
        RATIOS[ratio],
        className,
      )}
    >
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : undefined}
          onError={() => setFailed(true)}
          className={cn("absolute inset-0 size-full object-cover", imageClassName)}
        />
      ) : (
        <Placeholder label={fallbackLabel ?? alt} />
      )}
    </div>
  );
}

/**
 * A store with no photograph for a product should still look deliberate. A
 * tinted gradient with the product's initials reads as "not photographed yet";
 * an empty grey box reads as "broken".
 */
function Placeholder({ label }: { label: string }) {
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      aria-hidden
      className="from-primary-soft to-muted absolute inset-0 flex flex-col items-center justify-center gap-2 bg-linear-to-br"
    >
      {initials ? (
        <span className="text-primary-soft-foreground font-display text-2xl font-bold tracking-wide opacity-70">
          {initials}
        </span>
      ) : (
        <ImageOff className="text-muted-foreground size-6 opacity-60" />
      )}
    </div>
  );
}
