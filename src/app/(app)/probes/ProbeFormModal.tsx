"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Probe, System } from "@/lib/supabase/types";

type FormState = {
  probe_serial: string;
  probe_type: string;
  cases: string;
  last_refurb_date: string;
  system_id: string;
};

function toFormState(probe: Probe | null): FormState {
  return {
    probe_serial: probe?.probe_serial ?? "",
    probe_type: probe?.probe_type ?? "",
    cases: probe?.cases?.toString() ?? "",
    last_refurb_date: probe?.last_refurb_date ?? "",
    system_id: probe?.system_id ?? "",
  };
}

export default function ProbeFormModal({
  probe,
  onClose,
  onSaved,
}: {
  probe: Probe | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(toFormState(probe));
  const [systems, setSystems] = useState<System[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("systems")
        .select("*")
        .order("fo_number");
      setSystems(data ?? []);
    })();
  }, []);

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const supabase = createClient();
    const payload = {
      probe_serial: form.probe_serial,
      probe_type: form.probe_type || null,
      cases: form.cases ? Number(form.cases) : null,
      last_refurb_date: form.last_refurb_date || null,
      system_id: form.system_id || null,
    };

    const { error } = probe
      ? await supabase.from("probes").update(payload).eq("id", probe.id)
      : await supabase.from("probes").insert(payload);

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
        <h2 className="text-lg font-semibold text-slate-900">
          {probe ? "Edit Probe" : "Add Probe"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Probe Serial *">
              <input
                required
                value={form.probe_serial}
                onChange={(e) => update("probe_serial", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Probe Type">
              <input
                value={form.probe_type}
                onChange={(e) => update("probe_type", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Cases">
              <input
                type="number"
                value={form.cases}
                onChange={(e) => update("cases", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Last Refurb Date">
              <input
                type="date"
                value={form.last_refurb_date}
                onChange={(e) => update("last_refurb_date", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Assigned System (FO #)">
              <select
                value={form.system_id}
                onChange={(e) => update("system_id", e.target.value)}
                className="input"
              >
                <option value="">Unassigned</option>
                {systems.map((system) => (
                  <option key={system.id} value={system.id}>
                    {system.fo_number}
                  </option>
                ))}
              </select>
            </Field>
          </div>

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
              {saving ? "Saving..." : "Save"}
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
