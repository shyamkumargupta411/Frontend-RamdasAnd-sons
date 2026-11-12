import { useState } from "react";

const FORM_FACTORS = {
  INGOT: {
    label: "Ingot — grade, weight & dimensions",
    fields: ["weight", "length", "width", "thickness"],
  },
  FLAT: {
    label: "Flat / Patiya — thickness, width, length",
    fields: ["thickness", "width", "length"],
  },
  PIPE: {
    label: "Pipe — diameter, thickness, length",
    fields: ["diameter", "thickness", "length"],
  },
  OTHER: {
    label: "Other (rods, angles, channels) — diameter, thickness, length, width",
    fields: ["diameter", "thickness", "length", "width"],
  },
};

export function fieldsForFormFactor(formFactor) {
  return FORM_FACTORS[formFactor] || FORM_FACTORS.OTHER;
}

const FIELD_META = {
  thickness: { label: "Thickness", unit: "mm" },
  width: { label: "Width", unit: "mm" },
  length: { label: "Length", unit: "mm" },
  diameter: { label: "Diameter", unit: "mm" },
  weight: { label: "Weight", unit: "kg" },
};

const emptyVariant = () => ({
  thickness: "",
  width: "",
  length: "",
  diameter: "",
  weight: "",
  unit: "KG",
  weight_per_piece: "",
  length_per_piece: "",
});

function num(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Product form with nested variants.
 * Variant dimension fields change based on the selected category's form_factor.
 */
export default function ProductForm({
  categories = [],
  initial = null,
  onCancel,
  onSubmit,
}) {
  const isEdit = Boolean(initial?.id);
  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState(
    initial?.category || categories[0]?.id || ""
  );
  const [material, setMaterial] = useState(initial?.material || "");
  const [grade, setGrade] = useState(initial?.grade || "");
  const [status, setStatus] = useState(initial?.status || "ACTIVE");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [variants, setVariants] = useState(
    initial?.variants?.length
      ? initial.variants.map((v) => ({
          thickness: v.thickness ?? "",
          width: v.width ?? "",
          length: v.length ?? "",
          diameter: v.diameter ?? "",
          weight: v.weight ?? "",
          unit: v.unit_code || v.unit || "KG",
          weight_per_piece: v.weight_per_piece ?? "",
          length_per_piece: v.length_per_piece ?? "",
        }))
      : [emptyVariant()]
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedCat = categories.find((c) => String(c.id) === String(category));
  const formFactor = selectedCat?.form_factor || "OTHER";
  const { label: fieldHint, fields } = fieldsForFormFactor(formFactor);

  function updateVariant(index, patch) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, ...patch } : v))
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const payload = {
      name: name.trim(),
      category: Number(category),
      material: material.trim(),
      grade: grade.trim(),
      status,
      notes,
      variants: variants.map((v) => ({
        thickness: num(v.thickness),
        width: num(v.width),
        length: num(v.length),
        diameter: num(v.diameter),
        weight: num(v.weight),
        unit: v.unit,
        weight_per_piece: num(v.weight_per_piece),
        length_per_piece: num(v.length_per_piece),
      })),
    };
    const hasDim = payload.variants.some((v) =>
      ["thickness", "width", "length", "diameter", "weight"].some(
        (k) => v[k] !== null
      )
    );
    if (!payload.name || !payload.category || !payload.material) {
      setError("Name, category and material are required.");
      return;
    }
    if (!hasDim) {
      setError("Each variant needs at least one dimension or weight.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      const data = err?.response?.data;
      setError(
        typeof data === "string"
          ? data
          : data?.detail ||
              data?.non_field_errors?.[0] ||
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
    <form onSubmit={handleSubmit} className="space-y-4">
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
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            placeholder="e.g. MS Flat Bar"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          >
            <option value="">Select category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Material *
          </label>
          <input
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            placeholder="Mild Steel / SS / Copper…"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Grade
          </label>
          <input
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            placeholder="Fe500 / SS304…"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DISCONTINUED">Discontinued</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-800">Variants</p>
            <p className="text-xs text-slate-500">{fieldHint}</p>
          </div>
          <button
            type="button"
            className="btn-secondary px-3 py-1.5 text-xs"
            onClick={() => setVariants((p) => [...p, emptyVariant()])}
          >
            + Add variant
          </button>
        </div>

        <div className="mt-3 space-y-3">
          {variants.map((v, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Size {idx + 1}
                </span>
                {variants.length > 1 ? (
                  <button
                    type="button"
                    className="text-xs font-semibold text-rose-500 hover:text-rose-700"
                    onClick={() =>
                      setVariants((p) => p.filter((_, i) => i !== idx))
                    }
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {fields.map((f) => (
                  <div key={f}>
                    <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {FIELD_META[f].label} ({FIELD_META[f].unit})
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={v[f]}
                      onChange={(e) => updateVariant(idx, { [f]: e.target.value })}
                      className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
                      placeholder="—"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Unit
                  </label>
                  <select
                    value={v.unit}
                    onChange={(e) => updateVariant(idx, { unit: e.target.value })}
                    className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="KG">KG</option>
                    <option value="PIECE">Piece</option>
                    <option value="FEET">Feet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    KG / piece
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={v.weight_per_piece}
                    onChange={(e) =>
                      updateVariant(idx, { weight_per_piece: e.target.value })
                    }
                    className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="conv."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Ft / piece
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={v.length_per_piece}
                    onChange={(e) =>
                      updateVariant(idx, { length_per_piece: e.target.value })
                    }
                    className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="conv."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
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
