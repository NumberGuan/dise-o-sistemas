import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { AnimatePresence, animate, motion, useReducedMotion, type Transition } from "motion/react";

// Curvas y tiempos compartidos: animaciones cortas, ease-out fuerte, rebote solo en acordeones.
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const SPRING_BOUNCE: Transition = { type: "spring", duration: 0.45, bounce: 0.25 };
const FAST: Transition = { duration: 0.2, ease: EASE_OUT };

/* Props para filas de listados: entran en cascada y se reacomodan al filtrar. */
export function rowMotion(index: number) {
  return {
    layout: "position" as const,
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, transition: { duration: 0.12 } },
    transition: { duration: 0.22, ease: EASE_OUT, delay: Math.min(index * 0.03, 0.24), layout: { duration: 0.2, ease: EASE_OUT } },
  };
}

/* Bloque que se despliega en altura. El padre lo renderiza dentro de <AnimatePresence>. */
export function Collapse({ children, className, id, transition = FAST }: { children: ReactNode; className?: string; id?: string; transition?: Transition }) {
  return (
    <motion.div
      id={id}
      className={className}
      style={{ overflow: "hidden" }}
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}

export function Chevron({ open, className = "" }: { open: boolean; className?: string }) {
  return (
    <motion.svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`h-4 w-4 ${className}`} initial={false} animate={{ rotate: open ? 0 : -90 }} transition={SPRING_BOUNCE}>
      <path d="m6 9 6 6 6-6" />
    </motion.svg>
  );
}

export type AccordionItem = { id: string; title: string; meta?: string; content: ReactNode };

/* Acordeón con rebote y separación entre ítems.
   Recreado con Motion a partir de la idea del "Bouncy accordion" de Skiper UI (skiper-ui.com/v1/skiper103). */
export function Accordion({ items, defaultOpen }: { items: AccordionItem[]; defaultOpen?: string }) {
  const [open, setOpen] = useState<string | null>(defaultOpen ?? null);

  return (
    <div className="flex flex-col">
      {items.map((item, index) => {
        const isOpen = open === item.id;
        return (
          <motion.div
            key={item.id}
            initial={false}
            animate={{ marginTop: index === 0 ? 0 : isOpen ? 14 : 6, marginBottom: isOpen ? 8 : 0 }}
            transition={SPRING_BOUNCE}
            className={`overflow-hidden rounded-xl border bg-white transition-[border-color,box-shadow] ${isOpen ? "border-amber-200 shadow-md" : "border-gray-200 shadow-sm"}`}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : item.id)}
              aria-expanded={isOpen}
              aria-controls={`acc-${item.id}`}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-amber-50/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber-600"
            >
              <span className="text-sm font-semibold text-gray-900">{item.title}</span>
              <span className="flex items-center gap-2 text-xs text-gray-500">
                {item.meta}
                <Chevron open={isOpen} className={isOpen ? "text-amber-700" : "text-gray-400"} />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <Collapse id={`acc-${item.id}`} transition={SPRING_BOUNCE}>
                  <motion.div initial={{ y: -6 }} animate={{ y: 0 }} exit={{ y: -6 }} transition={SPRING_BOUNCE} className="border-t border-gray-100">
                    {item.content}
                  </motion.div>
                </Collapse>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

/* Badge de estado: el valor viejo sale y el nuevo entra con un fundido corto. */
export function AnimatedBadge({ value, className }: { value: string; className: string }) {
  return (
    <span className="inline-grid">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          className={className}
          initial={{ opacity: 0, y: -6, filter: "blur(2px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 6, filter: "blur(2px)" }}
          transition={FAST}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* Número que cuenta hasta su valor. Sin animación si el usuario pidió movimiento reducido. */
export function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || reduceMotion) return;
    const controls = animate(previous.current, value, {
      duration: 0.6,
      ease: EASE_OUT,
      onUpdate: (v) => { node.textContent = Math.round(v).toLocaleString("es-AR"); },
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, reduceMotion]);

  return <span ref={ref}>{value.toLocaleString("es-AR")}</span>;
}

const HOLD_MS = 1200;

/* Botón para acciones destructivas: hay que mantenerlo apretado para confirmar. */
export function HoldToConfirm({ label, holdingLabel, onConfirm, className }: { label: string; holdingLabel: string; onConfirm: () => void; className: string }) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function start() {
    setHolding(true);
    timer.current = window.setTimeout(() => { setHolding(false); onConfirm(); }, HOLD_MS);
  }
  function stop() {
    window.clearTimeout(timer.current);
    setHolding(false);
  }

  return (
    <button
      type="button"
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); start(); } }}
      onKeyUp={stop}
      onBlur={stop}
      className={`relative overflow-hidden ${className}`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-red-100"
        style={{
          clipPath: holding ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
          transition: holding ? `clip-path ${HOLD_MS}ms linear` : "clip-path 200ms cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      />
      <span className="relative">{holding ? holdingLabel : label}</span>
    </button>
  );
}

/* Avisos breves después de guardar o cambiar de estado. */
type ToastTone = "success" | "info";
type ToastItem = { id: number; message: string; tone: ToastTone };

const TOAST_MS = 3200;
let toasts: ToastItem[] = [];
const listeners = new Set<() => void>();
const NO_TOASTS: ToastItem[] = [];
const emit = () => listeners.forEach((listener) => listener());

export function toast(message: string, tone: ToastTone = "success") {
  const id = Date.now() + Math.random();
  toasts = [...toasts, { id, message, tone }];
  emit();
  window.setTimeout(() => { toasts = toasts.filter((t) => t.id !== id); emit(); }, TOAST_MS);
}

export function Toaster() {
  const items = useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => toasts,
    () => NO_TOASTS,
  );

  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <motion.div
            key={t.id}
            layout
            role="status"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, transition: { duration: 0.15 } }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm shadow-lg ${t.tone === "success" ? "border-emerald-200" : "border-sky-200"}`}
          >
            <span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${t.tone === "success" ? "bg-emerald-500" : "bg-sky-600"}`} />
            <span className="text-gray-800">{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
