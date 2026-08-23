"use client";

import { useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { catalogService, type Media } from "@/services/catalog";
import { can } from "@/types/auth";

/**
 * The media library.
 *
 * The full-page counterpart to `MediaPicker`: same data, but this is where an
 * operator manages the library itself rather than picking from it — alt text,
 * deletion, and seeing what is still processing.
 *
 * Conversions run in a queued job, so a fresh upload arrives `processing` with
 * its thumbnail falling back to the original. The list polls only while
 * something is unfinished, then stops.
 */
export default function AdminMediaPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Media | null>(null);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<
    { tone: "error" | "success"; message: string } | null
  >(null);

  const { data, isLoading, mutate } = useSWR(
    ["/admin/media", search],
    async () => (await catalogService.admin.media({ q: search, per_page: 60 })).items,
    {
      shouldRetryOnError: false,
      refreshInterval: (items) =>
        items?.some((m) => m.status === "processing") ? 2000 : 0,
    },
  );

  async function run(action: () => Promise<unknown>, success: string) {
    setNotice(null);

    try {
      await action();
      await mutate();
      setNotice({ tone: "success", message: success });

      return true;
    } catch (e) {
      setNotice({
        tone: "error",
        // A 409 names what still uses the file, so the server's own wording is
        // more useful here than anything this screen could invent.
        message: e instanceof ApiError ? e.displayMessage : "Something went wrong",
      });

      return false;
    }
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;

    setUploading(true);

    try {
      await run(async () => {
        for (const file of Array.from(files)) {
          await catalogService.admin.uploadMedia(file);
        }
      }, `Uploaded ${files.length} file${files.length === 1 ? "" : "s"}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Media</h1>
          <p className="text-muted-foreground text-sm">
            JPEG, PNG, WebP or AVIF. Thumbnails are generated in the background.
          </p>
        </div>

        {can(user, "media.upload") && (
          <label className="inline-flex cursor-pointer items-center">
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(event) => upload(event.target.files)}
            />
            <span className="bg-primary text-primary-foreground inline-flex h-10 items-center rounded-md px-4 text-sm font-medium">
              {uploading ? "Uploading…" : "Upload images"}
            </span>
          </label>
        )}
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search filenames"
        className="border-input bg-background h-9 w-64 rounded-md border px-3 text-sm"
      />

      {notice && <FormAlert tone={notice.tone} message={notice.message} />}

      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

      {!isLoading && data?.length === 0 && (
        <Card className="text-muted-foreground text-sm">Nothing uploaded yet.</Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {data?.map((media) => (
            <li key={media.id}>
              <button
                onClick={() => setSelected(media)}
                className={cn(
                  "block w-full overflow-hidden rounded-md border-2 text-left",
                  selected?.id === media.id ? "border-primary" : "border-transparent",
                )}
              >
                <span className="bg-muted block aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={media.thumb_url}
                    alt={media.alt ?? media.filename}
                    className="h-full w-full object-cover"
                  />
                </span>
                <span className="text-muted-foreground block truncate p-1 text-xs">
                  {media.status === "processing" ? "processing…" : media.filename}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {selected && (
          <MediaDetails
            // Remounting on selection resets the alt/title fields, which are
            // uncontrolled defaults rather than derived from props.
            key={selected.id}
            media={selected}
            canDelete={can(user, "media.delete")}
            onClose={() => setSelected(null)}
            onDeleted={() => setSelected(null)}
            onRun={run}
          />
        )}
      </div>
    </div>
  );
}

function MediaDetails({
  media,
  canDelete,
  onClose,
  onDeleted,
  onRun,
}: {
  media: Media;
  canDelete: boolean;
  onClose: () => void;
  onDeleted: () => void;
  onRun: (action: () => Promise<unknown>, success: string) => Promise<boolean>;
}) {
  const [saving, setSaving] = useState(false);

  return (
    <Card className="h-fit space-y-4">
      <div className="flex items-start justify-between gap-2">
        <CardTitle className="text-base break-all">{media.filename}</CardTitle>
        <button onClick={onClose} className="text-muted-foreground text-sm underline">
          Close
        </button>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={media.medium_url}
        alt={media.alt ?? ""}
        className="bg-muted w-full rounded object-contain"
      />

      <dl className="text-muted-foreground grid grid-cols-2 gap-1 text-xs">
        <dt>Type</dt>
        <dd className="text-foreground">{media.mime}</dd>
        <dt>Size</dt>
        <dd className="text-foreground">{(media.size / 1024).toFixed(0)} KB</dd>
        <dt>Dimensions</dt>
        <dd className="text-foreground">
          {media.width && media.height ? `${media.width} × ${media.height}` : "—"}
        </dd>
        <dt>Status</dt>
        <dd className="text-foreground">{media.status}</dd>
      </dl>

      {media.status === "failed" && (
        <FormAlert
          message={media.processing_error ?? "Conversions failed; the original is intact."}
        />
      )}

      <form
        className="space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setSaving(true);

          try {
            await onRun(
              () =>
                catalogService.admin.updateMedia(media.id, {
                  alt: String(form.get("alt") || ""),
                  title: String(form.get("title") || ""),
                }),
              "Media updated",
            );
          } finally {
            setSaving(false);
          }
        }}
      >
        <Field
          label="Alt text"
          name="alt"
          defaultValue={media.alt ?? ""}
          placeholder="What the image shows"
        />
        <Field label="Title" name="title" defaultValue={media.title ?? ""} />

        <div className="flex gap-2">
          <Button type="submit" loading={saving}>
            Save
          </Button>

          {canDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                const ok = await onRun(
                  () => catalogService.admin.deleteMedia(media.id),
                  "Media deleted",
                );
                if (ok) onDeleted();
              }}
            >
              Delete
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
