"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Probe } from "@/lib/supabase/types";
import ProbeFormModal from "./ProbeFormModal";

type ProbeRow = Probe & { systems: { fo_number: string } | null };

export default function ProbesClient() {
  const [probes, setProbes] = useState<ProbeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Probe | null>(null);
  const [showModal, setShowModal] = useState(false);

  async function loadProbes() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("probes")
      .select("*, systems(fo_number)")
      .order("probe_serial");

    if (error) {
      setError(error.message);
    } else {
      setProbes((data ?? []) as ProbeRow[]);
      setError("");
    }
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("probes")
        .select("*, systems(fo_number)")
        .order("probe_serial");

      if (error) {
        setError(error.message);
      } else {
        setProbes((data ?? []) as ProbeRow[]);
        setError("");
      }
      setLoading(false);
    })();
  }, []);

  async function handleDelete(probe: Probe) {
    if (!confirm(`Delete probe ${probe.probe_serial}? This cannot be undone.`)) {
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("probes").delete().eq("id", probe.id);
    if (error) {
      alert(`Failed to delete: ${error.message}`);
      return;
    }
    loadProbes();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Probes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage probes and their system assignments.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Add Probe
        </button>
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
              <th className="px-4 py-2 font-medium">Probe Serial</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Cases</th>
              <th className="px-4 py-2 font-medium">Last Refurb</th>
              <th className="px-4 py-2 font-medium">Assigned System</th>
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
            ) : probes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No probes yet.
                </td>
              </tr>
            ) : (
              probes.map((probe) => (
                <tr
                  key={probe.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {probe.probe_serial}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{probe.probe_type}</td>
                  <td className="px-4 py-2 text-slate-600">{probe.cases}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {probe.last_refurb_date
                      ? new Date(probe.last_refurb_date).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2">
                    {probe.systems?.fo_number ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {probe.systems.fo_number}
                      </span>
                    ) : (
                      <span className="text-slate-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => {
                        setEditing(probe);
                        setShowModal(true);
                      }}
                      className="mr-3 text-sm font-medium text-slate-600 hover:text-slate-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(probe)}
                      className="text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <ProbeFormModal
          probe={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            loadProbes();
          }}
        />
      )}
    </div>
  );
}
