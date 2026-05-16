"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-xl font-bold text-red-600">Something went wrong!</h2>
      <p className="text-sm text-muted-foreground max-w-md text-center">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <button onClick={reset} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">
        Try again
      </button>
    </div>
  );
}
