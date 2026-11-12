import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState } from "react";

import { transferApi } from "../../api/transferApi";
import PageHeader from "../../components/common/PageHeader";
import StageNotice from "../../components/common/StageNotice";
import TransferStatusBadge from "../../components/common/TransferStatusBadge";
import ReceiveTransferForm from "../../components/forms/ReceiveTransferForm";

/**
 * Seller view: incoming transfers to my shops + confirm receipt.
 * The API scopes the list to transfers destined for the seller's shops.
 */
export default function IncomingTransfersPage() {
  const queryClient = useQueryClient();
  const [receiving, setReceiving] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [lastTransfer, setLastTransfer] = useState(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["transfers", "incoming"],
    queryFn: () => transferApi.list(),
    retry: 1,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["transfers"] });
    queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
  };

  const onReceived = (t) => {
    setReceiving(null);
    setLastTransfer(t);
    setActionError(null);
    invalidate();
  };

  const transfers = data?.results || data || [];
  const pendingCount = transfers.filter((t) => t.status === "DISPATCHED").length;

  return (
    <>
      <PageHeader
        title="Incoming Transfers"
        description="Goods on the way to your shop — confirm receipt when they arrive."
      />

      {lastTransfer ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Received <strong>{lastTransfer.reference}</strong> — stock is now in
          your shop.
        </div>
      ) : null}

      {actionError ? (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </div>
      ) : null}

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">
            Incoming
            {pendingCount > 0 ? (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                {pendingCount} awaiting receipt
              </span>
            ) : null}
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
                  Status
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Lines
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-rose-600">
                    {error?.response?.data?.detail || "Failed to load transfers."}
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No incoming transfers right now.
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
                        {t.source_name}
                      </td>
                      <td className="px-4 py-3">
                        <TransferStatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {t.items.map((i) => (
                          <span
                            key={i.id}
                            className="mr-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                          >
                            {i.product_code} {i.spec_label} ×{" "}
                            {t.status === "RECEIVED"
                              ? i.received_quantity
                              : i.pending_quantity}
                          </span>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {t.status === "DISPATCHED" ? (
                          <button
                            type="button"
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
                            onClick={() =>
                              setReceiving(receiving?.id === t.id ? null : t)
                            }
                          >
                            {receiving?.id === t.id ? "Close" : "Confirm receipt"}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {t.received_at
                              ? `Received ${new Date(
                                  t.received_at
                                ).toLocaleDateString()}`
                              : "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                    {expanded === t.id ? (
                      <tr>
                        <td colSpan={5} className="bg-slate-50 px-4 py-3">
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
                      <tr>
                        <td colSpan={5} className="bg-emerald-50/40 px-4 py-4">
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
          Receive everything that arrived. If something is missing or damaged,
          record a shortage reason — the remainder is written off as an
          adjustment and closed automatically.
        </StageNotice>
      </div>
    </>
  );
}
