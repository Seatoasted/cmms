"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { System } from "@/lib/supabase/types";
import SystemFormModal from "../systems/SystemFormModal";

const EXPIRING_SOON_DAYS = 90;

function contractUrgency(
  system: System
): "no-contract" | "expired" | "soon" | "ok" {
  if (!system.contract_end) return "no-contract";
  const endTime = new Date(system.contract_end).getTime();
  const now = Date.now();
  if (endTime < now) return "expired";
  if (endTime - now < 1000 * 60 * 60 * 24 * EXPIRING_SOON_DAYS) return "soon";
  return "ok";
}

export default function ContractSchedulerClient() {
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<System | null>(null);

  async function load() {
    const supabase = createClient();
    const { data, error } = await supabase.from("systems").select("*");

    if (error) {
      setError(error.message);
    } else {
      const rows = (data ?? []) as System[];
      rows.sort((a, b) => {
        if (!a.contract_end && !b.contract_end) return 0;
        if (!a.contract_end) return 1;
        if (!b.contract_end) return -1;
        return (
          new Date(a.contract_end).getTime() -
          new Date(b.contract_end).getTime()
        );
      });
      setSystems(rows);
      setError("");
    }
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("systems").select("*");

      if (error) {
        setError(error.message);
      } else {
        const rows = (data ?? []) as System[];
        rows.sort((a, b) => {
          if (!a.contract_end && !b.contract_end) return 0;
          if (!a.contract_end) return 1;
          if (!b.contract_end) return -1;
          return (
            new Date(a.contract_end).getTime() -
            new Date(b.contract_end).getTime()
          );
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
        <h1 className="text-2xl font-semibold text-slate-900">
          Contract Scheduler
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Systems ordered by contract end date. Flags who needs to be
          contacted for renewal.
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
              <th className="px-4 py-2 font-medium">Contract Type</th>
              <th className="px-4 py-2 font-medium">Contract End</th>
              <th className="px-4 py-2 font-medium">Annual Value</th>
              <th className="px-4 py-2 font-medium">Assigned FSE</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : systems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  No systems found.
                </td>
              </tr>
            ) : (
              systems.map((system) => {
                const urgency = contractUrgency(system);
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
                      {system.contract_type}
                    </td>
                    <td className="px-4 py-2">
                      <UrgencyBadge urgency={urgency} />{" "}
                      <span className="ml-1 text-slate-600">
                        {formatDate(system.contract_end)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {system.annual_contract_value != null
                        ? `$${system.annual_contract_value.toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {system.assigned_fse}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => setEditing(system)}
                        className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                      >
                        Update Contract
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <SystemFormModal
          system={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
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
  urgency: "no-contract" | "expired" | "soon" | "ok";
}) {
  const config = {
    "no-contract": { label: "No Contract", cls: "bg-slate-100 text-slate-500" },
    expired: { label: "Expired", cls: "bg-red-100 text-red-800" },
    soon: { label: "Expiring Soon", cls: "bg-amber-100 text-amber-800" },
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
