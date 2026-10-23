import type { AddressFields } from "./domicilios";
﻿export type EmployeeRole = string;

export type EmployeeStatus = "Activo" | "Inactivo";

export type Employee = {
  id: string;
  code: string;
  /** Nombre completo provisto por la entidad Persona en el modelo de dominio. */
  name: string;
  email: string;
  address?: AddressFields;
  dni: string;
  role: EmployeeRole;
  hireDate: string;
  hoursWorked: number;
  salary: number;
  status: EmployeeStatus;
};

export const EMPLOYEE_ROLES: EmployeeRole[] = ["Administrador", "Vendedor", "Repartidor"];
export const EMPLOYEE_STATUSES: EmployeeStatus[] = ["Activo", "Inactivo"];

export const SAMPLE_EMPLOYEES: Employee[] = [
  { id: "emp-1", code: "EMP-001", name: "Carlos Menem", email: "carlos.menem@example.com", dni: "20123456", role: "Administrador", hireDate: "2021-03-15", hoursWorked: 8640, salary: 1250000, status: "Activo" },
  { id: "emp-2", code: "EMP-002", name: "Lucía Pérez", email: "lucia.perez@example.com", dni: "32456789", role: "Vendedor", hireDate: "2022-08-01", hoursWorked: 6240, salary: 980000, status: "Activo" },
  { id: "emp-3", code: "EMP-003", name: "Miguel Rodríguez", email: "miguel.rodriguez@example.com", dni: "35111222", role: "Vendedor", hireDate: "2023-02-10", hoursWorked: 4180, salary: 980000, status: "Activo" },
  { id: "emp-4", code: "EMP-004", name: "Roberto Sánchez", email: "roberto.sanchez@example.com", dni: "28777888", role: "Repartidor", hireDate: "2020-11-20", hoursWorked: 9720, salary: 910000, status: "Activo" },
  { id: "emp-5", code: "EMP-005", name: "Marta Gómez", email: "marta.gomez@example.com", dni: "25999888", role: "Repartidor", hireDate: "2019-06-03", hoursWorked: 11840, salary: 910000, status: "Inactivo" },
];
