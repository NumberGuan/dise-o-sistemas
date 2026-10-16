import RecordPage, { RecordNotFound } from "~/components/RecordPage";
import { useRecordScreen } from "~/utils/useRecordScreen";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { MACHINE_STATUSES, SAMPLE_MACHINES, SAMPLE_MAINTENANCES, type Machine, type MachineStatus } from "~/data/maintenance";

const field = "mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100";
const labelClass = "block text-sm font-medium text-gray-700";
const badge = (s: MachineStatus) => s === "Activa" ? "bg-emerald-100 text-emerald-800" : s === "En mantenimiento" ? "bg-sky-100 text-sky-800" : s === "Fuera de servicio" ? "bg-red-100 text-red-800" : "bg-gray-200 text-gray-700";
const nextCode = () => `MAQ-${String(Math.max(0, ...SAMPLE_MACHINES.map((m) => Number(m.code.match(/\d+$/)?.[0]) || 0)) + 1).padStart(3, "0")}`;

function MachineForm({ machine, onCancel, onSave }: { machine: Machine | null; onCancel: () => void; onSave: (m: Machine) => void }) {
  const [code] = useState(machine?.code ?? nextCode());
  const [name, setName] = useState(machine?.name ?? "");
  const [type, setType] = useState(machine?.type ?? "");
  const [brand, setBrand] = useState(machine?.brand ?? "");
  const [model, setModel] = useState(machine?.model ?? "");
  const [serial, setSerial] = useState(machine?.serialNumber ?? "");
  const [location, setLocation] = useState(machine?.location ?? "");
  const [date, setDate] = useState(machine?.acquisitionDate ?? new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<MachineStatus>(machine?.status ?? "Activa");
  const [observations, setObservations] = useState(machine?.observations ?? "");
  const [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !type.trim() || !serial.trim()) return setError("Nombre, tipo y número de serie son obligatorios.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError("Ingresá una fecha válida.");
    if (SAMPLE_MACHINES.some((m) => m.serialNumber.toLowerCase() === serial.trim().toLowerCase() && m.id !== machine?.id)) return setError("El número de serie ya está registrado.");
    onSave({ id: machine?.id ?? `maq-${Date.now()}`, code, name: name.trim(), type: type.trim(), brand: brand.trim(), model: model.trim(), serialNumber: serial.trim(), location: location.trim(), acquisitionDate: date, status, observations: observations.trim() });
  }

  return (
    <RecordPage onBack={onCancel}>
      <div className="flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-5 py-4 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{machine ? "Editar máquina" : "Nueva máquina"}</h1>
          <p className="mt-1 text-sm text-gray-500">Los cambios quedan disponibles durante esta sesión.</p>
        </div>
      </div>
      <form noValidate onSubmit={submit} className="space-y-5 p-5 sm:p-6">
        {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>Código
            <input value={code} readOnly className={`${field} bg-gray-100`} />
          </label>
          <label className={labelClass}>Nombre <span className="text-rose-600">*</span>
            <input autoFocus required value={name} onChange={(e) => setName(e.target.value)} className={field} />
          </label>
          <label className={labelClass}>Tipo <span className="text-rose-600">*</span>
            <input required value={type} onChange={(e) => setType(e.target.value)} className={field} />
          </label>
          <label className={labelClass}>Marca
            <input value={brand} onChange={(e) => setBrand(e.target.value)} className={field} />
          </label>
          <label className={labelClass}>Modelo
            <input value={model} onChange={(e) => setModel(e.target.value)} className={field} />
          </label>
          <label className={labelClass}>Número de serie <span className="text-rose-600">*</span>
            <input required value={serial} onChange={(e) => setSerial(e.target.value)} className={field} />
          </label>
          <label className={labelClass}>Ubicación
            <input value={location} onChange={(e) => setLocation(e.target.value)} className={field} />
          </label>
          <label className={labelClass}>Fecha de adquisición <span className="text-rose-600">*</span>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={field} />
          </label>
          <label className={labelClass}>Estado
            <select value={status} onChange={(e) => setStatus(e.target.value as MachineStatus)} className={field}>
              {MACHINE_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className={`${labelClass} sm:col-span-2`}>Observaciones
            <textarea rows={3} value={observations} onChange={(e) => setObservations(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
          </label>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-amber-600">Cancelar</button>
          <button type="submit" className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">Guardar máquina</button>
        </div>
      </form>
    </RecordPage>
  );
}

function MachineDetails({ machine, onClose, onEdit, onToggleStatus }: { machine: Machine; onClose: () => void; onEdit: () => void; onToggleStatus: () => void; }) {
  const history = SAMPLE_MAINTENANCES.filter((x) => x.items.some(i => i.machineId === machine.id)).sort((a, b) => b.estimatedDate.localeCompare(a.estimatedDate));
  const last = history.find((x) => x.status === "Finalizado");
  const next = [...history].reverse().find((x) => x.status === "Programado");

  return (
    <RecordPage onBack={onClose}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{machine.code} · {machine.type}</p>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-gray-900">{machine.name}</h1>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badge(machine.status)}`}>{machine.status}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onEdit} className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700">Editar</button>

        </div>
      </div>
      <div className="grid gap-7 p-5 sm:grid-cols-[minmax(0,1fr)_1.2fr] sm:p-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Información de la máquina</h3>
          <dl className="mt-3 space-y-3 text-sm">
            {[
              ["Tipo", machine.type],
              ["Marca / modelo", `${machine.brand} ${machine.model}`],
              ["N.º de serie", machine.serialNumber],
              ["Ubicación", machine.location || "—"],
              ["Fecha de adquisición", machine.acquisitionDate],
              ["Mantenimientos", String(history.length)],
              ["Último mantenimiento", last?.endDate ?? "Sin registros"],
              ["Próximo mantenimiento", next?.estimatedDate ?? "Sin programar"]
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className="mt-0.5 break-words font-medium text-gray-800">{value}</dd>
              </div>
            ))}
          </dl>
          {machine.observations && (
            <div className="mt-4 rounded-lg bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-900">Observaciones</p>
              <p className="mt-1 text-sm text-amber-900">{machine.observations}</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col gap-2">
             <button onClick={onToggleStatus} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
               {machine.status === "Inactiva" ? "Activar máquina" : "Desactivar máquina"}
             </button>
             <Link to={`/mantenimiento/mantenimientos?maquina=${machine.id}`} className="text-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">
               Programar mantenimiento
             </Link>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Historial de mantenimientos</h3>
          <ol className="mt-4 divide-y divide-gray-100">
            {history.length === 0 ? (
               <p className="text-sm text-gray-500">No hay mantenimientos registrados.</p>
            ) : history.map((x) => {
              const itemData = x.items.find(i => i.machineId === machine.id);
              return (
                <li key={x.id} className="py-3 first:pt-0">
                  <Link to={`/mantenimiento/mantenimientos?mantenimiento=${x.id}`} className="group flex items-start justify-between gap-3 rounded focus-visible:outline-2 focus-visible:outline-amber-600">
                    <span>
                      <span className="text-xs font-medium text-gray-500">{x.number}</span>
                      <span className="mt-1 block text-sm font-medium text-gray-900 group-hover:text-amber-800">{itemData?.type}</span>
                      <span className="mt-1 block text-xs text-gray-500">
                        {x.status === "Programado" ? `Para el ${x.estimatedDate}` : x.status === "Finalizado" ? `Completado el ${x.endDate}` : `Iniciado el ${x.startDate}`}
                      </span>
                    </span>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${x.status === "Programado" ? "bg-amber-100 text-amber-800" : x.status === "En curso" ? "bg-sky-100 text-sky-800" : x.status === "Finalizado" ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-700"}`}>{x.status}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </RecordPage>
  );
}

export default function Maquinas() {
  const [machines, setMachines] = useState(() => [...SAMPLE_MACHINES]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Todos");
  const [type, setType] = useState("Todos");
  const { editing, setEditing, selected, setSelected, closeScreen, missing, params } = useRecordScreen(machines, item => item.id, "maquina");

  const types = [...new Set(machines.map((m) => m.type))];
  const filtered = useMemo(() => machines.filter((m) => {
    const q = search.toLowerCase();
    return (!q || [m.code, m.name, m.type, m.brand, m.model, m.serialNumber].some((v) => v.toLowerCase().includes(q))) &&
      (status === "Todos" || m.status === status) &&
      (type === "Todos" || m.type === type);
  }), [machines, search, status, type]);

  useEffect(() => {
    if (editing === undefined && selected === null) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") { closeScreen(); }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editing, selected]);

  function save(m: Machine) {
    const i = SAMPLE_MACHINES.findIndex((x) => x.id === m.id);
    if (i >= 0) SAMPLE_MACHINES[i] = m;
    else SAMPLE_MACHINES.unshift(m);
    setMachines([...SAMPLE_MACHINES]);
    setSelected(m);
  }

  if (missing) return <RecordNotFound onBack={closeScreen} />;
  if (editing !== undefined) return <MachineForm key={params.toString()} machine={editing} onCancel={() => setEditing(undefined)} onSave={save} />;
  if (selected) return <MachineDetails machine={selected} onClose={() => setSelected(null)} onEdit={() => { setEditing(selected); }} onToggleStatus={() => save({ ...selected, status: selected.status === "Inactiva" ? "Activa" : "Inactiva" })} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-amber-700">Mantenimiento</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">Máquinas</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">Gestiona el inventario y estado de las máquinas de producción.</p>
        </div>
        <button type="button" onClick={() => setEditing(null)} className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">＋ Nueva Máquina</button>
      </header>

      <section className="mt-7 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Listado de máquinas</h2>
            <p className="mt-1 text-sm text-gray-500">{filtered.length} {filtered.length === 1 ? "máquina" : "máquinas"} encontradas</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:flex">
            <label className="sr-only" htmlFor="machine-search">Buscar máquinas</label>
            <input id="machine-search" aria-label="Buscar máquinas" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por código, nombre..." className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 sm:w-64" />
            <label className="sr-only" htmlFor="machine-status">Filtrar por estado</label>
            <select id="machine-status" aria-label="Filtrar por estado" value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100">
              <option>Todos</option>
              {MACHINE_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <label className="sr-only" htmlFor="machine-type">Filtrar por tipo</label>
            <select id="machine-type" aria-label="Filtrar por tipo" value={type} onChange={(e) => setType(e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100">
              <option>Todos</option>
              {types.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div aria-hidden="true" className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500">⌕</div>
            <h3 className="mt-4 font-semibold text-gray-900">No se encontraron máquinas</h3>
            <p className="mt-1 text-sm text-gray-500">Prueba con otro término o cambia los filtros.</p>
            <button type="button" onClick={() => { setSearch(""); setStatus("Todos"); setType("Todos"); }} className="mt-4 text-sm font-semibold text-amber-700 hover:text-amber-800">Limpiar filtros</button>
          </div>
        ) : (
          <>
            <div className="hidden lg:grid lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] items-center gap-5 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <div className="min-w-0 text-left">Código / Nombre</div>
              <div className="min-w-0 text-center">Tipo</div>
              <div className="min-w-0 text-center">Marca / Modelo</div>
              <div className="min-w-0 text-center">Ubicación</div>
              <div className="min-w-0 text-center">Estado</div>
              <div className="min-w-0 text-center">Acciones</div>
            </div>
            <div className="divide-y divide-gray-100">
              {filtered.map((m) => (
                <article key={m.id} className="grid min-w-0 grid-cols-2 items-center gap-x-4 gap-y-3 p-4 transition hover:bg-amber-50/30 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] lg:gap-5 lg:px-5">
                  <div className="col-span-2 min-w-0 lg:col-span-1 text-left">
                    <p className="mb-1 text-xs font-medium text-gray-500">{m.code}</p>
                    <h3 className="break-words font-semibold leading-5 text-gray-900">{m.name}</h3>
                  </div>
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Tipo</p>
                    <p className="mt-1 break-words text-sm text-gray-900 lg:mt-0">{m.type}</p>
                  </div>
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Marca / Modelo</p>
                    <p className="mt-1 break-words text-sm text-gray-900 lg:mt-0">{m.brand} {m.model}</p>
                  </div>
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Ubicación</p>
                    <p className="mt-1 break-words text-sm text-gray-900 lg:mt-0">{m.location || "—"}</p>
                  </div>
                  <div className="flex flex-col items-start gap-1 lg:items-center">
                    <span className="text-xs font-medium text-gray-500 lg:hidden">Estado</span>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badge(m.status)}`}>{m.status}</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2 border-t border-gray-100 pt-2 lg:col-span-1 lg:border-0 lg:pt-0 lg:justify-center">
                    <button type="button" onClick={() => setSelected(m)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-600">Ver detalle</button>
                    <button type="button" onClick={() => setEditing(m)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-amber-600">Editar</button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
