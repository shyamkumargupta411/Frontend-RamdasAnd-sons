import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { shopApi } from "../api/authApi";
import { returnApi } from "../api/inventoryApi";
import { salesApi } from "../api/salesApi";
import PageHeader from "../components/common/PageHeader";
import StageNotice from "../components/common/StageNotice";
import ProductVariantSelector from "../components/forms/ProductVariantSelector";

const BADGES = {
  PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
  ACCEPTED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  REJECTED: "bg-rose-50 text-rose-800 ring-rose-200",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
        BADGES[status] || BADGES.PENDING
      }`}
    >
      {status}
    </span>
  );
}

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

/**
 * Returns (owner + manager): register PENDING returns, accept (restock)
 * or reject. Accepted returns increase stock; nothing else does.
 */
export default function ReturnsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [lastReturn, setLastReturn] = useState(null);
  const [error, setError] = useState(null);

  // form state
  const [shopId, setShopId] = useState("");
  const [product, setProduct] = useState(null);
  const [variant, setVariant] = useState(null);
  const [qty, setQty] = useState("");
  const [customer, setCustomer] = useState("");
  const [saleId, setSaleId] = useState("");
  const [reason, setReason] = useState("");

  const params = statusFilter ? { status: statusFilter } : {};
  const { data, isLoading, isError, error: loadError, refetch, isFetching } =
    useQuery({
      queryKey: ["returns", params],
      queryFn: () => returnApi.list(params),
      retry: 1,
    });

  const { data: shopsData } = useQuery({
    queryKey: ["shops", "all"],
    queryFn: () => shopApi.list(),
    staleTime: 60000,
  });
  const shops = (shopsData?.results || shopsData || []).filter(
    (s) => s.shop_type !== "IN_TRANSIT"
  );

  // Sales at the selected shop (optional link for the return).
  const { data: salesData } = useQuery({
    queryKey: ["sales", "for-return", shopId],
    queryFn: () => salesApi.list({ shop: shopId }),
    enabled: Boolean(shopId),
    staleTime: 15000,
  });
  const shopSales = (salesData?.results || salesData || []).filter(
    (s) => s.status === "COMPLETED"
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["returns"] });
    queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
    queryClient.invalidateQueries({ queryKey: ["sales"] });
  };

  const resetForm = () => {
    setShopId("");
    setProduct(null);
    setVariant(null);
    setQty("");
    setCustomer("");
    setSaleId("");
    setReason("");
  };

  const createMut = useMutation({
    mutationFn: returnApi.create,
    onSuccess: (ret) => {
      setError(null);
      setLastReturn(ret);
      resetForm();
      setShowCreate(false);
      invalidate();
    },
    onError: (err) => setError(errText(err, "Could not register the return.")),
  });

  const acceptMut = useMutation({
    mutationFn: returnApi.accept,
    onSuccess: (ret) => {
      setError(null);
      setLastReturn(ret);
      invalidate();
    },
    onError: (err) => setError(errText(err, "Accept failed.")),
  });

  const rejectMut = useMutation({
    mutationFn: (id) => returnApi.reject(id),
    onSuccess: (ret) => {
      setError(null);
      setLastReturn(ret);
      invalidate();
    },
    onError: (err) => setError(errText(err, "Reject failed.")),
  });

  const returns = data?.results || data || [];
  const canSubmit =
    shopId && variant && qty && Number(qty) > 0 && reason.trim() && !createMut.isPending;

  function submitCreate(e) {
    e.preventDefault();
    if (!canSubmit) return;
    const payload = {
      shop: Number(shopId),
      variant,
      quantity: qty,
      reason: reason.trim(),
      customer_name: customer,
    };
    if (saleId) payload.sale = Number(saleId);
    createMut.mutate(payload);
  }

  return (
    <>
      <PageHeader
        title="Returns"
        description="Customer returns: registered as pending, stock moves only when accepted."
        actions={
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 focus:border-amber-500 focus:outline-none"
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <button
              type="button"
              className="btn-primary px-3 py-1.5 text-xs"
              onClick={() => setShowCreate((v) => !v)}
            >
              {showCreate ? "Close" : "+ New return"}
            </button>
          </div>
        }
      />

      {showCreate ? (
        <div className="card mb-4 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-800">
            Register a return (pending until accepted)
          </p>
          <form onSubmit={submitCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Location
                </span>
                <select
                  value={shopId}
                  onChange={(e) => {
                    setShopId(e.target.value);
                    setSaleId("");
                  }}
                  required
                  className="input"
                >
                  <option value="">Select…</option>
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Original sale (optional)
                </span>
                <select
                  value={saleId}
                  onChange={(e) => setSaleId(e.target.value)}
                  disabled={!shopId}
                  className="input"
                >
                  <option value="">
                    {shopId ? "No linked sale…" : "Pick a location first"}
                  </option>
                  {shopSales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.reference}
                      {s.customer_name ? ` — ${s.customer_name}` : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Product
              </span>
              <ProductVariantSelector
                value={{ product, variant }}
                onChange={(v) => {
                  setProduct(v.product);
                  setVariant(v.variant);
                }}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Quantity
                </span>
                <input
                  type="number"
                  min="0.001"
                  step="any"
                  inputMode="decimal"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="0.000"
                  className="input"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Customer (optional)
                </span>
                <input
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="e.g. Walk-in customer"
                  className="input"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Reason (required)
              </span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                required
                placeholder="Why is the customer returning this?"
                className="input"
              />
            </label>

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
              {createMut.isPending ? "Registering…" : "Register return"}
            </button>
          </form>
        </div>
      ) : null}

      {lastReturn ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <strong>{lastReturn.reference}</strong> — {lastReturn.status}
          {lastReturn.status === "PENDING"
            ? ". Stock has not moved yet; accept it to restock."
            : lastReturn.status === "ACCEPTED"
              ? ". Stock increased."
              : ". No stock change."}
        </div>
      ) : null}

      {error && !createMut.isPending ? (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">
            Return history{statusFilter ? ` (${statusFilter})` : ""}
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
                  Date
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Location
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Item
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Qty
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Customer / Sale
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Reason
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-rose-600">
                    {loadError?.response?.data?.detail || "Failed to load returns."}
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-slate-500">
                    No returns recorded.
                  </td>
                </tr>
              ) : (
                returns.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                      {r.reference}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {r.shop_name}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-[11px] font-semibold text-slate-700">
                        {r.product_code}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {r.spec_label}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-semibold text-slate-700">
                      {Number(r.quantity)}{" "}
                      <span className="font-normal text-slate-400">
                        {r.unit_code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {r.customer_name || "—"}
                      {r.sale_reference ? (
                        <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold">
                          {r.sale_reference}
                        </span>
                      ) : null}
                    </td>
                    <td className="max-w-[180px] px-4 py-3 text-[11px] text-slate-500">
                      {r.reason}
                      {r.decision_note ? (
                        <span className="block italic text-slate-400">
                          decision: {r.decision_note}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                      {r.decided_by_username ? (
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          by {r.decided_by_username}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "PENDING" ? (
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            disabled={acceptMut.isPending}
                            onClick={() => acceptMut.mutate(r.id)}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            disabled={rejectMut.isPending}
                            onClick={() => rejectMut.mutate(r.id)}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          {r.decided_at
                            ? new Date(r.decided_at).toLocaleDateString()
                            : "—"}
                        </span>
                      )}
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
          Accepting a return adds its quantity back to the location
          (RETURN_IN ledger row). Rejecting leaves stock untouched. Decisions
          are final — returns are never edited afterwards.
        </StageNotice>
      </div>
    </>
  );
}
