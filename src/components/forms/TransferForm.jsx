import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { shopApi } from "../../api/authApi";
import { transferApi } from "../../api/transferApi";
import ProductVariantSelector from "./ProductVariantSelector";

let lineSeq = 1;

/**
 * Transfer form: source -> destination location + variant lines.
 * Creates a DRAFT transfer (POST /api/transfers/), fires onCreated.
 */
export default function TransferForm({ onCreated, compact = false }) {
  const [sourceId, setSourceId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState([
    { key: lineSeq++, product: null, variant: null, qty: "" },
  ]);
  const [error, setError] = useState(null);

  const { data: shopsData } = useQuery({
    queryKey: ["shops", "all"],
    queryFn: () => shopApi.list(),
    staleTime: 60000,
  });

  const shops = shopsData?.results || shopsData || [];
  const sources = shops.filter((s) => s.shop_type !== "IN_TRANSIT");
  const destinations = shops.filter(
    (s) => s.shop_type !== "IN_TRANSIT" && String(s.id) !== String(sourceId)
  );

  const createMut = useMutation({
    mutationFn: transferApi.create,
    onSuccess: (transfer) => {
      setError(null);
      setNote("");
      setLines([{ key: lineSeq++, product: null, variant: null, qty: "" }]);
      onCreated?.(transfer);
    },
    onError: (err) => {
      const data = err?.response?.data;
      if (Array.isArray(data?.detail)) {
        setError(data.detail.join(" "));
      } else if (Array.isArray(data?.non_field_errors)) {
        setError(data.non_field_errors.join(" "));
      } else if (data?.detail) {
        setError(String(data.detail));
      } else {
        setError("Could not create the transfer. Check the form and try again.");
      }
    },
  });

  function updateLine(key, patch) {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l))
    );
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      { key: lineSeq++, product: null, variant: null, qty: "" },
    ]);
  }

  function removeLine(key) {
    setLines((prev) =>
      prev.length === 1 ? prev : prev.filter((l) => l.key !== key)
    );
  }

  const validLines = lines.filter((l) => l.variant && l.qty);
  const canSubmit =
    sourceId &&
    destinationId &&
    sourceId !== destinationId &&
    validLines.length > 0 &&
    !createMut.isPending;

  function submit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    createMut.mutate({
      source: Number(sourceId),
      destination: Number(destinationId),
      note,
      lines: validLines.map((l) => ({
        variant: l.variant,
        quantity: String(l.qty),
      })),
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className={`grid gap-3 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            From
          </span>
          <select
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          >
            <option value="">Select source…</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            To
          </span>
          <select
            value={destinationId}
            onChange={(e) => setDestinationId(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          >
            <option value="">Select destination…</option>
            {destinations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Note
          </span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          />
        </label>
      </div>

      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Lines
        </p>
        {lines.map((line) => (
          <div key={line.key} className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <ProductVariantSelector
                value={{ product: line.product, variant: line.variant }}
                onChange={(v) =>
                  updateLine(line.key, { product: v.product, variant: v.variant })
                }
              />
            </div>
            <input
              type="number"
              min="0.001"
              step="any"
              value={line.qty}
              onChange={(e) => updateLine(line.key, { qty: e.target.value })}
              placeholder="Qty"
              className="w-24 rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-amber-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeLine(line.key)}
              disabled={lines.length === 1}
              className="mt-1 text-xs font-semibold text-slate-400 hover:text-rose-600 disabled:opacity-40"
              title="Remove line"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addLine}
          className="text-xs font-semibold text-amber-600 hover:text-amber-800"
        >
          + Add line
        </button>
      </div>

      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        {createMut.isPending ? "Creating…" : "Create draft transfer"}
      </button>
    </form>
  );
}
