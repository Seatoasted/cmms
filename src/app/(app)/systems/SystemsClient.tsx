"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { System } from "@/lib/supabase/types";
import SystemFormModal from "./SystemFormModal";

export default function SystemsClient() {
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<System | null>(null);
  const [showModal, setShowModal] = useState(false);

  async function loadSystems() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("systems")
      .select("*")
      .order("fo_number");

    if (error) {
      setError(error.message);
    } else {
      setSystems(data ?? []);
      setError("");
    }
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("systems")
        .select("*")
        .order("fo_number");

      if (error) {
        setError(error.message);
      } else {
        setSystems(data ?? []);
        setError("");
      }
      setLoading(false);
    })();
  }, []);

  async function handleDelete(system: System) {
    if (!confirm(`Delete system ${system.fo_number}? This cannot be undone.`)) {
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("systems").delete().eq("id", system.id);
    if (error) {
      alert(`Failed to delete: ${error.message}`);
      return;
    }
    loadSystems();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Systems</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage system records.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Add System
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
              <th className="px-4 py-2 font-medium">FO #</th>
              <th className="px-4 py-2 font-medium">Hospital</th>
              <th className="px-4 py-2 font-medium">Facility</th>
              <th className="px-4 py-2 font-medium">City</th>
              <th className="px-4 py-2 font-medium">State</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Assigned FSE</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : systems.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                  No systems yet.
                </td>
              </tr>
            ) : (
              systems.map((system) => (
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
                  <td className="px-4 py-2 text-slate-600">{system.hospital}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {system.facility_name}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{system.city}</td>
                  <td className="px-4 py-2 text-slate-600">{system.state}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={system.system_status} />
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {system.assigned_fse}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => {
                        setEditing(system);
                        setShowModal(true);
                      }}
                      className="mr-3 text-sm font-medium text-slate-600 hover:text-slate-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(system)}
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
        <SystemFormModal
          system={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            loadSystems();
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-slate-400">—</span>;
  const color =
    status === "Active"
      ? "bg-emerald-100 text-emerald-800"
      : status === "Down"
        ? "bg-red-100 text-red-800"
        : status === "In Repair"
          ? "bg-amber-100 text-amber-800"
          : "bg-slate-100 text-slate-700";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}
