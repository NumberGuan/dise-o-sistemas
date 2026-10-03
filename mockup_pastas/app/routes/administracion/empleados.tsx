import { useMemo, useState, type FormEvent } from "react";

import {
  EMPLOYEE_ROLES,
  EMPLOYEE_STATUSES,
  SAMPLE_EMPLOYEES,
  type Employee,
  type EmployeeRole,
  type EmployeeStatus,
} from "~/data/employees";

const inputClassName =
  "mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100";

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
  const isNew = employee === null;
  const [code] = useState(() => employee?.code ?? nextEmployeeCode(employees));
  const [name, setName] = useState(employee?.name ?? "");
  const [role, setRole] = useState<EmployeeRole | "">(employee?.role ?? "");
  const [hireDate, setHireDate] = useState(employee?.hireDate ?? new Date().toISOString().slice(0, 10));
  const [hoursWorked, setHoursWorked] = useState(employee ? String(employee.hoursWorked) : "0");
  const [status, setStatus] = useState<EmployeeStatus>(employee?.status ?? "Activo");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim().replace(/\s+/g, " ");
    const parsedHours = Number(hoursWorked);

    if (!normalizedName) {
      setError("El nombre completo es obligatorio.");
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
    if (employees.some((candidate) => candidate.code.toLowerCase() === code.toLowerCase() && candidate.id !== employee?.id)) {
      setError(`El código ${code} ya pertenece a otro empleado.`);
      return;
    }

    onSave({
      id: employee?.id ?? `emp-${Date.now()}`,
      code,
      name: normalizedName,
      role,
      hireDate,
      hoursWorked: parsedHours,
      status,
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-amber-700">Administración · Empleados</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{isNew ? "Nuevo Empleado" : `Editar ${employee.name}`}</h1>
          <p className="mt-2 text-sm text-gray-500">Los cambios se conservan durante la sesión actual.</p>
        </div>
        <button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-amber-600">
          Volver al listado
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-7 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        {error && <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="employee-code" className="block text-sm font-medium text-gray-700">Código</label>
            <input id="employee-code" value={code} readOnly aria-readonly="true" className={`${inputClassName} cursor-not-allowed bg-gray-100 text-gray-600`} />
          </div>
          <div>
            <label htmlFor="employee-name" className="block text-sm font-medium text-gray-700">Nombre completo *</label>
            <input id="employee-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Nombre y apellido" className={inputClassName} />
          </div>
          <div>
            <label htmlFor="employee-role" className="block text-sm font-medium text-gray-700">Cargo *</label>
            <select id="employee-role" value={role} onChange={(event) => setRole(event.target.value as EmployeeRole | "")} className={inputClassName}>
              <option value="">Seleccionar cargo...</option>
              {EMPLOYEE_ROLES.map((employeeRole) => <option key={employeeRole} value={employeeRole}>{employeeRole}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="employee-hire-date" className="block text-sm font-medium text-gray-700">Fecha de ingreso *</label>
            <input id="employee-hire-date" type="date" value={hireDate} onChange={(event) => setHireDate(event.target.value)} className={inputClassName} />
          </div>
          <div>
            <label htmlFor="employee-hours" className="block text-sm font-medium text-gray-700">Horas trabajadas *</label>
            <input id="employee-hours" type="number" min="0" step="0.5" value={hoursWorked} onChange={(event) => setHoursWorked(event.target.value)} className={inputClassName} />
          </div>
          <div>
            <label htmlFor="employee-status" className="block text-sm font-medium text-gray-700">Estado *</label>
            <select id="employee-status" value={status} onChange={(event) => setStatus(event.target.value as EmployeeStatus)} className={inputClassName}>
              {EMPLOYEE_STATUSES.map((employeeStatus) => <option key={employeeStatus} value={employeeStatus}>{employeeStatus}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-amber-600">Cancelar</button>
          <button type="submit" className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600">
            {isNew ? "Guardar Empleado" : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-amber-700">Administración · Empleados</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{employee.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{employee.code}</p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${employeeStatusClass(employee.status)}`}>{employee.status}</span>
      </div>

      <section aria-labelledby="employee-detail-title" className="mt-7 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 id="employee-detail-title" className="font-semibold text-gray-900">Información del empleado</h2>
        <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <div><dt className="text-sm text-gray-500">Código</dt><dd className="mt-1 font-medium text-gray-900">{employee.code}</dd></div>
          <div><dt className="text-sm text-gray-500">Nombre completo</dt><dd className="mt-1 font-medium text-gray-900">{employee.name}</dd></div>
          <div><dt className="text-sm text-gray-500">Cargo</dt><dd className="mt-1 font-medium text-gray-900">{employee.role}</dd></div>
          <div><dt className="text-sm text-gray-500">Fecha de ingreso</dt><dd className="mt-1 font-medium text-gray-900">{formatDate(employee.hireDate)}</dd></div>
          <div><dt className="text-sm text-gray-500">Horas trabajadas</dt><dd className="mt-1 font-medium text-gray-900">{employee.hoursWorked.toLocaleString("es-AR")}</dd></div>
          <div><dt className="text-sm text-gray-500">Estado</dt><dd className="mt-1 font-medium text-gray-900">{employee.status}</dd></div>
        </dl>
      </section>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button type="button" onClick={onBack} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-amber-600">Volver al listado</button>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onToggleStatus} className={`rounded-lg border px-4 py-2.5 text-sm font-semibold shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 ${employee.status === "Activo" ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus-visible:outline-red-600" : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:outline-emerald-600"}`}>
            {employee.status === "Activo" ? "Desactivar" : "Activar"}
          </button>
          <button type="button" onClick={onEdit} className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600">Editar</button>
        </div>
      </div>
    </div>
  );
}

export default function Empleados() {
  const [employees, setEmployees] = useState<Employee[]>(() => [...SAMPLE_EMPLOYEES]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<EmployeeRole | "Todos los cargos">("Todos los cargos");
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | "Todos los estados">("Todos los estados");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null | undefined>(undefined);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [notice, setNotice] = useState("");

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
    setEditingEmployee(undefined);
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

  if (editingEmployee !== undefined) {
    return <EmployeeForm employee={editingEmployee} employees={employees} onCancel={() => setEditingEmployee(undefined)} onSave={saveEmployee} />;
  }

  if (selectedEmployee) {
    return (
      <EmployeeDetail
        employee={selectedEmployee}
        onBack={() => setSelectedEmployee(null)}
        onEdit={() => setEditingEmployee(selectedEmployee)}
        onToggleStatus={() => toggleEmployeeStatus(selectedEmployee)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-amber-700">Administración</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">Empleados</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">Alta, consulta y actualización del equipo de trabajo.</p>
        </div>
        <button type="button" onClick={() => setEditingEmployee(null)} className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600">+ Nuevo Empleado</button>
      </header>

      {notice && (
        <div role="status" className="mt-5 flex items-start justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <p>{notice}</p>
          <button type="button" onClick={() => setNotice("")} className="shrink-0 font-semibold underline hover:text-emerald-950">Cerrar</button>
        </div>
      )}

      <section aria-labelledby="employee-list-title" className="mt-7 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-4 sm:p-5">
          <div>
            <h2 id="employee-list-title" className="font-semibold text-gray-900">Listado de empleados</h2>
            <p aria-live="polite" className="mt-1 text-sm text-gray-500">{filteredEmployees.length} {filteredEmployees.length === 1 ? "resultado" : "resultados"}</p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div>
              <label htmlFor="employee-search" className="sr-only">Buscar por código o nombre</label>
              <input id="employee-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por código o nombre..." className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
            </div>
            <div>
              <label htmlFor="employee-role-filter" className="sr-only">Filtrar por cargo</label>
              <select id="employee-role-filter" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as EmployeeRole | "Todos los cargos")} className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100">
                <option>Todos los cargos</option>
                {EMPLOYEE_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="employee-status-filter" className="sr-only">Filtrar por estado</label>
              <select id="employee-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as EmployeeStatus | "Todos los estados")} className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100">
                <option>Todos los estados</option>
                {EMPLOYEE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
          </div>
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <h3 className="font-semibold text-gray-900">No encontramos empleados</h3>
            <p className="mt-1 text-sm text-gray-500">Probá con otra búsqueda o limpiá los filtros.</p>
            <button type="button" onClick={() => { setSearch(""); setRoleFilter("Todos los cargos"); setStatusFilter("Todos los estados"); }} className="mt-4 text-sm font-semibold text-amber-700 hover:text-amber-800">Limpiar filtros</button>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full table-fixed text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="w-[12%] px-4 py-3">Código</th>
                    <th className="w-[22%] px-4 py-3">Nombre completo</th>
                    <th className="w-[15%] px-4 py-3">Cargo</th>
                    <th className="w-[16%] px-4 py-3">Fecha de ingreso</th>
                    <th className="w-[14%] px-4 py-3 text-right">Horas trabajadas</th>
                    <th className="w-[10%] px-4 py-3 text-center">Estado</th>
                    <th className="w-[11%] px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="text-gray-800 transition hover:bg-amber-50/40">
                      <td className="px-4 py-4 font-semibold text-gray-900">{employee.code}</td>
                      <td className="px-4 py-4 font-medium">{employee.name}</td>
                      <td className="px-4 py-4">{employee.role}</td>
                      <td className="px-4 py-4">{formatDate(employee.hireDate)}</td>
                      <td className="px-4 py-4 text-right">{employee.hoursWorked.toLocaleString("es-AR")}</td>
                      <td className="px-4 py-4 text-center"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${employeeStatusClass(employee.status)}`}>{employee.status}</span></td>
                      <td className="px-4 py-4"><div className="flex justify-center gap-2"><button type="button" onClick={() => setSelectedEmployee(employee)} className="text-sm font-semibold text-amber-700 hover:text-amber-900 focus-visible:outline-2 focus-visible:outline-amber-600">Consultar</button><button type="button" onClick={() => setEditingEmployee(employee)} className="text-sm font-semibold text-gray-600 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-amber-600">Editar</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-gray-100 lg:hidden">
              {filteredEmployees.map((employee) => (
                <article key={employee.id} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-xs font-semibold text-gray-500">{employee.code}</p><h3 className="mt-1 font-semibold text-gray-900">{employee.name}</h3></div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${employeeStatusClass(employee.status)}`}>{employee.status}</span>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div><dt className="text-xs text-gray-500">Cargo</dt><dd className="mt-1 font-medium text-gray-800">{employee.role}</dd></div>
                    <div><dt className="text-xs text-gray-500">Fecha de ingreso</dt><dd className="mt-1 font-medium text-gray-800">{formatDate(employee.hireDate)}</dd></div>
                    <div className="col-span-2"><dt className="text-xs text-gray-500">Horas trabajadas</dt><dd className="mt-1 font-medium text-gray-800">{employee.hoursWorked.toLocaleString("es-AR")}</dd></div>
                  </dl>
                  <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-3">
                    <button type="button" onClick={() => setSelectedEmployee(employee)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-600">Consultar</button>
                    <button type="button" onClick={() => setEditingEmployee(employee)} className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-amber-600">Editar</button>
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
