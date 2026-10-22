'use client';

/** A server error on any page: say so plainly and offer a retry that refetches. */
export default function ErrorPage({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return (
    <main className="flex-1 w-full max-w-[680px] mx-auto px-4 sm:px-6 py-16 flex flex-col gap-4">
      <h1 className="text-display font-semibold">Something went wrong.</h1>
      <p className="text-secondary">Your answers are safe. Try again in a moment.</p>
      <button type="button" className="btn btn-primary self-start" onClick={() => unstable_retry()}>
        Try again
      </button>
    </main>
  );
}
