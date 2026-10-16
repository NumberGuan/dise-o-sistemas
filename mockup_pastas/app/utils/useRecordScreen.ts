import { useSearchParams } from "react-router";

export function useRecordScreen<T>(records: T[], idOf: (record: T) => string | number, detailKey: string, createFromKey?: string) {
  const [params, setParams] = useSearchParams();
  const mode = params.get("vista");
  const id = params.get(detailKey);
  const record = id ? records.find(record => String(idOf(record)) === id) : undefined;
  const creating = mode === "nuevo" || (!id && Boolean(createFromKey && params.has(createFromKey)));
  const editing = creating ? null : mode === "editar" ? record : undefined;
  const selected = !creating && mode !== "editar" ? record ?? null : null;
  const missing = !creating && (id !== null || mode === "editar") && !record;

  function closeScreen() {
    const next = new URLSearchParams(params);
    next.delete(detailKey);
    next.delete("vista");
    if (createFromKey) next.delete(createFromKey);
    setParams(next);
  }

  function setEditing(value: T | null | undefined) {
    if (value === undefined) return closeScreen();
    const next = new URLSearchParams(params);
    next.set("vista", value === null ? "nuevo" : "editar");
    if (value === null) next.delete(detailKey);
    else next.set(detailKey, String(idOf(value)));
    setParams(next);
  }

  function setSelected(value: T | null) {
    if (value === null) return closeScreen();
    const next = new URLSearchParams(params);
    next.delete("vista");
    if (createFromKey) next.delete(createFromKey);
    next.set(detailKey, String(idOf(value)));
    if (next.toString() !== params.toString()) setParams(next, { replace: creating || mode === "editar" });
  }

  return { editing, selected, setEditing, setSelected, closeScreen, missing, params };
}
