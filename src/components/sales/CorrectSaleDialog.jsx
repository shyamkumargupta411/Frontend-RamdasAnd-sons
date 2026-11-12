import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { salesApi } from "../../api/salesApi";
import ProductVariantSelector from "../forms/ProductVariantSelector";

function errText(err, fallback) {
  const data = err?.response?.data;
  if (Array.isArray(data?.detail)) return data.detail.join(" ");
  if (data?.detail) return String(data.detail);
  if (Array.isArray(data?.non_field_errors)) return data.non_field_errors.join(" ");
  if (data && typeof data === "object") {
    return Object.values(data).flat().map(String).join(" ");
  }
  return fallback;
}

let lineSeq = 1;

/**
 * "Edit sale" dialog — sales are never edited in place: the original is
 * reversed and a linked correction sale is created (mandatory reason).
 */
export default function CorrectSaleDialog({ sale, onClose, onDone }) {
  const [lines, setLines] = useState([
    { key: lineSeq++, product: null, variant: null, qty: "" },
  ]);
  const [reason, setReason] = useState("");
  const [customer, setCustomer] = useState(sale.customer_name || "");
  const [error, setError] = useState(null);

  const correctMut = useMutation({
    mutationFn: (payload) => salesApi.correct(sale.id, payload),
    onSuccess: (corrected) => {
      setError(null);
      onDone?.(corrected);
    },
    onError: (err) => setError(errText(err, "Correction failed.")),
  });

  const updateLine = (key, patch) =>
    setLines((cur) =>
      cur.map((l) => (l.key === key ? { ...l, ...patch } : l))
    );

  const filled = lines.filter((l) => l.variant && Number(l.qty) > 0);
  const canSubmit =
    filled.length > 0 && reason.trim().length > 0 && !correctMut.isPending;

  function submit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    correctMut.mutate({
      reason: reason.trim(),
      customer_name: customer,
      lines: filled.map((l) => ({
        variant: l.variant,
        quantity: String(l.qty),
      })),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-sm font-bold text-slate-800">
              Correct sale {sale.reference}
            </p>
            <p className="text-[11px] text-slate-500">
              The original is reversed and replaced — both stay in history.
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Original lines
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sale.items.map((i) => (
                <span
                  key={i.id}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600"
                >
                  <strong className="font-mono">{i.product_code}</strong>
                  {i.spec_label} × {i.quantity}
                  <span className="text-slate-400">{i.unit_code}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Corrected lines
            </p>
            {lines.map((l) => (
              <div key={l.key} className="space-y-2 rounded-xl border border-slate-200 p-3">
                <ProductVariantSelector
                  value={{ product: l.product, variant: l.variant }}
                  onChange={(v) =>
                    updateLine(l.key, {
                      product: v.product,
                      variant: v.variant,
                    })
                  }
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0.001"
                    step="any"
                    inputMode="decimal"
                    value={l.qty}
                    onChange={(e) => updateLine(l.key, { qty: e.target.value })}
                    placeholder="Quantity"
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    disabled={lines.length === 1}
                    onClick={() =>
                      setLines((cur) => cur.filter((x) => x.key !== l.key))
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="text-xs font-semibold text-amber-700 hover:text-amber-800"
              onClick={() =>
                setLines((cur) => [
                  ...cur,
                  { key: lineSeq++, product: null, variant: null, qty: "" },
                ])
              }
            >
              + Add line
            </button>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Customer (optional)
            </span>
            <input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Reason (required)
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              required
              placeholder="e.g. Wrong quantity entered"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
            />
          </label>

          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {correctMut.isPending ? "Correcting…" : "Correct sale"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
