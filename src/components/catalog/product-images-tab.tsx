"use client";

import { useState } from "react";
import { MediaPicker } from "@/components/catalog/media-picker";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { catalogService, type Media, type Product } from "@/services/catalog";

type Runner = (action: () => Promise<unknown>, success: string) => Promise<boolean>;

interface Draft {
  key: string;
  media_id: number;
  url: string;
  thumb_url: string;
  variant_id: number | null;
  is_primary: boolean;
}

/**
 * The product gallery.
 *
 * Edited as a whole and saved in one call: ordering, the primary flag and
 * variant bindings are one arrangement, and saving them piecemeal would let
 * "which one is primary" briefly have two answers.
 */
export function ProductImagesTab({ product, onRun }: { product: Product; onRun: Runner }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [draft, setDraft] = useState<Draft[]>(() =>
    (product.images ?? []).map((image) => ({
      key: `existing-${image.id}`,
      media_id: image.media_id,
      url: image.url,
      thumb_url: image.thumb_url,
      variant_id: image.variant_id,
      is_primary: image.is_primary,
    })),
  );

  function add(media: Media[]) {
    setDraft((current) => [
      ...current,
      ...media
        .filter((m) => !current.some((d) => d.media_id === m.id))
        .map((m, index) => ({
          key: `new-${m.id}`,
          media_id: m.id,
          url: m.medium_url,
          thumb_url: m.thumb_url,
          variant_id: null,
          // The first image ever added becomes primary, so a product is never
          // left without a card image.
          is_primary: current.length === 0 && index === 0,
        })),
    ]);
  }

  function move(index: number, direction: -1 | 1) {
    setDraft((current) => {
      const next = [...current];
      const target = index + direction;

      if (target < 0 || target >= next.length) return current;

      [next[index], next[target]] = [next[target], next[index]];

      return next;
    });
  }

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Images</CardTitle>
          <CardDescription>
            Bind an image to a variant and the gallery swaps when a shopper picks it.
          </CardDescription>
        </div>
        <Button variant="secondary" onClick={() => setPickerOpen(true)}>
          Add images
        </Button>
      </Card>

      {draft.length === 0 ? (
        <Card className="text-muted-foreground text-sm">No images yet.</Card>
      ) : (
        <ul className="space-y-2">
          {draft.map((image, index) => (
            <li key={image.key}>
              <Card className="flex flex-wrap items-center gap-4 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.thumb_url}
                  alt=""
                  className="size-16 rounded object-cover"
                />

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="primary"
                    checked={image.is_primary}
                    onChange={() =>
                      setDraft((current) =>
                        current.map((d) => ({ ...d, is_primary: d.key === image.key })),
                      )
                    }
                  />
                  Primary
                </label>

                <select
                  value={image.variant_id ?? ""}
                  onChange={(event) =>
                    setDraft((current) =>
                      current.map((d) =>
                        d.key === image.key
                          ? {
                              ...d,
                              variant_id: event.target.value
                                ? Number(event.target.value)
                                : null,
                            }
                          : d,
                      ),
                    )
                  }
                  className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                >
                  <option value="">All variants</option>
                  {product.variants?.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.attributes.map((a) => a.value).join(" / ") || variant.sku}
                    </option>
                  ))}
                </select>

                <div className="ml-auto flex items-center gap-3 text-sm">
                  <button
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className={cn("underline", index === 0 && "opacity-30")}
                    aria-label="Move up"
                  >
                    Up
                  </button>
                  <button
                    onClick={() => move(index, 1)}
                    disabled={index === draft.length - 1}
                    className={cn("underline", index === draft.length - 1 && "opacity-30")}
                    aria-label="Move down"
                  >
                    Down
                  </button>
                  <button
                    onClick={() =>
                      setDraft((current) => current.filter((d) => d.key !== image.key))
                    }
                    className="text-destructive underline"
                  >
                    Remove
                  </button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Button
        loading={saving}
        onClick={async () => {
          setSaving(true);

          try {
            await onRun(
              () =>
                catalogService.admin.syncImages(
                  product.id,
                  draft.map((image, index) => ({
                    media_id: image.media_id,
                    variant_id: image.variant_id,
                    is_primary: image.is_primary,
                    sort_order: index,
                  })),
                ),
              "Images saved",
            );
          } finally {
            setSaving(false);
          }
        }}
      >
        Save gallery
      </Button>

      <MediaPicker
        open={pickerOpen}
        multiple
        onClose={() => setPickerOpen(false)}
        onSelect={add}
      />
    </div>
  );
}
