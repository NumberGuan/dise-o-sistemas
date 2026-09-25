export type EmployeeRole = "Vendedor" | "Administrador" | "Repartidor";

export type Employee = {
  id: string;
  code: string;
  name: string;
  role: EmployeeRole;
  status: "Activo" | "Inactivo";
};

export const SAMPLE_EMPLOYEES: Employee[] = [
  { id: "emp-1", code: "EMP-001", name: "Carlos Menem", role: "Administrador", status: "Activo" },
  { id: "emp-2", code: "EMP-002", name: "Lucía Pérez", role: "Vendedor", status: "Activo" },
  { id: "emp-3", code: "EMP-003", name: "Miguel Rodríguez", role: "Vendedor", status: "Activo" },
  { id: "emp-4", code: "EMP-004", name: "Roberto Sánchez", role: "Repartidor", status: "Activo" }
];
