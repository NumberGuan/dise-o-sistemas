export type EmployeeRole = "Vendedor" | "Administrador" | "Repartidor";

export type EmployeeStatus = "Activo" | "Inactivo";

export type Employee = {
  id: string;
  code: string;
  /** Nombre completo provisto por la entidad Persona en el modelo de dominio. */
  name: string;
  role: EmployeeRole;
  hireDate: string;
  hoursWorked: number;
  status: EmployeeStatus;
};

export const EMPLOYEE_ROLES: EmployeeRole[] = ["Administrador", "Vendedor", "Repartidor"];
export const EMPLOYEE_STATUSES: EmployeeStatus[] = ["Activo", "Inactivo"];

export const SAMPLE_EMPLOYEES: Employee[] = [
  { id: "emp-1", code: "EMP-001", name: "Carlos Menem", role: "Administrador", hireDate: "2021-03-15", hoursWorked: 8640, status: "Activo" },
  { id: "emp-2", code: "EMP-002", name: "Lucía Pérez", role: "Vendedor", hireDate: "2022-08-01", hoursWorked: 6240, status: "Activo" },
  { id: "emp-3", code: "EMP-003", name: "Miguel Rodríguez", role: "Vendedor", hireDate: "2023-02-10", hoursWorked: 4180, status: "Activo" },
  { id: "emp-4", code: "EMP-004", name: "Roberto Sánchez", role: "Repartidor", hireDate: "2020-11-20", hoursWorked: 9720, status: "Activo" },
  { id: "emp-5", code: "EMP-005", name: "Marta Gómez", role: "Repartidor", hireDate: "2019-06-03", hoursWorked: 11840, status: "Inactivo" },
];
