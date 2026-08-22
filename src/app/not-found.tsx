import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-xl w-full p-8">
        <div className="rounded-xl border border-input/60 bg-card p-8 text-center">
          <h1 className="text-4xl font-bold mb-2">404 — Page not found</h1>
          <p className="text-sm text-muted-foreground mb-6">
            We couldn&apos;t find the page you were looking for. It may have been moved or removed.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-white"
              href="/"
            >
              Go to dashboard
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2"
              href="/login"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
