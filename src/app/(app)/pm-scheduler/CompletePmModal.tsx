"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SystemPmStatus } from "@/lib/supabase/types";

const PM_STATUS_OPTIONS = ["Completed", "Incomplete", "Deferred"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function CompletePmModal({
  system,
  onClose,
  onSaved,
}: {
  system: SystemPmStatus;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pmType, setPmType] = useState("Preventive Maintenance");
  const [scheduledDate, setScheduledDate] = useState(
    system.next_pm_due?.slice(0, 10) ??
      system.next_pm_if_never_serviced?.slice(0, 10) ??
      today()
  );
  const [completedDate, setCompletedDate] = useState(today());
  const [assignedFse, setAssignedFse] = useState(system.assigned_fse ?? "");
  const [status, setStatus] = useState("Completed");
  const [findings, setFindings] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.from("pm_records").insert({
      system_id: system.id,
      pm_type: pmType || null,
      scheduled_date: scheduledDate || null,
      completed_date: completedDate || null,
      assigned_fse: assignedFse || null,
      status: status || null,
      findings: findings || null,
      notes: notes || null,
    });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">Complete PM</h2>
        <p className="mt-1 text-sm text-slate-500">
          {system.fo_number} · {system.facility_name}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="PM Type">
              <input
                value={pmType}
                onChange={(e) => setPmType(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input"
              >
                {PM_STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Scheduled Date">
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Completed Date">
              <input
                type="date"
                value={completedDate}
                onChange={(e) => setCompletedDate(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Assigned FSE">
              <input
                value={assignedFse}
                onChange={(e) => setAssignedFse(e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <Field label="Findings">
            <textarea
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              rows={2}
              className="input"
            />
          </Field>

          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="input"
            />
          </Field>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Log PM"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}
