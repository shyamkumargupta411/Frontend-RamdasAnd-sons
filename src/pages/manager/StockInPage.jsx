import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { receiptApi } from "../../api/inventoryApi";
import PageHeader from "../../components/common/PageHeader";
import StockInForm from "../../components/forms/StockInForm";
import StageNotice from "../../components/common/StageNotice";

export default function StockInPage() {
  const queryClient = useQueryClient();
  const [lastReceipt, setLastReceipt] = useState(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["stock-receipts"],
    queryFn: () => receiptApi.list(),
    retry: 1,
  });

  const onCreated = (receipt) => {
    setLastReceipt(receipt);
    queryClient.invalidateQueries({ queryKey: ["stock-receipts"] });
    queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
  };

  const receipts = data?.results || data || [];

  return (
    <>
      <PageHeader
        title="Stock In"
        description="Receive goods into a warehouse. Quantities post to stock levels instantly."
      />

      {lastReceipt ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Received <strong>{lastReceipt.reference}</strong> into{" "}
          {lastReceipt.shop_name} — {lastReceipt.lines.length} line
          {lastReceipt.lines.length === 1 ? "" : "s"} recorded.
        </div>
      ) : null}

      <div className="card mb-4 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-800">
          New receipt
        </p>
        <StockInForm onCreated={onCreated} />
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">
            Recent receipts
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
                  Destination
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Supplier
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Lines
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Received by
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date
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
                    {error?.response?.data?.detail || "Failed to load."}
                  </td>
                </tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No receipts yet.
                  </td>
                </tr>
              ) : (
                receipts.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                      {r.reference}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {r.shop_name}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {r.supplier || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {r.lines.map((l) => (
                        <span
                          key={l.id}
                          className="mr-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                        >
                          {l.product_code} {l.spec_label} × {l.quantity}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {r.created_by_username || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                  </tr>
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
          Stock-in is OWNER / MANAGER only. Receipts are numbered RCV-0001 and
          cannot be edited after posting — corrections happen via adjustments.
        </StageNotice>
      </div>
    </>
  );
}
