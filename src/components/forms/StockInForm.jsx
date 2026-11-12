import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { shopApi } from "../../api/authApi";
import { receiptApi } from "../../api/inventoryApi";
import ProductVariantSelector from "./ProductVariantSelector";

let lineSeq = 1;

/**
 * Stock-in form: destination warehouse + variant lines + supplier/note.
 * Calls POST /api/stock-receipts/ and fires onCreated on success.
 */
export default function StockInForm({ onCreated, compact = false }) {
  const [warehouseId, setWarehouseId] = useState("");
  const [supplier, setSupplier] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState([
    { key: lineSeq++, product: null, variant: null, qty: "" },
  ]);
  const [error, setError] = useState(null);

  const { data: shopsData } = useQuery({
    queryKey: ["shops", "warehouses"],
    queryFn: () => shopApi.list(),
    staleTime: 60000,
  });

  const shops = shopsData?.results || shopsData || [];
  const warehouses = shops.filter((s) => s.shop_type === "WAREHOUSE");

  const createMut = useMutation({
    mutationFn: receiptApi.create,
    onSuccess: (receipt) => {
      setError(null);
      setSupplier("");
      setNote("");
      setLines([{ key: lineSeq++, product: null, variant: null, qty: "" }]);
      onCreated?.(receipt);
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
        setError("Stock-in failed. Check the form and try again.");
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
      prev.length === 1
        ? prev
        : prev.filter((l) => l.key !== key)
    );
  }

  const validLines = lines.filter((l) => l.variant && l.qty);
  const canSubmit =
    warehouseId && validLines.length > 0 && !createMut.isPending;

  function submit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    createMut.mutate({
      shop: Number(warehouseId),
      supplier,
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
            Destination warehouse
          </span>
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          >
            <option value="">Select warehouse…</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Supplier
          </span>
          <input
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="e.g. Steel Traders"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          />
        </label>
        {!compact ? (
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
        ) : null}
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
        {createMut.isPending ? "Receiving…" : "Receive stock"}
      </button>
    </form>
  );
}
