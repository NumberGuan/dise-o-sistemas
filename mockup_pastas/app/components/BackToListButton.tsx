export default function BackToListButton({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) {
  return <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="fixed right-4 top-3 z-40 inline-flex min-h-10 max-w-[calc(100vw-6rem)] items-center justify-center gap-2 rounded-lg border border-amber-800 bg-amber-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800 active:translate-y-px active:bg-amber-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:cursor-wait disabled:opacity-60 sm:right-6"
  >
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0"><path d="m12 19-7-7 7-7M5 12h14" /></svg>
    <span className="truncate">Volver al listado</span>
  </button>;
}
