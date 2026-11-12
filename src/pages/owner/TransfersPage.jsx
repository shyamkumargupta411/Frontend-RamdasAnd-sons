import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState } from "react";

import { transferApi } from "../../api/transferApi";
import PageHeader from "../../components/common/PageHeader";
import StageNotice from "../../components/common/StageNotice";
import TransferStatusBadge from "../../components/common/TransferStatusBadge";
import ReceiveTransferForm from "../../components/forms/ReceiveTransferForm";
import TransferForm from "../../components/forms/TransferForm";

function errText(err, fallback) {
  const data = err?.response?.data;
  if (Array.isArray(data?.detail)) return data.detail.join(" ");
  if (data?.detail) return String(data.detail);
  return fallback;
}

export default function TransfersPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [lastTransfer, setLastTransfer] = useState(null);
  const [receiving, setReceiving] = useState(null); // transfer being received
  const [expanded, setExpanded] = useState(null); // transfer id with open items
  const [actionError, setActionError] = useState(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["transfers"],
    queryFn: () => transferApi.list(),
    retry: 1,
  });

  const { data: inTransitData } = useQuery({
    queryKey: ["transfers", "in_transit"],
    queryFn: () => transferApi.inTransit(),
    staleTime: 15000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["transfers"] });
    queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
  };

  const dispatchMut = useMutation({
    mutationFn: transferApi.dispatch,
    onSuccess: (t) => {
      setActionError(null);
      setLastTransfer(t);
      invalidate();
    },
    onError: (err) => setActionError(errText(err, "Dispatch failed.")),
  });

  const cancelMut = useMutation({
    mutationFn: transferApi.cancel,
    onSuccess: (t) => {
      setActionError(null);
      setLastTransfer(t);
      invalidate();
    },
    onError: (err) => setActionError(errText(err, "Cancel failed.")),
  });

  const transfers = data?.results || data || [];
  const inTransit = inTransitData?.results || inTransitData || [];

  const onCreated = (t) => {
    setLastTransfer(t);
    invalidate();
  };

  const onReceived = (t) => {
    setReceiving(null);
    setLastTransfer(t);
    invalidate();
  };

  return (
    <>
      <PageHeader
        title="Transfers"
        description="Move stock between locations. Draft → Dispatched → Received."
        actions={
          <button
            type="button"
            className="btn-primary px-3 py-1.5 text-xs"
            onClick={() => setShowCreate((v) => !v)}
          >
            {showCreate ? "Close" : "+ New transfer"}
          </button>
        }
      />

      {showCreate ? (
        <div className="card mb-4 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-800">
            Create draft transfer
          </p>
          <TransferForm
            onCreated={(t) => {
              onCreated(t);
              setShowCreate(false);
            }}
            compact
          />
        </div>
      ) : null}

      {lastTransfer ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {lastTransfer.status === "DRAFT" ? (
            <>
              Created draft <strong>{lastTransfer.reference}</strong> — dispatch
              it when ready.
            </>
          ) : lastTransfer.status === "DISPATCHED" ? (
            <>
              <strong>{lastTransfer.reference}</strong> is now in transit to{" "}
              {lastTransfer.destination_name}.
            </>
          ) : lastTransfer.status === "CANCELLED" ? (
            <>
              <strong>{lastTransfer.reference}</strong> cancelled — pending
              stock returned to {lastTransfer.source_name}.
            </>
          ) : (
            <>
              <strong>{lastTransfer.reference}</strong> received at{" "}
              {lastTransfer.destination_name}.
            </>
          )}
        </div>
      ) : null}

      {actionError ? (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </div>
      ) : null}

      {inTransit.length > 0 ? (
        <div className="card mb-4 overflow-hidden">
          <div className="border-b border-slate-100 bg-amber-50/50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-900">
              In-transit report — {inTransit.length} transfer
              {inTransit.length === 1 ? "" : "s"} on the way
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Reference
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    From
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    To
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Lines
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Dispatched
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {inTransit.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                      {t.reference}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {t.source_name}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {t.destination_name}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-600">
                      {t.items.map((i) => (
                        <span
                          key={i.id}
                          className="mr-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                        >
                          {i.product_code} {i.spec_label} × {i.pending_quantity}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {t.dispatched_at
                        ? new Date(t.dispatched_at).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">
            Transfer history
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Reference
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  From → To
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Created by
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-rose-600">
                    {error?.response?.data?.detail || "Failed to load transfers."}
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No transfers yet. Use “New transfer” to create the first
                    draft.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <Fragment key={t.id}>
                    <tr>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="font-mono text-xs font-semibold text-slate-700 hover:text-amber-700"
                          onClick={() =>
                            setExpanded((cur) => (cur === t.id ? null : t.id))
                          }
                        >
                          {expanded === t.id ? "▾" : "▸"} {t.reference}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {t.source_name} → {t.destination_name}
                      </td>
                      <td className="px-4 py-3">
                        <TransferStatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {t.created_by_username || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(t.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          {t.status === "DRAFT" ? (
                            <>
                              <button
                                type="button"
                                className="rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                                disabled={dispatchMut.isPending}
                                onClick={() => dispatchMut.mutate(t.id)}
                              >
                                Dispatch
                              </button>
                              <button
                                type="button"
                                className="rounded-lg border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                disabled={cancelMut.isPending}
                                onClick={() => cancelMut.mutate(t.id)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : t.status === "DISPATCHED" ? (
                            <>
                              <button
                                type="button"
                                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
                                onClick={() =>
                                  setReceiving(
                                    receiving?.id === t.id ? null : t
                                  )
                                }
                              >
                                {receiving?.id === t.id ? "Close" : "Receive"}
                              </button>
                              <button
                                type="button"
                                className="rounded-lg border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                disabled={cancelMut.isPending}
                                onClick={() => cancelMut.mutate(t.id)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              {t.status === "RECEIVED" && t.received_at
                                ? new Date(t.received_at).toLocaleDateString()
                                : t.status === "CANCELLED" && t.cancelled_at
                                  ? `Cancelled ${new Date(
                                      t.cancelled_at
                                    ).toLocaleDateString()}`
                                  : "—"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expanded === t.id ? (
                      <tr key={`${t.id}-items`}>
                        <td colSpan={6} className="bg-slate-50 px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {t.items.map((i) => (
                              <span
                                key={i.id}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600"
                              >
                                <strong className="font-mono">
                                  {i.product_code}
                                </strong>
                                {i.spec_label} · shipped{" "}
                                <strong>{i.quantity}</strong>
                                {Number(i.received_quantity) > 0
                                  ? `, received ${i.received_quantity}`
                                  : ""}
                                {Number(i.shortage_quantity) > 0
                                  ? `, short ${i.shortage_quantity}${
                                      i.shortage_reason
                                        ? ` (${i.shortage_reason})`
                                        : ""
                                    }`
                                  : ""}
                                {Number(i.pending_quantity) > 0
                                  ? `, pending ${i.pending_quantity}`
                                  : ""}
                                <span className="text-slate-400">
                                  {i.unit_code}
                                </span>
                              </span>
                            ))}
                          </div>
                          {t.note ? (
                            <p className="mt-2 text-[11px] italic text-slate-500">
                              Note: {t.note}
                            </p>
                          ) : null}
                        </td>
                      </tr>
                    ) : null}
                    {receiving?.id === t.id ? (
                      <tr key={`${t.id}-receive`}>
                        <td colSpan={6} className="bg-emerald-50/40 px-4 py-4">
                          <ReceiveTransferForm
                            transfer={receiving}
                            onDone={onReceived}
                          />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-4 py-2 text-right">
          <button
            type="button"
            className="text-xs font-semibold text-slate-500 hover:text-slate-700"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      <div className="mt-4">
        <StageNotice>
          Dispatch deducts stock into the In-Transit location. Confirm receipt
          (full or partial) to land it at the destination — shortages need a
          reason and become adjustment ADJ-xxxx.
        </StageNotice>
      </div>
    </>
  );
}
