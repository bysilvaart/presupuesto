const LoadingScreen = () => (
  <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-100" role="status" aria-live="polite">
    <div className="flex flex-col items-center gap-4">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-brand border-t-transparent" aria-hidden />
      <p className="text-lg font-medium">Cargando presupuesto…</p>
    </div>
  </div>
);

export default LoadingScreen;
