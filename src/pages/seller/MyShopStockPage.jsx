import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { stockApi } from "../../api/inventoryApi";
import PageHeader from "../../components/common/PageHeader";
import StageNotice from "../../components/common/StageNotice";

export default function MyShopStockPage() {
  const [q, setQ] = useState("");

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["stock-levels", "seller"],
    queryFn: () => stockApi.levels(),
    retry: 1,
  });

  const levels = (data?.results || data || []).filter((row) => {
    if (!q.trim()) return true;
    const hay = `${row.product_code} ${row.product_name || ""} ${
      row.spec_label || ""
    } ${row.unit_code || ""}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  return (
    <>
      <PageHeader
        title="My Shop Stock"
        description="Live quantities in your assigned shop."
        actions={
          <button
            type="button"
            className="btn-primary px-3 py-1.5 text-xs"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        }
      />

      <div className="mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search product, spec or unit…"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Product
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Spec
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Quantity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-rose-600">
                    {error?.response?.data?.detail || "Failed to load stock."}
                  </td>
                </tr>
              ) : levels.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                    {q ? "Nothing matches that search." : "No stock in your shop yet."}
                  </td>
                </tr>
              ) : (
                levels.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-semibold text-slate-700">
                        {row.product_code}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {row.product_name}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {row.spec_label || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-base font-bold text-slate-800">
                        {Number(row.quantity)}
                      </span>
                      <span className="ml-1 text-[11px] text-slate-500">
                        {row.unit_code}
                      </span>
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
          Stock here is updated by shop transfers and by sales you record.
        </StageNotice>
      </div>
    </>
  );
}
