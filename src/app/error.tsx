"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-neutral-500">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-md border px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        Try again
      </button>
    </main>
  );
}
