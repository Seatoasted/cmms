"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CONTRACT_TYPE_OPTIONS,
  SYSTEM_STATUS_OPTIONS,
  type System,
} from "@/lib/supabase/types";

type FormState = {
  fo_number: string;
  hospital: string;
  facility_name: string;
  city: string;
  state: string;
  install_date: string;
  warranty_expiration: string;
  system_status: string;
  contract_type: string;
  contract_start: string;
  contract_end: string;
  annual_contract_value: string;
  assigned_fse: string;
  notes: string;
};

function toFormState(system: System | null): FormState {
  return {
    fo_number: system?.fo_number ?? "",
    hospital: system?.hospital ?? "",
    facility_name: system?.facility_name ?? "",
    city: system?.city ?? "",
    state: system?.state ?? "",
    install_date: system?.install_date ?? "",
    warranty_expiration: system?.warranty_expiration ?? "",
    system_status: system?.system_status ?? "",
    contract_type: system?.contract_type ?? "",
    contract_start: system?.contract_start ?? "",
    contract_end: system?.contract_end ?? "",
    annual_contract_value: system?.annual_contract_value?.toString() ?? "",
    assigned_fse: system?.assigned_fse ?? "",
    notes: system?.notes ?? "",
  };
}

export default function SystemFormModal({
  system,
  onClose,
  onSaved,
}: {
  system: System | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(toFormState(system));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const supabase = createClient();
    const payload = {
      fo_number: form.fo_number,
      hospital: form.hospital || null,
      facility_name: form.facility_name || null,
      city: form.city || null,
      state: form.state || null,
      install_date: form.install_date || null,
      warranty_expiration: form.warranty_expiration || null,
      system_status: form.system_status || null,
      contract_type: form.contract_type || null,
      contract_start: form.contract_start || null,
      contract_end: form.contract_end || null,
      annual_contract_value: form.annual_contract_value
        ? Number(form.annual_contract_value)
        : null,
      assigned_fse: form.assigned_fse || null,
      notes: form.notes || null,
    };

    const { error } = system
      ? await supabase.from("systems").update(payload).eq("id", system.id)
      : await supabase.from("systems").insert(payload);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">
          {system ? "Edit System" : "Add System"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="FO Number *">
              <input
                required
                value={form.fo_number}
                onChange={(e) => update("fo_number", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Hospital">
              <input
                value={form.hospital}
                onChange={(e) => update("hospital", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Facility Name">
              <input
                value={form.facility_name}
                onChange={(e) => update("facility_name", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="System Status">
              <select
                value={form.system_status}
                onChange={(e) => update("system_status", e.target.value)}
                className="input"
              >
                <option value="">—</option>
                {SYSTEM_STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="City">
              <input
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="State">
              <input
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Install Date">
              <input
                type="date"
                value={form.install_date}
                onChange={(e) => update("install_date", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Warranty Expiration">
              <input
                type="date"
                value={form.warranty_expiration}
                onChange={(e) => update("warranty_expiration", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Contract Type">
              <select
                value={form.contract_type}
                onChange={(e) => update("contract_type", e.target.value)}
                className="input"
              >
                <option value="">—</option>
                {CONTRACT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Annual Contract Value">
              <input
                type="number"
                step="0.01"
                value={form.annual_contract_value}
                onChange={(e) =>
                  update("annual_contract_value", e.target.value)
                }
                className="input"
              />
            </Field>
            <Field label="Contract Start">
              <input
                type="date"
                value={form.contract_start}
                onChange={(e) => update("contract_start", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Contract End">
              <input
                type="date"
                value={form.contract_end}
                onChange={(e) => update("contract_end", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Assigned FSE">
              <input
                value={form.assigned_fse}
                onChange={(e) => update("assigned_fse", e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
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
