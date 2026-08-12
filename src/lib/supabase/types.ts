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
  bios_battery_last_replaced: string | null;
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

// system_pm_status is a Postgres view whose column list was fixed when it was
// created; it does not include bios_battery_last_replaced, which was added to
// systems afterward. Fetch that field separately from systems and merge it in.
export type SystemPmStatus = Omit<System, "bios_battery_last_replaced"> & {
  last_pm: string | null;
  next_pm_due: string | null;
  next_pm_if_never_serviced: string | null;
};

export type Probe = {
  id: string;
  probe_serial: string;
  probe_type: string | null;
  cases: number | null;
  last_refurb_date: string | null;
  system_id: string | null;
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

export const BIOS_BATTERY_THRESHOLD_YEARS = 2;

export function isBiosBatteryDue(lastReplaced: string | null): boolean {
  if (!lastReplaced) return false;
  const dueDate = new Date(lastReplaced);
  dueDate.setFullYear(dueDate.getFullYear() + BIOS_BATTERY_THRESHOLD_YEARS);
  return dueDate.getTime() < Date.now();
}
