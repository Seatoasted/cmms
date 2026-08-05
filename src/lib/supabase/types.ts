export type System = {
  id: string;
  fo_number: string;
  hospital: string | null;
  facility_name: string | null;
  city: string | null;
  state: string | null;
  install_date: string | null;
  warranty_expiration: string | null;
  system_status: string | null;
  contract_type: string | null;
  contract_start: string | null;
  contract_end: string | null;
  annual_contract_value: number | null;
  assigned_fse: string | null;
  notes: string | null;
};

export type PmRecord = {
  id: string;
  system_id: string | null;
  pm_type: string | null;
  scheduled_date: string | null;
  completed_date: string | null;
  assigned_fse: string | null;
  status: string | null;
  findings: string | null;
  notes: string | null;
};

export type SystemPmStatus = System & {
  last_pm: string | null;
  next_pm_due: string | null;
  next_pm_if_never_serviced: string | null;
};

export const SYSTEM_STATUS_OPTIONS = [
  "Active",
  "Down",
  "In Repair",
  "Decommissioned",
] as const;

export const CONTRACT_TYPE_OPTIONS = [
  "Full Service",
  "Parts Only",
  "Time & Materials",
  "None",
] as const;

export function effectiveNextPmDue(row: SystemPmStatus): string | null {
  return row.next_pm_due ?? row.next_pm_if_never_serviced ?? null;
}

export function isPmOverdue(row: SystemPmStatus): boolean {
  const due = effectiveNextPmDue(row);
  if (!due) return false;
  return new Date(due).getTime() < Date.now();
}
