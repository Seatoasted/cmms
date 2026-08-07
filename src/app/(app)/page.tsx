import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { SystemPmStatus } from "@/lib/supabase/types";
import { effectiveNextPmDue, isPmOverdue } from "@/lib/supabase/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("system_pm_status")
    .select("*");

  const rows = (data ?? []) as SystemPmStatus[];
  const overdue = rows.filter(isPmOverdue);

  const statusCounts = new Map<string, number>();
  for (const row of rows) {
    const status = row.system_status?.trim() || "Unknown";
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
  }

  const underContract = rows.filter(
    (row) => row.contract_type && row.contract_type !== "None"
  ).length;
  const notUnderContract = rows.length - underContract;

  const now = new Date();
  const dueThisMonth = rows.filter((row) => {
    const due = effectiveNextPmDue(row);
    if (!due) return false;
    const dueDate = new Date(due);
    return (
      dueDate.getFullYear() === now.getFullYear() &&
      dueDate.getMonth() === now.getMonth()
    );
  }).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of PM status and system health.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Failed to load dashboard data: {error.message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="PMs Overdue"
          value={overdue.length}
          accent={overdue.length > 0 ? "text-red-600" : "text-emerald-600"}
        />
        <StatCard label="Total Systems" value={rows.length} accent="text-slate-900" />
        <StatCard label="Under Contract" value={underContract} accent="text-slate-900" />
        <StatCard label="Not Under Contract" value={notUnderContract} accent="text-slate-900" />
        <StatCard label="PMs Due This Month" value={dueThisMonth} accent="text-slate-900" />
        {Array.from(statusCounts.entries())
          .slice(0, 2)
          .map(([status, count]) => (
            <StatCard key={status} label={status} value={count} accent="text-slate-900" />
          ))}
      </div>

      {statusCounts.size > 2 && (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-medium text-slate-700">System Status</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from(statusCounts.entries()).map(([status, count]) => (
              <div key={status} className="rounded-md bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">{status}</p>
                <p className="text-lg font-semibold text-slate-900">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-medium text-slate-700">
            Overdue Systems
          </h2>
        </div>
        {overdue.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">
            Nothing overdue. All caught up.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">FO #</th>
                <th className="px-5 py-2 font-medium">Hospital</th>
                <th className="px-5 py-2 font-medium">Facility</th>
                <th className="px-5 py-2 font-medium">Next PM Due</th>
              </tr>
            </thead>
            <tbody>
              {overdue.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-5 py-2">
                    <Link
                      href={`/systems/${row.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {row.fo_number}
                    </Link>
                  </td>
                  <td className="px-5 py-2 text-slate-600">{row.hospital}</td>
                  <td className="px-5 py-2 text-slate-600">
                    {row.facility_name}
                  </td>
                  <td className="px-5 py-2 text-red-600">
                    {formatDate(effectiveNextPmDue(row))}
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

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}
