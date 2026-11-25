import type { AddressFields } from "./domicilios";
﻿export type EmployeeRole = string;

export type EmployeeStatus = "Activo" | "Inactivo";

export type Employee = {
  id: string;
  code: string;
  /** Nombre completo provisto por la entidad Persona en el modelo de dominio. */
  name: string;
  email: string;
  phone?: string;
  additionalPhones?: string[];
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
