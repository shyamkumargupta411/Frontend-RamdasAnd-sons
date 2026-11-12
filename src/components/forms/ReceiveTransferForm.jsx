import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { transferApi } from "../../api/transferApi";

/**
 * Confirm-receipt form for a DISPATCHED transfer.
 * Per line: received qty (<= pending). Optional shortage reason writes the
 * remainder off as a shortage; without it the remainder stays pending.
 */
export default function ReceiveTransferForm({ transfer, onDone }) {
  const [rows, setRows] = useState(() =>
    (transfer.items || []).map((it) => ({
      variant: it.variant,
      received: String(it.pending_quantity ?? it.quantity),
      reason: "",
    }))
  );
  const [error, setError] = useState(null);

  const receiveMut = useMutation({
    mutationFn: ({ id, payload }) => transferApi.receive(id, payload),
    onSuccess: (updated) => {
      setError(null);
      onDone?.(updated);
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
        setError("Could not confirm receipt. Check the quantities and try again.");
      }
    },
  });

  function updateRow(variant, patch) {
    setRows((prev) =>
      prev.map((r) => (r.variant === variant ? { ...r, ...patch } : r))
    );
  }

  const canSubmit = rows.length > 0 && !receiveMut.isPending;

  function submit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    receiveMut.mutate({
      id: transfer.id,
      payload: {
        lines: rows.map((r) => {
          const line = {
            variant: r.variant,
            received_quantity: String(r.received || 0),
          };
          if (r.reason.trim()) line.shortage_reason = r.reason.trim();
          return line;
        }),
      },
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Confirm receipt — {transfer.reference}
        </p>
        {(transfer.items || []).map((it) => {
          const row = rows.find((r) => r.variant === it.variant) || {};
          const pending = Number(it.pending_quantity ?? it.quantity);
          return (
            <div
              key={it.id}
              className="rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm">
                  <span className="font-mono text-[11px] text-slate-400">
                    {it.product_code}
                  </span>{" "}
                  <span className="font-medium text-slate-900">
                    {it.product_name}
                  </span>{" "}
                  <span className="text-xs text-slate-500">
                    {it.spec_label} · {it.unit_code}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Shipped <strong className="text-slate-700">{it.quantity}</strong>{" "}
                  · pending{" "}
                  <strong className="text-amber-700">{it.pending_quantity}</strong>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Received qty
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={pending}
                    step="any"
                    value={row.received ?? ""}
                    onChange={(e) =>
                      updateRow(it.variant, { received: e.target.value })
                    }
                    className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </label>
                <label className="block min-w-48 flex-1">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Shortage reason (optional — writes the remainder off)
                  </span>
                  <input
                    value={row.reason ?? ""}
                    onChange={(e) =>
                      updateRow(it.variant, { reason: e.target.value })
                    }
                    placeholder="e.g. 2 damaged in transit"
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </label>
              </div>
            </div>
          );
        })}
        <p className="text-[11px] text-slate-500">
          Leave a line short without a reason and it stays pending — you can
          receive the rest later. With a reason, the remainder is written off as
          a shortage adjustment.
        </p>
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
        {receiveMut.isPending ? "Confirming…" : "Confirm receipt"}
      </button>
    </form>
  );
}
