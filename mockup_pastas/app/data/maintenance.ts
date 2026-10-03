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

export type MachineMaintenance = {
  id: string;
  number: string;
  machineId: string;
  type: MaintenanceType;
  scheduledDate: string;
  startDate?: string;
  endDate?: string;
  responsibleEmployeeId?: string;
  description: string;
  workPerformed: string;
  status: MaintenanceStatus;
  observations: string;
  previousMachineStatus?: Extract<MachineStatus, "Activa" | "Fuera de servicio">;
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

export const SAMPLE_MAINTENANCES: MachineMaintenance[] = [
  { id: "mant-1", number: "MAN-0001", machineId: "maq-1", type: "Preventivo", scheduledDate: "2026-10-08", responsibleEmployeeId: "emp-1", description: "Lubricación y control general.", workPerformed: "", status: "Programado", observations: "" },
  { id: "mant-2", number: "MAN-0002", machineId: "maq-2", type: "Preventivo", scheduledDate: "2026-09-15", startDate: "2026-09-15", endDate: "2026-09-15", responsibleEmployeeId: "emp-2", description: "Control de rodillos.", workPerformed: "Se ajustaron rodillos y correas.", status: "Finalizado", observations: "Sin novedades." },
  { id: "mant-3", number: "MAN-0003", machineId: "maq-3", type: "Correctivo", scheduledDate: "2026-09-29", responsibleEmployeeId: "emp-1", description: "Diagnosticar falla eléctrica.", workPerformed: "", status: "Programado", observations: "Máquina fuera de servicio hasta revisión." },
];
