"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { SystemPmStatus } from "@/lib/supabase/types";
import { effectiveNextPmDue } from "@/lib/supabase/types";
import CompletePmModal from "./CompletePmModal";

function pmUrgency(row: SystemPmStatus): "overdue" | "soon" | "ok" | "unknown" {
  const due = effectiveNextPmDue(row);
  if (!due) return "unknown";
  const dueTime = new Date(due).getTime();
  const now = Date.now();
  if (dueTime < now) return "overdue";
  if (dueTime - now < 1000 * 60 * 60 * 24 * 30) return "soon";
  return "ok";
}

export default function PmSchedulerClient() {
  const [systems, setSystems] = useState<SystemPmStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completingFor, setCompletingFor] = useState<SystemPmStatus | null>(
    null
  );

  async function load() {
    const supabase = createClient();
    const { data, error } = await supabase.from("system_pm_status").select("*");

    if (error) {
      setError(error.message);
    } else {
      const rows = (data ?? []) as SystemPmStatus[];
      rows.sort((a, b) => {
        const dueA = effectiveNextPmDue(a);
        const dueB = effectiveNextPmDue(b);
        if (!dueA && !dueB) return 0;
        if (!dueA) return 1;
        if (!dueB) return -1;
        return new Date(dueA).getTime() - new Date(dueB).getTime();
      });
      setSystems(rows);
      setError("");
    }
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("system_pm_status")
        .select("*");

      if (error) {
        setError(error.message);
      } else {
        const rows = (data ?? []) as SystemPmStatus[];
        rows.sort((a, b) => {
          const dueA = effectiveNextPmDue(a);
          const dueB = effectiveNextPmDue(b);
          if (!dueA && !dueB) return 0;
          if (!dueA) return 1;
          if (!dueB) return -1;
          return new Date(dueA).getTime() - new Date(dueB).getTime();
        });
        setSystems(rows);
        setError("");
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">PM Scheduler</h1>
        <p className="mt-1 text-sm text-slate-500">
          Systems ordered by next PM due date. Log completions as you go.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">FO #</th>
              <th className="px-4 py-2 font-medium">Facility</th>
              <th className="px-4 py-2 font-medium">Last PM</th>
              <th className="px-4 py-2 font-medium">Next PM Due</th>
              <th className="px-4 py-2 font-medium">Assigned FSE</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : systems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No systems found.
                </td>
              </tr>
            ) : (
              systems.map((system) => {
                const urgency = pmUrgency(system);
                return (
                  <tr
                    key={system.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-2">
                      <Link
                        href={`/systems/${system.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {system.fo_number}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {system.facility_name}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {formatDate(system.last_pm)}
                    </td>
                    <td className="px-4 py-2">
                      <UrgencyBadge urgency={urgency} />{" "}
                      <span className="ml-1 text-slate-600">
                        {formatDate(effectiveNextPmDue(system))}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {system.assigned_fse}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => setCompletingFor(system)}
                        className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                      >
                        Complete PM
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {completingFor && (
        <CompletePmModal
          system={completingFor}
          onClose={() => setCompletingFor(null)}
          onSaved={() => {
            setCompletingFor(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function UrgencyBadge({
  urgency,
}: {
  urgency: "overdue" | "soon" | "ok" | "unknown";
}) {
  if (urgency === "unknown") {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
        —
      </span>
    );
  }
  const config = {
    overdue: { label: "Overdue", cls: "bg-red-100 text-red-800" },
    soon: { label: "Due Soon", cls: "bg-amber-100 text-amber-800" },
    ok: { label: "OK", cls: "bg-emerald-100 text-emerald-800" },
  }[urgency];
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.cls}`}>
      {config.label}
    </span>
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}
