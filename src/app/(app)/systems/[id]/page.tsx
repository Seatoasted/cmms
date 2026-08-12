import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PmRecord, Probe, SystemPmStatus } from "@/lib/supabase/types";
import {
  effectiveNextPmDue,
  isBiosBatteryDue,
  isPmOverdue,
} from "@/lib/supabase/types";

export default async function SystemProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: system, error: systemError },
    { data: records },
    { data: probeRows },
    { data: batteryRow },
  ] = await Promise.all([
    supabase.from("system_pm_status").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("pm_records")
      .select("*")
      .eq("system_id", id)
      .order("scheduled_date", { ascending: false }),
    supabase.from("probes").select("*").eq("system_id", id).order("probe_serial"),
    supabase
      .from("systems")
      .select("bios_battery_last_replaced")
      .eq("id", id)
      .maybeSingle(),
  ]);

  if (systemError || !system) {
    notFound();
  }

  const row = system as SystemPmStatus;
  const pmRecords = (records ?? []) as PmRecord[];
  const probes = (probeRows ?? []) as Probe[];
  const biosBatteryLastReplaced = batteryRow?.bios_battery_last_replaced ?? null;
  const overdue = isPmOverdue(row);
  const batteryDue = isBiosBatteryDue(biosBatteryLastReplaced);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/systems" className="text-sm text-slate-500 hover:underline">
          ← Back to Systems
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">
            {row.fo_number}
          </h1>
          {overdue && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
              PM Overdue
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {row.facility_name} · {row.hospital}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Facility">
          <Detail label="Hospital" value={row.hospital} />
          <Detail label="Facility Name" value={row.facility_name} />
          <Detail label="City" value={row.city} />
          <Detail label="State" value={row.state} />
        </Section>

        <Section title="System">
          <Detail label="System Status" value={row.system_status} />
          <Detail label="Install Date" value={formatDate(row.install_date)} />
          <Detail
            label="Warranty Expiration"
            value={formatDate(row.warranty_expiration)}
          />
          <Detail label="Assigned FSE" value={row.assigned_fse} />
          <div className="flex items-center justify-between text-sm">
            <dt className="text-slate-500">BIOS Battery Last Replaced</dt>
            <dd className="flex items-center gap-2 text-slate-900">
              {batteryDue && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                  Due
                </span>
              )}
              {formatDate(biosBatteryLastReplaced) || "—"}
            </dd>
          </div>
        </Section>

        <Section title="Contract">
          <Detail label="Contract Type" value={row.contract_type} />
          <Detail label="Contract Start" value={formatDate(row.contract_start)} />
          <Detail label="Contract End" value={formatDate(row.contract_end)} />
          <Detail
            label="Annual Contract Value"
            value={
              row.annual_contract_value != null
                ? `$${row.annual_contract_value.toLocaleString()}`
                : null
            }
          />
        </Section>

        <Section title="PM Status">
          <Detail label="Last PM" value={formatDate(row.last_pm)} />
          <Detail
            label="Next PM Due"
            value={formatDate(effectiveNextPmDue(row))}
          />
        </Section>
      </div>

      {row.notes && (
        <Section title="Notes">
          <p className="text-sm text-slate-700 whitespace-pre-wrap">
            {row.notes}
          </p>
        </Section>
      )}

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-medium text-slate-700">PM History</h2>
        </div>
        {pmRecords.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">
            No PM records logged yet.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">Type</th>
                <th className="px-5 py-2 font-medium">Scheduled</th>
                <th className="px-5 py-2 font-medium">Completed</th>
                <th className="px-5 py-2 font-medium">FSE</th>
                <th className="px-5 py-2 font-medium">Status</th>
                <th className="px-5 py-2 font-medium">Findings</th>
              </tr>
            </thead>
            <tbody>
              {pmRecords.map((record) => (
                <tr key={record.id} className="border-t border-slate-100">
                  <td className="px-5 py-2 text-slate-700">{record.pm_type}</td>
                  <td className="px-5 py-2 text-slate-600">
                    {formatDate(record.scheduled_date)}
                  </td>
                  <td className="px-5 py-2 text-slate-600">
                    {formatDate(record.completed_date)}
                  </td>
                  <td className="px-5 py-2 text-slate-600">
                    {record.assigned_fse}
                  </td>
                  <td className="px-5 py-2 text-slate-600">{record.status}</td>
                  <td className="px-5 py-2 text-slate-600">
                    {record.findings}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-medium text-slate-700">
            Assigned Probes
          </h2>
        </div>
        {probes.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">
            No probes assigned to this system.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">Probe Serial</th>
                <th className="px-5 py-2 font-medium">Type</th>
                <th className="px-5 py-2 font-medium">Cases</th>
                <th className="px-5 py-2 font-medium">Last Refurb</th>
              </tr>
            </thead>
            <tbody>
              {probes.map((probe) => (
                <tr key={probe.id} className="border-t border-slate-100">
                  <td className="px-5 py-2 font-medium text-slate-900">
                    {probe.probe_serial}
                  </td>
                  <td className="px-5 py-2 text-slate-600">{probe.probe_type}</td>
                  <td className="px-5 py-2 text-slate-600">{probe.cases}</td>
                  <td className="px-5 py-2 text-slate-600">
                    {formatDate(probe.last_refurb_date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-medium text-slate-700">{title}</h2>
      <dl className="mt-3 space-y-2">{children}</dl>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-900">{value || "—"}</dd>
    </div>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  return new Date(value).toLocaleDateString();
}
