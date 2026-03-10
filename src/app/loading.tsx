export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      {/* Sweep bar at top */}
      <div className="page-loading-sweep" role="status" aria-label="Loading page" />
      <div className="page-loading-glow" />
      <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
    </div>
  );
}
