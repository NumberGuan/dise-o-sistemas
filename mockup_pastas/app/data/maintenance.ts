export type MachineStatus = "Activa" | "En mantenimiento" | "Fuera de servicio" | "Inactiva";
export type MaintenanceType = "Preventivo" | "Correctivo";
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

export const SAMPLE_MACHINES: Machine[] = [
  { id: "maq-1", code: "MAQ-001", name: "Amasadora industrial", type: "Amasadora", brand: "PastaTech", model: "AM-50", serialNumber: "PT-AM50-1001", location: "Producción · Línea 1", acquisitionDate: "2021-04-12", status: "Activa", observations: "Equipo principal para masas frescas." },
  { id: "maq-2", code: "MAQ-002", name: "Sobadora automática", type: "Sobadora", brand: "ItalPast", model: "SP-300", serialNumber: "IP-SP300-778", location: "Producción · Línea 2", acquisitionDate: "2022-09-05", status: "Activa", observations: "" },
  { id: "maq-3", code: "MAQ-003", name: "Raviolera", type: "Formadora", brand: "RavioliMax", model: "RM-20", serialNumber: "RM20-4419", location: "Producción · Línea 3", acquisitionDate: "2020-02-18", status: "Fuera de servicio", observations: "Pendiente diagnóstico eléctrico." },
  { id: "maq-4", code: "MAQ-004", name: "Secadero", type: "Secadero", brand: "DryPasta", model: "DP-800", serialNumber: "DP800-2208", location: "Sector secado", acquisitionDate: "2019-11-22", status: "Inactiva", observations: "Equipo conservado como respaldo." },
];

export const SAMPLE_MAINTENANCES: MaintenanceOrder[] = [
  {
    id: "mant-1", number: "MAN-0001", issueDate: "2026-10-01", estimatedDate: "2026-10-08", responsibleType: "Empleado", responsibleEmployeeId: "emp-1",
    status: "Programado", observations: "",
    items: [
      { id: "item-1", machineId: "maq-1", type: "Preventivo", description: "Lubricación y control general.", workPerformed: "" }
    ]
  },
  {
    id: "mant-2", number: "MAN-0002", issueDate: "2026-09-10", estimatedDate: "2026-09-15", startDate: "2026-09-15", endDate: "2026-09-15", responsibleType: "Externo", externalResponsibleName: "Técnica Mantenimientos S.A.",
    status: "Finalizado", observations: "Servicio tercerizado.",
    items: [
      { id: "item-2", machineId: "maq-2", type: "Preventivo", description: "Control de rodillos.", workPerformed: "Se ajustaron rodillos y correas.", cost: 45000 }
    ]
  },
  {
    id: "mant-3", number: "MAN-0003", issueDate: "2026-09-25", estimatedDate: "2026-09-29", responsibleType: "Empleado", responsibleEmployeeId: "emp-1",
    status: "Programado", observations: "Máquina fuera de servicio hasta revisión.",
    items: [
      { id: "item-3", machineId: "maq-3", type: "Correctivo", description: "Diagnosticar falla eléctrica.", workPerformed: "" }
    ]
  },
];
