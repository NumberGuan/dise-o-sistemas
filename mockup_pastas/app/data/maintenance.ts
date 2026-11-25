export type MachineStatus = "Activa" | "En mantenimiento" | "Fuera de servicio" | "Inactiva";
export type MaintenanceType = string;
export type MaintenanceStatus = "Programado" | "En curso" | "Finalizado" | "Cancelado";

export type Machine = {
  id: string;
  code: string;
  name: string;
  type: string;
  brand: string;
  model: string;
  serialNumber: string;
  location: string;
  acquisitionDate: string;
  status: MachineStatus;
  observations: string;
};

export type MaintenanceOrderItem = {
  id: string;
  machineId: string;
  type: MaintenanceType;
  description: string;
  workPerformed: string;
  approximateCost?: number;
  cost?: number;
};

export type MaintenanceOrder = {
  id: string;
  number: string;
  issueDate: string;
  estimatedDate: string;
  responsibleType: "Empleado" | "Externo";
  responsibleEmployeeId?: string;
  externalResponsibleName?: string;
  status: MaintenanceStatus;
  startDate?: string;
  endDate?: string;
  observations: string;
  items: MaintenanceOrderItem[];
  previousMachineStatuses?: Record<string, Extract<MachineStatus, "Activa" | "Fuera de servicio">>;
};

export const MACHINE_STATUSES: MachineStatus[] = ["Activa", "En mantenimiento", "Fuera de servicio", "Inactiva"];
export const MAINTENANCE_TYPES: MaintenanceType[] = ["Preventivo", "Correctivo"];
export const MAINTENANCE_STATUSES: MaintenanceStatus[] = ["Programado", "En curso", "Finalizado", "Cancelado"];
