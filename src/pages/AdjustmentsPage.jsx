import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { shopApi } from "../api/authApi";
import { adjustmentApi } from "../api/inventoryApi";
import PageHeader from "../components/common/PageHeader";
import StageNotice from "../components/common/StageNotice";
import ProductVariantSelector from "../components/forms/ProductVariantSelector";
import { useAuth } from "../hooks/useAuth";

const TYPE_STYLES = {
  DAMAGED: "bg-rose-50 text-rose-800 ring-rose-200",
  MISSING: "bg-orange-50 text-orange-800 ring-orange-200",
  CORRECTION: "bg-violet-50 text-violet-800 ring-violet-200",
  OTHER: "bg-slate-100 text-slate-700 ring-slate-200",
  SHORTAGE: "bg-amber-50 text-amber-800 ring-amber-200",
};

function TypeBadge({ reason }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
        TYPE_STYLES[reason] || TYPE_STYLES.OTHER
      }`}
    >
      {reason}
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
 * Stock adjustments (owner + manager): DAMAGED / MISSING write-offs,
 * owner-only CORRECTION up/down, all with a required reason and a
 * permanent history — rows are never edited afterwards.
 */
export default function AdjustmentsPage() {
  const { user } = useAuth();
  const isOwner = user?.role === "OWNER";
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [lastAdj, setLastAdj] = useState(null);
  const [error, setError] = useState(null);

  // form state
  const [shopId, setShopId] = useState("");
  const [product, setProduct] = useState(null);
  const [variant, setVariant] = useState(null);
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("DAMAGED");
  const [direction, setDirection] = useState("-1");
  const [note, setNote] = useState("");

  const params = typeFilter ? { reason: typeFilter } : {};
  const { data, isLoading, isError, error: loadError, refetch, isFetching } =
    useQuery({
      queryKey: ["adjustments", params],
      queryFn: () => adjustmentApi.list(params),
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

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["adjustments"] });
    queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
  };

  const createMut = useMutation({
    mutationFn: adjustmentApi.create,
    onSuccess: (adj) => {
      setError(null);
      setLastAdj(adj);
      setShopId("");
      setProduct(null);
      setVariant(null);
      setQty("");
      setReason(isOwner ? "CORRECTION" : "DAMAGED");
      setDirection("-1");
      setNote("");
      setShowCreate(false);
      invalidate();
    },
    onError: (err) =>
      setError(errText(err, "Could not record the adjustment.")),
  });

  const adjustments = data?.results || data || [];
  const needsDirection = reason === "CORRECTION";
  const canSubmit =
    shopId &&
    variant &&
    qty &&
    Number(qty) > 0 &&
    note.trim() &&
    (!needsDirection || direction === "1" || direction === "-1") &&
    !createMut.isPending;

  function submit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    const payload = {
      shop: Number(shopId),
      variant,
      quantity: qty,
      reason,
      note: note.trim(),
    };
    if (needsDirection) payload.direction = Number(direction);
    createMut.mutate(payload);
  }

  return (
    <>
      <PageHeader
        title="Stock Adjustments"
        description="Damaged, missing and owner corrections — reason required, history permanent."
        actions={
          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 focus:border-amber-500 focus:outline-none"
            >
              <option value="">All types</option>
              <option value="DAMAGED">Damaged</option>
              <option value="MISSING">Missing</option>
              <option value="CORRECTION">Correction</option>
              <option value="OTHER">Other</option>
              <option value="SHORTAGE">Shortage (auto)</option>
            </select>
            <button
              type="button"
              className="btn-primary px-3 py-1.5 text-xs"
              onClick={() => setShowCreate((v) => !v)}
            >
              {showCreate ? "Close" : "+ New adjustment"}
            </button>
          </div>
        }
      />

      {showCreate ? (
        <div className="card mb-4 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-800">
            Record an adjustment (applies immediately, cannot be edited)
          </p>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Location
                </span>
                <select
                  value={shopId}
                  onChange={(e) => setShopId(e.target.value)}
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
                  Type
                </span>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input"
                >
                  <option value="DAMAGED">Damaged (removes stock)</option>
                  <option value="MISSING">Missing / lost (removes stock)</option>
                  {isOwner ? (
                    <option value="CORRECTION">
                      Correction — owner only (± stock)
                    </option>
                  ) : null}
                  <option value="OTHER">Other (removes stock)</option>
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
              {needsDirection ? (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Direction (required for corrections)
                  </span>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value)}
                    className="input"
                  >
                    <option value="-1">Decrease stock (−)</option>
                    <option value="1">Increase stock (+)</option>
                  </select>
                </label>
              ) : (
                <p className="self-end rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                  This type always <strong>removes</strong> stock from the
                  location.
                </p>
              )}
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Reason (required)
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                required
                placeholder="What happened? e.g. 2 cartons crushed by forklift"
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
              {createMut.isPending ? "Recording…" : "Record adjustment"}
            </button>
          </form>
        </div>
      ) : null}

      {lastAdj ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Recorded <strong>{lastAdj.reference}</strong> — {lastAdj.reason}{" "}
          {lastAdj.direction < 0 ? "−" : "+"}
          {Number(lastAdj.quantity)} at {lastAdj.shop_name}. Ledger row
          written; this record is permanent.
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
            Adjustment history{typeFilter ? ` (${typeFilter})` : ""}
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
                  Change
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Type
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Reason
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Recorded by
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-rose-600">
                    {loadError?.response?.data?.detail ||
                      "Failed to load adjustments."}
                  </td>
                </tr>
              ) : adjustments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    No adjustments recorded.
                  </td>
                </tr>
              ) : (
                adjustments.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                      {a.reference}
                      {a.transfer ? (
                        <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                          TRF shortage
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(a.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {a.shop_name}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-[11px] font-semibold text-slate-700">
                        {a.product_code}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {a.spec_label}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-slate-700">
                      {a.direction < 0 ? "−" : "+"}
                      {Number(a.quantity)}{" "}
                      <span className="font-normal text-slate-400">
                        {a.unit_code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge reason={a.reason} />
                    </td>
                    <td className="max-w-[220px] px-4 py-3 text-[11px] text-slate-500">
                      {a.note || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {a.created_by_username || "—"}
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
          Every adjustment writes an ADJUSTMENT ledger row and takes effect
          immediately. Records are never edited or deleted — to fix a
          mistake, record a new correction (owner). Shortage rows appear
          here automatically from transfer receipts.
        </StageNotice>
      </div>
    </>
  );
}
