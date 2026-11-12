import { useState } from "react";

const FORM_FACTORS = [
  { value: "INGOT", label: "Ingot (grade / weight / dimensions)" },
  { value: "FLAT", label: "Flat / Patiya (thickness / width / length)" },
  { value: "PIPE", label: "Pipe (diameter / thickness / length)" },
  { value: "OTHER", label: "Other — rods, angles, channels" },
];

export default function CategoryForm({ initial = null, onCancel, onSubmit }) {
  const [name, setName] = useState(initial?.name || "");
  const [code, setCode] = useState(initial?.code || "");
  const [formFactor, setFormFactor] = useState(initial?.form_factor || "OTHER");
  const [description, setDescription] = useState(initial?.description || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function slugify(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        code: (code || slugify(name)).trim(),
        form_factor: formFactor,
        description,
      });
    } catch (err) {
      const data = err?.response?.data;
      setError(
        data?.detail ||
          Object.values(data || {})
            .flat()
            .join(" ") ||
          "Save failed."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Name *
          </label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!initial?.code) setCode(slugify(e.target.value));
            }}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            placeholder="e.g. Metal Ingots"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Code *
          </label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            placeholder="metal-ingots"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Variant fields (form factor)
          </label>
          <select
            value={formFactor}
            onChange={(e) => setFormFactor(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          >
            {FORM_FACTORS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : initial ? "Save changes" : "Create category"}
        </button>
        {onCancel ? (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
