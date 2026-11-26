export default function BackToListButton({ onClick, disabled = false, label = "Volver al listado" }: { onClick: () => void; disabled?: boolean; label?: string }) {
  return <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="ml-auto inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 active:translate-y-px active:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:cursor-wait disabled:opacity-60"
  >
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0"><path d="m12 19-7-7 7-7M5 12h14" /></svg>
    <span className="truncate">{label}</span>
  </button>;
}
