import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { shopApi } from "../../api/authApi";
import { stockApi } from "../../api/inventoryApi";
import PageHeader from "../../components/common/PageHeader";
import StockInForm from "../../components/forms/StockInForm";
import StageNotice from "../../components/common/StageNotice";

export default function StockOverviewPage() {
  const queryClient = useQueryClient();
  const [shop, setShop] = useState("");
  const [search, setSearch] = useState("");
  const [showReceive, setShowReceive] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);

  const { data: shopsData } = useQuery({
    queryKey: ["shops", "all"],
    queryFn: () => shopApi.list(),
    staleTime: 60000,
  });

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["stock-levels", shop, search],
    queryFn: () =>
      stockApi.levels({
        shop: shop || undefined,
        search: search || undefined,
      }),
    retry: 1,
  });

  const shops = shopsData?.results || shopsData || [];
  const rows = data?.results || data || [];

  const onCreated = (receipt) => {
    setLastReceipt(receipt);
    queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
    queryClient.invalidateQueries({ queryKey: ["stock-receipts"] });
  };

  return (
    <>
      <PageHeader
        title="Stock Overview"
        description="Live quantities per location for every product variant."
        actions={
          <button
            type="button"
            className="btn-primary px-3 py-1.5 text-xs"
            onClick={() => setShowReceive((v) => !v)}
          >
            {showReceive ? "Close" : "+ Receive stock"}
          </button>
        }
      />

      {showReceive ? (
        <div className="card mb-4 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-800">
            Receive stock into warehouse
          </p>
          <StockInForm onCreated={onCreated} compact />
        </div>
      ) : null}

      {lastReceipt ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Received <strong>{lastReceipt.reference}</strong> into{" "}
          {lastReceipt.shop_name}.
        </div>
      ) : null}

      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search product code, name, size…"
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        />
        <select
          value={shop}
          onChange={(e) => setShop(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
        >
          <option value="">All locations</option>
          {shops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.shop_type === "WAREHOUSE" ? " (Warehouse)" : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn-secondary px-3 py-2 text-xs"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? "…" : "Refresh"}
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Location
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Product
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Size / Spec
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Quantity
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Updated
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
                    {error?.response?.data?.detail || "Failed to load stock."}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No stock yet. Use “Receive stock” to create the first
                    receipt.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {r.shop_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] text-slate-400">
                        {r.product_code}
                      </span>{" "}
                      <span className="font-medium text-slate-900">
                        {r.product_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {r.spec_label}{" "}
                      <span className="text-slate-400">· {r.unit_code}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {r.quantity}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(r.updated_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4">
        <StageNotice>
          Stock levels update automatically from receipts and transfers.
          Adjustments and sales join in later stages.
        </StageNotice>
      </div>
    </>
  );
}
