import RecordPage, { RecordNotFound } from "~/components/RecordPage";
import { useRecordScreen } from "~/utils/useRecordScreen";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { SAMPLE_EMPLOYEES } from "~/data/employees";
import { MAINTENANCE_STATUSES, MAINTENANCE_TYPES, SAMPLE_MACHINES, SAMPLE_MAINTENANCES, type MaintenanceOrder, type MaintenanceOrderItem, type MaintenanceStatus, type MaintenanceType } from "~/data/maintenance";

const field = "mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100";
const labelClass = "block text-sm font-medium text-gray-700";
const badge = (s: MaintenanceStatus) => s === "Programado" ? "bg-amber-100 text-amber-800" : s === "En curso" ? "bg-sky-100 text-sky-800" : s === "Finalizado" ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-700";
const nextNumber = () => `MAN-${String(Math.max(0, ...SAMPLE_MAINTENANCES.map((m) => Number(m.number.match(/\d+$/)?.[0]) || 0)) + 1).padStart(4, "0")}`;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(amount);
}

function MaintenanceForm({ item, preselectedMachineId, onCancel, onSave }: { item: MaintenanceOrder | null; preselectedMachineId?: string; onCancel: () => void; onSave: (m: MaintenanceOrder, start: boolean) => void }) {
  const [number] = useState(item?.number ?? nextNumber());
  const [issueDate, setIssueDate] = useState(item?.issueDate ?? new Date().toISOString().slice(0, 10));
  const [estimatedDate, setEstimatedDate] = useState(item?.estimatedDate ?? new Date().toISOString().slice(0, 10));
  const [responsibleType, setResponsibleType] = useState<"Empleado" | "Externo">(item?.responsibleType ?? "Empleado");
  const [employee, setEmployee] = useState(item?.responsibleEmployeeId ?? "");
  const [externalName, setExternalName] = useState(item?.externalResponsibleName ?? "");
  const [observations, setObservations] = useState(item?.observations ?? "");
  const [items, setItems] = useState<Partial<MaintenanceOrderItem>[]>(item?.items ?? (preselectedMachineId ? [{ id: `item-${Date.now()}`, machineId: preselectedMachineId }] : []));
  const [error, setError] = useState("");

  function addItem() {
    setItems([...items, { id: `item-${Date.now()}-${items.length}`, machineId: "", type: "Preventivo", description: "", workPerformed: "" }]);
  }
  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }
  function updateItem(index: number, field: keyof MaintenanceOrderItem, value: string) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  }

  function submit(e: FormEvent, start: boolean) {
    e.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate) || !/^\d{4}-\d{2}-\d{2}$/.test(estimatedDate)) return setError("Ingresá fechas válidas.");
    if (responsibleType === "Empleado" && !employee) return setError("Seleccioná un responsable activo.");
    if (responsibleType === "Externo" && !externalName.trim()) return setError("Ingresá el nombre del responsable externo.");
    if (items.length === 0) return setError("Agregá al menos una máquina a la orden.");

    for (const it of items) {
      if (!it.machineId) return setError("Seleccioná una máquina en todos los ítems.");
      if (!it.type) return setError("Seleccioná el tipo de mantenimiento en todos los ítems.");
      if (!it.description?.trim()) return setError("Ingresá la descripción en todos los ítems.");
      const machine = SAMPLE_MACHINES.find((m) => m.id === it.machineId);
      if (machine?.status === "Inactiva") return setError(`La máquina ${machine.name} está inactiva y no puede recibir mantenimiento.`);
      if (start && SAMPLE_MAINTENANCES.some((m) => m.id !== item?.id && m.status === "En curso" && m.items.some(x => x.machineId === it.machineId))) return setError(`La máquina ${machine?.name} ya tiene un mantenimiento en curso.`);
    }

    onSave({ 
      id: item?.id ?? `mant-${Date.now()}`, 
      number, 
      issueDate, 
      estimatedDate, 
      responsibleType, 
      responsibleEmployeeId: responsibleType === "Empleado" ? employee : undefined, 
      externalResponsibleName: responsibleType === "Externo" ? externalName.trim() : undefined, 
      status: item?.status ?? "Programado", 
      observations: observations.trim(), 
      startDate: item?.startDate, 
      endDate: item?.endDate, 
      items: items as MaintenanceOrderItem[],
      previousMachineStatuses: item?.previousMachineStatuses
    }, start);
  }

  return (
    <RecordPage onBack={onCancel}>
      <div className="flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-5 py-4 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{item ? "Editar orden de mantenimiento" : "Nueva orden de mantenimiento"}</h1>
          <p className="mt-1 text-sm text-gray-500">{number}</p>
        </div>
      </div>

      <form id="maintenance-form" noValidate onSubmit={event => event.preventDefault()} className="flex-1 p-5 sm:p-6">
        {error && <p role="alert" className="mb-5 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>Fecha de emisión <span className="text-rose-600">*</span>
            <input type="date" required value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={field} />
          </label>
          <label className={labelClass}>Fecha estimada <span className="text-rose-600">*</span>
            <input type="date" required value={estimatedDate} onChange={(e) => setEstimatedDate(e.target.value)} className={field} />
          </label>

          <label className={labelClass}>Tipo de responsable <span className="text-rose-600">*</span>
            <select value={responsibleType} onChange={(e) => setResponsibleType(e.target.value as "Empleado" | "Externo")} className={field}>
              <option value="Empleado">Personal Interno (Empleado)</option>
              <option value="Externo">Proveedor Externo</option>
            </select>
          </label>

          {responsibleType === "Empleado" ? (
            <label className={labelClass}>Responsable <span className="text-rose-600">*</span>
              <select required value={employee} onChange={(e) => setEmployee(e.target.value)} className={field}>
                <option value="">Seleccionar empleado...</option>
                {SAMPLE_EMPLOYEES.filter((x) => x.status === "Activo").map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </label>
          ) : (
            <label className={labelClass}>Nombre del proveedor <span className="text-rose-600">*</span>
              <input type="text" required value={externalName} onChange={(e) => setExternalName(e.target.value)} placeholder="Ej: Técnica Mantenimientos S.A." className={field} />
            </label>
          )}

          <label className={`${labelClass} sm:col-span-2`}>Observaciones generales
            <textarea rows={2} value={observations} onChange={(e) => setObservations(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
          </label>
        </div>

        <div data-validation-message={items.length ? "" : "Agregá al menos una máquina a la orden."} className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Máquinas a intervenir</h3>
            <button type="button" onClick={addItem} className="text-sm font-semibold text-amber-700 hover:text-amber-800">+ Agregar máquina</button>
          </div>

          <div className="mt-4 space-y-4">
            {items.length === 0 ? (
              <p className="text-sm text-gray-500">No hay máquinas agregadas a esta orden.</p>
            ) : items.map((it, idx) => (
              <div key={it.id} className="relative rounded-lg border border-gray-200 bg-gray-50 p-4">
                <button type="button" onClick={() => removeItem(idx)} className="absolute right-2 top-2 p-2 text-gray-400 hover:text-red-600" aria-label="Eliminar máquina">✕</button>
                <div className="grid gap-4 sm:grid-cols-2 pr-6">
                  <label className={labelClass}>Máquina <span className="text-rose-600">*</span>
                    <select required value={it.machineId} onChange={(e) => updateItem(idx, "machineId", e.target.value)} className={field}>
                      <option value="">Seleccionar...</option>
                      {SAMPLE_MACHINES.filter((m) => m.status !== "Inactiva").map((m) => <option key={m.id} value={m.id}>{m.code} · {m.name}</option>)}
                    </select>
                  </label>
                  <label className={labelClass}>Tipo <span className="text-rose-600">*</span>
                    <select required value={it.type} onChange={(e) => updateItem(idx, "type", e.target.value)} className={field}>
                      <option value="">Seleccionar...</option>
                      {MAINTENANCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </label>
                  <label className={`${labelClass} sm:col-span-2`}>Descripción del problema / tarea <span className="text-rose-600">*</span>
                    <input type="text" required value={it.description} onChange={(e) => updateItem(idx, "description", e.target.value)} className={field} />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>

      <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
        <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-amber-600">Cancelar</button>
        <button type="button" form="maintenance-form" data-validate-form onClick={(e) => submit(e as unknown as FormEvent, false)} className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-amber-600">Guardar Programado</button>
        <button type="button" form="maintenance-form" data-validate-form onClick={(e) => submit(e as unknown as FormEvent, true)} className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700">Guardar e Iniciar</button>
      </div>
    </RecordPage>
  );
}

function MaintenanceDetails({ order, onClose, onEdit, onTransition }: { order: MaintenanceOrder; onClose: () => void; onEdit: () => void; onTransition: (next: MaintenanceStatus, items: MaintenanceOrderItem[], endDate: string) => { error?: string } | void; }) {
  const employee = order.responsibleType === "Empleado" ? SAMPLE_EMPLOYEES.find((e) => e.id === order.responsibleEmployeeId) : null;
  const responsibleName = order.responsibleType === "Empleado" ? (employee?.name ?? "—") : (order.externalResponsibleName ?? "—");

  const [items, setItems] = useState<MaintenanceOrderItem[]>(order.items);
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");

  const totalCost = items.reduce((sum, item) => sum + (item.cost || 0), 0);

  function updateItem(index: number, field: keyof MaintenanceOrderItem, value: string | number) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  }

  const handleTransition = (next: MaintenanceStatus) => {
    const res = onTransition(next, items, endDate);
    if (res?.error) setError(res.error);
    else setError("");
  };

  return (
    <RecordPage onBack={onClose}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Orden {order.number}</p>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-gray-900">Mantenimiento {order.items.length === 1 ? "de 1 máquina" : `de ${order.items.length} máquinas`}</h1>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badge(order.status)}`}>{order.status}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {order.status === "Programado" && <button type="button" onClick={onEdit} className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700">Editar</button>}

        </div>
      </div>

      <form id="maintenance-completion-form" noValidate onSubmit={event => event.preventDefault()} className="flex-1 p-5 sm:p-6">
        <div className="grid gap-7 md:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Máquinas a intervenir</h3>
              <div className="mt-3 space-y-4">
                {items.map((it, idx) => {
                  const machine = SAMPLE_MACHINES.find(m => m.id === it.machineId);
                  return (
                    <div key={it.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <div>
                          <span className="text-xs font-semibold text-gray-500">{machine?.code}</span>
                          <span className="ml-2 font-semibold text-gray-900">{machine?.name}</span>
                        </div>
                        <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border">{it.type}</span>
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Descripción del problema / tarea</p>
                          <p className="mt-1 text-sm text-gray-900">{it.description}</p>
                        </div>

                        {order.status === "En curso" ? (
                          <>
                            <div>
                              <label className={labelClass}>Trabajo realizado <span className="text-rose-600">*</span>
                                <textarea required value={it.workPerformed || ""} onChange={(e) => updateItem(idx, "workPerformed", e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
                              </label>
                            </div>
                            <div>
                              <label className={labelClass}>Costo (ARS)
                                <input type="number" min="0" value={it.cost || ""} onChange={(e) => updateItem(idx, "cost", parseFloat(e.target.value) || 0)} placeholder="Ej: 15000" className={field} />
                              </label>
                            </div>
                          </>
                        ) : (
                          <>
                            {(it.workPerformed || order.status === "Finalizado") && (
                              <div>
                                <p className="text-xs text-gray-500">Trabajo realizado</p>
                                <p className="mt-1 text-sm text-gray-900">{it.workPerformed || "—"}</p>
                              </div>
                            )}
                            {it.cost !== undefined && it.cost > 0 && (
                              <div>
                                <p className="text-xs text-gray-500">Costo</p>
                                <p className="mt-1 font-medium text-gray-900">{formatCurrency(it.cost)}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Información de la orden</h3>
              <dl className="mt-3 space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-gray-500">Fecha de emisión</dt>
                  <dd className="mt-0.5 font-medium text-gray-800">{order.issueDate}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Fecha estimada</dt>
                  <dd className="mt-0.5 font-medium text-gray-800">{order.estimatedDate}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Responsable ({order.responsibleType})</dt>
                  <dd className="mt-0.5 font-medium text-gray-800">{responsibleName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Fecha de inicio</dt>
                  <dd className="mt-0.5 font-medium text-gray-800">{order.startDate ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Fecha de finalización</dt>
                  <dd className="mt-0.5 font-medium text-gray-800">{order.endDate ?? "—"}</dd>
                </div>
                {totalCost > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                    <dt className="text-xs text-gray-500">Costo Total</dt>
                    <dd className="mt-0.5 text-lg font-bold text-gray-900">{formatCurrency(totalCost)}</dd>
                  </div>
                )}
              </dl>
              {order.observations && (
                <div className="mt-4 rounded-lg bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-900">Observaciones</p>
                  <p className="mt-1 text-sm text-amber-900">{order.observations}</p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900">Acciones de estado</h3>
              {error && <p role="alert" className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-800">{error}</p>}

              {order.status === "Programado" && (
                 <div className="mt-3 flex flex-col gap-2">
                   <button type="button" onClick={() => handleTransition("En curso")} className="w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700">Iniciar orden</button>
                   <button type="button" onClick={() => handleTransition("Cancelado")} className="w-full rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">Cancelar orden</button>
                 </div>
              )}

              {order.status === "En curso" && (
                 <div className="mt-3 space-y-3">
                   <div>
                     <label className={labelClass}>Fecha de finalización <span className="text-rose-600">*</span>
                       <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className={field} />
                     </label>
                   </div>
                   <button type="button" data-validate-form onClick={() => handleTransition("Finalizado")} className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">Finalizar orden</button>
                 </div>
              )}

              {(order.status === "Finalizado" || order.status === "Cancelado") && (
                 <p className="mt-2 text-xs text-gray-500">La orden está {order.status.toLowerCase()} y no admite cambios.</p>
              )}
            </div>
          </div>
        </div>
      </form>
    </RecordPage>
  );
}

export default function Mantenimientos() {
  const [orders, setOrders] = useState(() => [...SAMPLE_MAINTENANCES]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const { editing, setEditing, selected, setSelected, closeScreen, missing, params } = useRecordScreen(orders, item => item.id, "mantenimiento", "maquina");

  useEffect(() => {
    if (editing === undefined && selected === null) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") { closeScreen(); }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editing, selected]);

  const filtered = useMemo(() => orders.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || o.number.toLowerCase().includes(q) || o.items.some(it => SAMPLE_MACHINES.find(m => m.id === it.machineId)?.name.toLowerCase().includes(q));
    const matchesStatus = statusFilter === "Todos" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [orders, search, statusFilter]);

  function sync() { setOrders([...SAMPLE_MAINTENANCES]); }

  function save(order: MaintenanceOrder, start: boolean) {
    const i = SAMPLE_MAINTENANCES.findIndex((m) => m.id === order.id);
    if (start) {
      order = { ...order, status: "En curso", startDate: new Date().toISOString().slice(0, 10), previousMachineStatuses: {} };
      order.items.forEach(it => {
        const target = SAMPLE_MACHINES.find(m => m.id === it.machineId);
        if (target) {
          order.previousMachineStatuses![it.machineId] = target.status === "Fuera de servicio" ? "Fuera de servicio" : "Activa";
          target.status = "En mantenimiento";
        }
      });
    }
    if (i >= 0) SAMPLE_MAINTENANCES[i] = order;
    else SAMPLE_MAINTENANCES.unshift(order);
    sync();
    setSelected(order);
  }

  function transition(next: MaintenanceStatus, items: MaintenanceOrderItem[], endDate: string) {
    if (!selected) return;

    if (next === "En curso") {
      for (const it of items) {
        if (SAMPLE_MAINTENANCES.some((m) => m.id !== selected.id && m.status === "En curso" && m.items.some(x => x.machineId === it.machineId))) {
          return { error: "Una de las máquinas ya tiene otra orden en curso." };
        }
      }

      const previousStatuses: Record<string, any> = {};
      items.forEach(it => {
        const target = SAMPLE_MACHINES.find(m => m.id === it.machineId);
        if (target) {
          previousStatuses[it.machineId] = target.status === "Fuera de servicio" ? "Fuera de servicio" : "Activa";
          target.status = "En mantenimiento";
        }
      });

      const updated = { ...selected, status: next, startDate: new Date().toISOString().slice(0, 10), previousMachineStatuses: previousStatuses } as MaintenanceOrder;
      save(updated, false);
      return;
    }

    if (next === "Finalizado") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return { error: "Ingresá una fecha de finalización válida." };
      for (const it of items) {
        if (!it.workPerformed?.trim()) return { error: "Ingresá el trabajo realizado para todas las máquinas." };
      }
    }

    const updated = { 
      ...selected, 
      status: next, 
      endDate: next === "Finalizado" ? endDate : selected.endDate, 
      items 
    };

    const i = SAMPLE_MAINTENANCES.findIndex((m) => m.id === selected.id);
    SAMPLE_MAINTENANCES[i] = updated;

    if (selected.status === "En curso") {
      items.forEach(it => {
        const target = SAMPLE_MACHINES.find(m => m.id === it.machineId);
        if (target && !SAMPLE_MAINTENANCES.some((m) => m.id !== selected.id && m.status === "En curso" && m.items.some(x => x.machineId === it.machineId))) {
          target.status = selected.previousMachineStatuses?.[it.machineId] ?? "Activa";
        }
      });
    }

    sync();
    setSelected(updated);
  }

  const today = new Date().toISOString().slice(0, 10);
  if (missing) return <RecordNotFound onBack={closeScreen} />;
  if (editing !== undefined) return <MaintenanceForm key={params.toString()} item={editing} preselectedMachineId={params.get("maquina") ?? undefined} onCancel={() => { setEditing(undefined); }} onSave={save} />;
  if (selected) return <MaintenanceDetails order={selected} onClose={() => { setSelected(null); }} onEdit={() => { setEditing(selected); }} onTransition={transition} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-amber-700">Mantenimiento</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">Órdenes de Mantenimiento</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">Registra y consulta las órdenes de mantenimiento para una o varias máquinas.</p>
        </div>
        <button type="button" onClick={() => setEditing(null)} className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">＋ Nueva Orden</button>
      </header>

      <section className="mt-7 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Listado de órdenes</h2>
            <p className="mt-1 text-sm text-gray-500">{filtered.length} {filtered.length === 1 ? "orden" : "órdenes"} encontradas</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:flex">
            <input aria-label="Buscar órdenes" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar número o máquina..." className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 sm:w-64" />
            <select aria-label="Estado" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100">
              <option value="Todos">Todos los estados</option>
              {MAINTENANCE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div aria-hidden="true" className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500">⌕</div>
            <h3 className="mt-4 font-semibold text-gray-900">No se encontraron órdenes</h3>
            <p className="mt-1 text-sm text-gray-500">Prueba con otro término o cambia los filtros.</p>
            <button type="button" onClick={() => { setSearch(""); setStatusFilter("Todos"); }} className="mt-4 text-sm font-semibold text-amber-700 hover:text-amber-800">Limpiar filtros</button>
          </div>
        ) : (
          <>
            <div className="hidden lg:grid lg:grid-cols-[1fr_1.5fr_1fr_1.5fr_1fr_auto] items-center gap-5 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <div className="min-w-0 text-left">Nº Orden</div>
              <div className="min-w-0 text-left">Máquinas</div>
              <div className="min-w-0 text-center">Programado</div>
              <div className="min-w-0 text-center">Responsable</div>
              <div className="min-w-0 text-center">Estado</div>
              <div className="min-w-0 text-center">Acciones</div>
            </div>
            <div className="divide-y divide-gray-100">
              {filtered.map((o) => {
                const due = o.status === "Programado" && o.estimatedDate < today;
                const machinesSummary = o.items.map(it => SAMPLE_MACHINES.find(m => m.id === it.machineId)?.name).filter(Boolean).join(", ");
                const responsibleName = o.responsibleType === "Empleado" ? (SAMPLE_EMPLOYEES.find((e) => e.id === o.responsibleEmployeeId)?.name || "—") : (o.externalResponsibleName || "—");

                return (
                  <article key={o.id} className="grid min-w-0 grid-cols-2 items-center gap-x-4 gap-y-3 p-4 transition hover:bg-amber-50/30 lg:grid-cols-[1fr_1.5fr_1fr_1.5fr_1fr_auto] lg:gap-5 lg:px-5">
                    <div className="col-span-2 min-w-0 lg:col-span-1 text-left">
                      <h3 className="font-semibold text-gray-900">{o.number}</h3>
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-medium text-gray-500 lg:hidden">Máquinas</p>
                      <p className="mt-1 truncate text-sm text-gray-900 lg:mt-0" title={machinesSummary}>{o.items.length} {o.items.length === 1 ? "máquina" : "máquinas"}: {machinesSummary}</p>
                    </div>
                    <div className="min-w-0 text-left lg:text-center">
                      <p className="text-xs font-medium text-gray-500 lg:hidden">Programado</p>
                      <p className="mt-1 break-words text-sm text-gray-900 lg:mt-0">{o.estimatedDate} {due && <span className="text-red-600 font-semibold block sm:inline">· Vencido</span>}</p>
                    </div>
                    <div className="min-w-0 text-left lg:text-center">
                      <p className="text-xs font-medium text-gray-500 lg:hidden">Responsable</p>
                      <p className="mt-1 break-words text-sm text-gray-900 lg:mt-0">{responsibleName} ({o.responsibleType})</p>
                    </div>
                    <div className="flex flex-col items-start gap-1 lg:items-center">
                      <span className="text-xs font-medium text-gray-500 lg:hidden">Estado</span>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badge(o.status)}`}>{o.status}</span>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2 border-t border-gray-100 pt-2 lg:col-span-1 lg:border-0 lg:pt-0 lg:justify-center">
                      <button type="button" onClick={() => { setSelected(o); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-600">Consultar</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
