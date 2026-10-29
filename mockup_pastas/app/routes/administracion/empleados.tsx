import { CatalogField } from "~/components/InlineCatalog";
import PhoneFields, { PhoneDetails } from "~/components/PhoneFields";
import { validatePhones } from "~/data/phones";
import { catalogAddressData } from "~/data/catalogs";
import { CatalogOptions, useCatalogs } from "~/components/CatalogProvider";
import AddressFields from "~/components/AddressFields";
import { EMPTY_ADDRESS, validateTabulatedAddress } from "~/data/domicilios";
import { formatClientAddress } from "~/data/sales";
import RecordPage, { RecordNotFound } from "~/components/RecordPage";
import { useRecordScreen } from "~/utils/useRecordScreen";
import { useMemo, useState, type FormEvent, useEffect } from "react";

import {
  EMPLOYEE_STATUSES,
  SAMPLE_EMPLOYEES,
  type Employee,
  type EmployeeRole,
  type EmployeeStatus,
} from "~/data/employees";

const inputClassName =
  "mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100";
const labelClass = "block text-sm font-medium text-gray-700";

function employeeStatusClass(status: EmployeeStatus) {
  return status === "Activo"
    ? "bg-emerald-100 text-emerald-800"
    : "bg-gray-200 text-gray-700";
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

function isValidIsoDate(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return candidate.getUTCFullYear() === year
    && candidate.getUTCMonth() === month - 1
    && candidate.getUTCDate() === day;
}

function nextEmployeeCode(employees: Employee[]) {
  const nextNumber = Math.max(
    0,
    ...employees.map((employee) => Number(employee.code.match(/(\d+)$/)?.[1]) || 0),
  ) + 1;
  return `EMP-${String(nextNumber).padStart(3, "0")}`;
}

type EmployeeFormProps = {
  employee: Employee | null;
  employees: Employee[];
  onCancel: () => void;
  onSave: (employee: Employee) => void;
};

function EmployeeForm({ employee, employees, onCancel, onSave }: EmployeeFormProps) {
  const catalogs = useCatalogs();
  const isNew = employee === null;
  const [code] = useState(() => employee?.code ?? nextEmployeeCode(employees));
  const [name, setName] = useState(employee?.name ?? "");
  const [email, setEmail] = useState(employee?.email ?? "");
  const [phone, setPhone] = useState(employee?.phone ?? "");
  const [additionalPhones, setAdditionalPhones] = useState(employee?.additionalPhones ?? []);
  const [dni, setDni] = useState(employee?.dni ?? "");
  const [role, setRole] = useState<EmployeeRole | "">(employee?.role ?? "");
  const [hireDate, setHireDate] = useState(employee?.hireDate ?? new Date().toISOString().slice(0, 10));
  const [hoursWorked, setHoursWorked] = useState(employee ? String(employee.hoursWorked) : "0");
  const [salary, setSalary] = useState(employee ? String(employee.salary) : "0");
  const [status, setStatus] = useState<EmployeeStatus>(employee?.status ?? "Activo");
  const [address, setAddress] = useState(employee?.address ?? { ...EMPTY_ADDRESS });
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim().replace(/\s+/g, " ");
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedDni = dni.replace(/\D/g, "");
    const parsedHours = Number(hoursWorked);
    const parsedSalary = Number(salary);

    if (!normalizedName) {
      setError("El nombre completo es obligatorio.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Ingresá un email válido.");
      return;
    }
    if (!/^\d{7,8}$/.test(normalizedDni)) {
      setError("El DNI debe contener 7 u 8 dígitos.");
      return;
    }
    if (employees.some((candidate) => candidate.dni === normalizedDni && candidate.id !== employee?.id)) {
      setError(`El DNI ${normalizedDni} ya pertenece a otro empleado.`);
      return;
    }
    if (!role) {
      setError("Seleccioná un cargo.");
      return;
    }
    if (!isValidIsoDate(hireDate)) {
      setError("Ingresá una fecha de ingreso válida.");
      return;
    }
    if (hoursWorked.trim() === "" || !Number.isFinite(parsedHours) || parsedHours < 0) {
      setError("Las horas trabajadas deben ser un número igual o mayor que cero.");
      return;
    }
    if (salary.trim() === "" || !Number.isFinite(parsedSalary) || parsedSalary < 0) {
      setError("El sueldo debe ser un número igual o mayor que cero.");
      return;
    }
    if (employees.some((candidate) => candidate.code.toLowerCase() === code.toLowerCase() && candidate.id !== employee?.id)) {
      setError(`El código ${code} ya pertenece a otro empleado.`);
      return;
    }

    try { validateTabulatedAddress(address, employee?.address, catalogAddressData(catalogs)); }
    catch (error) { setError((error as Error).message); return; }
    let phones;
    try { phones = validatePhones(phone, additionalPhones); }
    catch (error) { setError((error as Error).message); return; }

    onSave({
      ...phones,
      id: employee?.id ?? `emp-${Date.now()}`,
      code,
      name: normalizedName,
      email: normalizedEmail,
      address,
      dni: normalizedDni,
      role,
      hireDate,
      hoursWorked: parsedHours,
      salary: parsedSalary,
      status,
    });
  }

  return (
    <RecordPage onBack={onCancel}>
      <div className="flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-5 py-4 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isNew ? "Nuevo empleado" : `Editar ${employee.name}`}</h1>
          <p className="mt-1 text-sm text-gray-500">Los cambios quedan disponibles durante esta sesión.</p>
        </div>
      </div>
      <form noValidate onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
        {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="employee-code" className={labelClass}>Código</label>
            <input id="employee-code" value={code} readOnly aria-readonly="true" className={`${inputClassName} cursor-not-allowed bg-gray-100 text-gray-600`} />
          </div>
          <div>
            <label htmlFor="employee-name" className={labelClass}>Nombre completo <span className="text-rose-600">*</span></label>
            <input required id="employee-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Nombre y apellido" className={inputClassName} />
          </div>
          <div>
            <label htmlFor="employee-email" className={labelClass}>Email <span className="text-rose-600">*</span></label>
            <input required id="employee-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="empleado@ejemplo.com" className={inputClassName} />
          </div>
          <div>
            <label htmlFor="employee-dni" className={labelClass}>DNI <span className="text-rose-600">*</span></label>
            <input required id="employee-dni" inputMode="numeric" value={dni} onChange={(event) => setDni(event.target.value)} autoComplete="off" placeholder="12345678" className={inputClassName} />
          </div>
          <div>
            <label htmlFor="employee-role" className={labelClass}>Cargo <span className="text-rose-600">*</span></label>
            <CatalogField catalog="cargos" onCreated={entry => setRole(entry.value)} ><select required id="employee-role" value={role} onChange={(event) => setRole(event.target.value as EmployeeRole | "")} className={inputClassName}>
              <option value="">Seleccionar cargo...</option>
              <CatalogOptions catalog="cargos" retained={employee?.role} />
            </select></CatalogField>
          </div>
          <div>
            <label htmlFor="employee-hire-date" className={labelClass}>Fecha de ingreso <span className="text-rose-600">*</span></label>
            <input required id="employee-hire-date" type="date" value={hireDate} onChange={(event) => setHireDate(event.target.value)} className={inputClassName} />
          </div>
          <div>
            <label htmlFor="employee-hours" className={labelClass}>Horas trabajadas <span className="text-rose-600">*</span></label>
            <input required id="employee-hours" type="number" min="0" step="0.5" value={hoursWorked} onChange={(event) => setHoursWorked(event.target.value)} className={inputClassName} />
          </div>
          <div>
            <label htmlFor="employee-salary" className={labelClass}>Sueldo <span className="text-rose-600">*</span></label>
            <input required id="employee-salary" type="number" min="0" step="0.01" value={salary} onChange={(event) => setSalary(event.target.value)} className={inputClassName} />
          </div>
          <div>
            <label htmlFor="employee-status" className={labelClass}>Estado <span className="text-rose-600">*</span></label>
            <select id="employee-status" value={status} onChange={(event) => setStatus(event.target.value as EmployeeStatus)} className={inputClassName}>
              {EMPLOYEE_STATUSES.map((employeeStatus) => <option key={employeeStatus} value={employeeStatus}>{employeeStatus}</option>)}
            </select>
          </div>
        </div>
        <PhoneFields primary={phone} additional={additionalPhones} onChange={(primary, additional) => { setPhone(primary); setAdditionalPhones(additional); }} />
        <section className="space-y-3"><h2 className="font-semibold text-gray-900">Domicilio</h2><AddressFields value={address} previous={employee?.address} onChange={setAddress} /></section>
        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-amber-600">Cancelar</button>
          <button type="submit" className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">{isNew ? "Guardar empleado" : "Guardar cambios"}</button>
        </div>
      </form>
    </RecordPage>
  );
}

type EmployeeDetailProps = {
  employee: Employee;
  onBack: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
};

function EmployeeDetail({ employee, onBack, onEdit, onToggleStatus }: EmployeeDetailProps) {
  return (
    <RecordPage onBack={onBack}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{employee.code}</p>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${employeeStatusClass(employee.status)}`}>{employee.status}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onEdit} className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700">Editar</button>

        </div>
      </div>
      <div className="grid gap-7 p-5 sm:grid-cols-[minmax(0,1fr)_1.2fr] sm:p-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Información de contacto</h3>
          <dl className="mt-3 space-y-3 text-sm">
            <div>
              <dt className="text-xs text-gray-500">DNI</dt>
              <dd className="mt-0.5 break-words font-medium text-gray-800">{employee.dni}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Email</dt>
              <dd className="mt-0.5 break-all font-medium text-gray-800">{employee.email}</dd>
            </div>
            <PhoneDetails primary={employee.phone} additional={employee.additionalPhones} />
            <div><dt className="text-xs text-gray-500">Domicilio</dt><dd className="mt-0.5 font-medium text-gray-800">{employee.address ? formatClientAddress(employee.address) : "Sin domicilio cargado"}</dd></div>
          </dl>

          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col gap-2">
             <button onClick={onToggleStatus} className={`rounded-lg border px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 ${employee.status === "Activo" ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus-visible:outline-red-600" : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:outline-emerald-600"}`}>
               {employee.status === "Activo" ? "Desactivar empleado" : "Activar empleado"}
             </button>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Datos laborales</h3>
          <dl className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-xs text-gray-500">Cargo</dt>
              <dd className="mt-0.5 break-words font-medium text-gray-800">{employee.role}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Fecha de ingreso</dt>
              <dd className="mt-0.5 break-words font-medium text-gray-800">{formatDate(employee.hireDate)}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Horas trabajadas</dt>
              <dd className="mt-0.5 break-words font-medium text-gray-800">{employee.hoursWorked.toLocaleString("es-AR")}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Sueldo base</dt>
              <dd className="mt-0.5 break-words font-medium text-gray-800">{formatCurrency(employee.salary)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </RecordPage>
  );
}

export default function Empleados() {
  const [employees, setEmployees] = useState<Employee[]>(() => [...SAMPLE_EMPLOYEES]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<EmployeeRole | "Todos los cargos">("Todos los cargos");
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | "Todos los estados">("Todos los estados");
  const { editing: editingEmployee, setEditing: setEditingEmployee, selected: selectedEmployee, setSelected: setSelectedEmployee, closeScreen, missing, params } = useRecordScreen(employees, item => item.id, "empleado");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (editingEmployee === undefined && selectedEmployee === null) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") { closeScreen(); }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editingEmployee, selectedEmployee]);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    return employees.filter((employee) => {
      const matchesSearch = !query
        || employee.code.toLocaleLowerCase("es").includes(query)
        || employee.name.toLocaleLowerCase("es").includes(query);
      const matchesRole = roleFilter === "Todos los cargos" || employee.role === roleFilter;
      const matchesStatus = statusFilter === "Todos los estados" || employee.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [employees, roleFilter, search, statusFilter]);

  function saveEmployee(employee: Employee) {
    const existingIndex = SAMPLE_EMPLOYEES.findIndex((candidate) => candidate.id === employee.id);
    if (existingIndex >= 0) {
      SAMPLE_EMPLOYEES[existingIndex] = employee;
      setNotice(`${employee.name} fue actualizado. Los cambios están disponibles durante esta sesión.`);
    } else {
      SAMPLE_EMPLOYEES.unshift(employee);
      setNotice(`${employee.name} fue registrado. Ya puede seleccionarse en nuevas operaciones si está activo.`);
    }
    setEmployees([...SAMPLE_EMPLOYEES]);
    setSelectedEmployee(employee);
  }

  function toggleEmployeeStatus(employee: Employee) {
    const updated: Employee = {
      ...employee,
      status: employee.status === "Activo" ? "Inactivo" : "Activo",
    };
    const employeeIndex = SAMPLE_EMPLOYEES.findIndex((candidate) => candidate.id === employee.id);
    if (employeeIndex >= 0) SAMPLE_EMPLOYEES[employeeIndex] = updated;
    setEmployees([...SAMPLE_EMPLOYEES]);
    setSelectedEmployee(updated);
    setNotice(`${updated.name} ahora está ${updated.status.toLocaleLowerCase("es")}.`);
  }

  if (missing) return <RecordNotFound onBack={closeScreen} />;
  if (editingEmployee !== undefined) return <EmployeeForm key={params.toString()} employee={editingEmployee} employees={employees} onCancel={() => setEditingEmployee(undefined)} onSave={saveEmployee} />;
  if (selectedEmployee) return <EmployeeDetail employee={selectedEmployee} onBack={() => setSelectedEmployee(null)} onEdit={() => { setEditingEmployee(selectedEmployee); }} onToggleStatus={() => toggleEmployeeStatus(selectedEmployee)} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-amber-700">Administración</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">Empleados</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">Alta, consulta y actualización del equipo de trabajo.</p>
        </div>
        <button type="button" onClick={() => setEditingEmployee(null)} className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">＋ Nuevo Empleado</button>
      </header>

      {notice && (
        <div role="status" className="mt-5 flex items-start justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <p>{notice}</p>
          <button type="button" onClick={() => setNotice("")} className="shrink-0 font-semibold underline hover:text-emerald-950">Cerrar</button>
        </div>
      )}

      <section aria-labelledby="employee-list-title" className="mt-7 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="employee-list-title" className="font-semibold text-gray-900">Listado de empleados</h2>
            <p aria-live="polite" className="mt-1 text-sm text-gray-500">{filteredEmployees.length} {filteredEmployees.length === 1 ? "resultado" : "resultados"}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:flex">
            <div>
              <label htmlFor="employee-search" className="sr-only">Buscar por código o nombre</label>
              <input id="employee-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por código o nombre..." className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 sm:w-64" />
            </div>
            <div>
              <label htmlFor="employee-role-filter" className="sr-only">Filtrar por cargo</label>
              <select id="employee-role-filter" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as EmployeeRole | "Todos los cargos")} className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100">
                <option>Todos los cargos</option>
                <CatalogOptions catalog="cargos" />
              </select>
            </div>
            <div>
              <label htmlFor="employee-status-filter" className="sr-only">Filtrar por estado</label>
              <select id="employee-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as EmployeeStatus | "Todos los estados")} className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100">
                <option>Todos los estados</option>
                {EMPLOYEE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
          </div>
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div aria-hidden="true" className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500">⌕</div>
            <h3 className="mt-4 font-semibold text-gray-900">No encontramos empleados</h3>
            <p className="mt-1 text-sm text-gray-500">Probá con otra búsqueda o limpiá los filtros.</p>
            <button type="button" onClick={() => { setSearch(""); setRoleFilter("Todos los cargos"); setStatusFilter("Todos los estados"); }} className="mt-4 text-sm font-semibold text-amber-700 hover:text-amber-800">Limpiar filtros</button>
          </div>
        ) : (
          <>
            <div className="hidden lg:grid lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] items-center gap-5 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <div className="min-w-0 text-left">Código / Nombre</div>
              <div className="min-w-0 text-center">Cargo</div>
              <div className="min-w-0 text-center">Ingreso</div>
              <div className="min-w-0 text-center">Sueldo base</div>
              <div className="min-w-0 text-center">Estado</div>
              <div className="min-w-0 text-center">Acciones</div>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredEmployees.map((employee) => (
                <article key={employee.id} className="grid min-w-0 grid-cols-2 items-center gap-x-4 gap-y-3 p-4 transition hover:bg-amber-50/30 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] lg:gap-5 lg:px-5">
                  <div className="col-span-2 min-w-0 lg:col-span-1 text-left">
                    <p className="mb-1 text-xs font-medium text-gray-500">{employee.code}</p>
                    <h3 className="break-words font-semibold leading-5 text-gray-900">{employee.name}</h3>
                  </div>
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Cargo</p>
                    <p className="mt-1 break-words text-sm text-gray-900 lg:mt-0">{employee.role}</p>
                  </div>
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Fecha de ingreso</p>
                    <p className="mt-1 break-words text-sm text-gray-900 lg:mt-0">{formatDate(employee.hireDate)}</p>
                  </div>
                  <div className="min-w-0 text-left lg:text-center">
                    <p className="text-xs font-medium text-gray-500 lg:hidden">Sueldo base</p>
                    <p className="mt-1 break-words text-sm text-gray-900 lg:mt-0">{formatCurrency(employee.salary)}</p>
                  </div>
                  <div className="flex flex-col items-start gap-1 lg:items-center">
                    <span className="text-xs font-medium text-gray-500 lg:hidden">Estado</span>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${employeeStatusClass(employee.status)}`}>{employee.status}</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2 border-t border-gray-100 pt-2 lg:col-span-1 lg:border-0 lg:pt-0 lg:justify-center">
                    <button type="button" onClick={() => setSelectedEmployee(employee)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-600">Consultar</button>
                    <button type="button" onClick={() => setEditingEmployee(employee)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-amber-600">Editar</button>
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
