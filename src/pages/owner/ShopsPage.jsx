import { useQuery } from "@tanstack/react-query";

import { shopApi } from "../../api/authApi";
import PageHeader from "../../components/common/PageHeader";
import StageNotice from "../../components/common/StageNotice";
import { formatDateTime } from "../../utils/format";

export default function OwnerShopsPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["owner", "shops"],
    queryFn: () => shopApi.list({ include_inactive: "1" }),
    retry: 1,
  });

  const shops = data?.results || data || [];

  return (
    <>
      <PageHeader
        title="Shops"
        description="Locations that hold stock. Only the owner can create or edit shops."
        actions={
          <button
            type="button"
            className="btn-secondary px-3 py-1.5 text-xs"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
        }
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Shop
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Code
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Phone
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    Loading shops...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-rose-600">
                    {error?.response?.data?.detail || "Failed to load shops."}
                  </td>
                </tr>
              ) : shops.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No shops yet. Create one via{" "}
                    <code className="rounded bg-slate-100 px-1">
                      POST /api/shops/
                    </code>
                    .
                  </td>
                </tr>
              ) : (
                shops.map((shop) => (
                  <tr key={shop.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{shop.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {shop.address || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {shop.code}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {shop.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {shop.is_deleted ? (
                        <span className="text-slate-400">Deleted</span>
                      ) : shop.is_active ? (
                        <span className="text-emerald-600">Active</span>
                      ) : (
                        <span className="text-amber-600">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDateTime(shop.created_at)}
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
          Sellers only ever see their assigned shop in{" "}
          <code className="rounded bg-slate-100 px-1">GET /api/shops/</code> —
          enforced by queryset filtering on the backend, not the UI.
        </StageNotice>
      </div>
    </>
  );
}
