import { useQuery } from "@tanstack/react-query";

import { salesApi } from "../../api/salesApi";
import PageHeader from "../../components/common/PageHeader";
import SaleStatusBadge from "../../components/common/SaleStatusBadge";
import StageNotice from "../../components/common/StageNotice";

export default function MySalesPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["sales", "mine"],
    queryFn: () => salesApi.list(),
    retry: 1,
  });

  const sales = data?.results || data || [];

  return (
    <>
      <PageHeader
        title="My Sales"
        description="Sales recorded at your shop."
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

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Reference
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Customer
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Items
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
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
                    {error?.response?.data?.detail || "Failed to load sales."}
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No sales recorded yet.
                  </td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                      {s.reference}
                      {s.corrects_reference ? (
                        <span className="ml-2 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                          corrects {s.corrects_reference}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(s.sold_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {s.customer_name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {s.items.map((i) => (
                          <span
                            key={i.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600"
                          >
                            <strong className="font-mono">
                              {i.product_code}
                            </strong>
                            {i.spec_label} × {i.quantity}
                            <span className="text-slate-400">
                              {i.unit_code}
                            </span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <SaleStatusBadge status={s.status} />
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
          A corrected sale shows as CORRECTED — the replacement sale carries a
          “corrects” tag back to the original.
        </StageNotice>
      </div>
    </>
  );
}
