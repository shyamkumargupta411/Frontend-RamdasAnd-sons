import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";

import { stockApi } from "../api/inventoryApi";
import PageHeader from "../components/common/PageHeader";
import StageNotice from "../components/common/StageNotice";
import { useAuth } from "../hooks/useAuth";

const SHOP_TYPE_BADGE = {
  WAREHOUSE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  SHOP: "bg-amber-100 text-amber-800 border-amber-200",
  IN_TRANSIT: "bg-slate-100 text-slate-500 border-slate-200",
};

function ShopTypeBadge({ shop_type }) {
  const cls = SHOP_TYPE_BADGE[shop_type] || SHOP_TYPE_BADGE.IN_TRANSIT;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
      cls
    }`}>
      {shop_type}
    </span>
  );
}

function errText(err, fallback) {
  if (!err) return fallback;
  if (typeof err === "string") return err;

  const data = err?.response?.data;
  if (Array.isArray(data?.detail)) return data.detail.join(" ");
  if (data?.detail) return String(data.detail);
  if (Array.isArray(data?.non_field_errors)) return data.non_field_errors.join(" ");
  if (data && typeof data === "object") {
    return Object.values(data).flat().map(String).join(" ");
  }

  if (err.message) return String(err.message);
  if (err.detail) return String(err.detail);
  return fallback;
}

/**
 * Material / Product Stock Summary with location drill-down.
 *
 * Groups StockLevel by Material + Product, shows total quantity per
 * material/product, and lets you drill into which Shop / Warehouse holds
 * each variant.
 */
export default function MaterialStockPage() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();

  const { user, isAuthenticated, bootstrapped } = useAuth();

  if (!bootstrapped) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Checking authentication…</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="p-6 space-y-4">
        <div className="rounded-lg border border-rose-500 bg-rose-100 px-4 py-4 text-rose-800 shadow-sm">
          <p className="font-bold">Authentication required.</p>
          <p className="text-sm text-rose-700 mt-1">
            Please log in to view material stock.
          </p>
          <Link
            to="/login"
            className="mt-3 inline-block text-xs underline text-rose-600 hover:text-rose-800"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const { data, isLoading, isError, error: loadError, refetch } = useQuery({
    queryKey: ["material-stock", search],
    queryFn: async () => {
      const params = {};
      if (search) params.search = search;
      const r = await stockApi.levels(params);
      return r;
    },
    retry: 1,
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Loading material stock…</p>
      </div>
    );
  }

  if (isError) {
    console.error("MaterialStock query error:", loadError);
    const msg = errText(loadError, "Failed to load material stock.");
    const status = loadError?.response?.status;
    const url = loadError?.config?.url;

    let rawMessage = null;
    if (!status) {
      if (typeof loadError === "string") {
        rawMessage = loadError;
      } else if (loadError && loadError.message) {
        rawMessage = String(loadError.message);
      } else if (loadError && loadError.detail) {
        rawMessage = String(loadError.detail);
      } else if (loadError) {
        rawMessage = String(loadError);
      }
    }

    return (
      <div className="p-6 space-y-4">
        <div className="rounded-lg border border-rose-500 bg-rose-100 px-4 py-4 text-rose-800 shadow-sm">
          <p className="font-bold">Failed to load material stock.</p>
          <p className="text-sm text-rose-700 mt-1">{msg}</p>
          {status ? (
            <p className="text-xs text-rose-600 mt-1 font-mono">
              HTTP {status} · {url || "/api/stock-levels/"}
            </p>
          ) : null}
          {rawMessage ? (
            <p className="text-xs text-rose-600 mt-1 font-mono break-all">
              {rawMessage}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 text-xs underline text-rose-600 hover:text-rose-800"
          >
            Retry
          </button>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-bold mb-1">Troubleshooting:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Make sure you are logged in as Owner or Manager.</li>
            <li>Check that the backend is running on port 8000.</li>
            <li>Verify VITE_API_BASE_URL points to http://127.0.0.1:8000/api</li>
            <li>Open browser DevTools → Console for the full error object.</li>
          </ul>
        </div>
      </div>
    );
  }

  const raw = data ?? [];
  const rows = Array.isArray(raw) ? raw : raw?.results ?? [];

  // ------------------------------------------------------------------
  // Group by material + product
  // ------------------------------------------------------------------
  const groups = new Map();

  for (const row of rows) {
    const pid = row.product_id;
    if (!groups.has(pid)) {
      groups.set(pid, {
        product_id: pid,
        product_code: row.product_code,
        product_name: row.product_name,
        material: row.material || "—",
        unit_code: row.unit_code,
        total_quantity: 0,
        variant_count: new Set(),
        locations: [],
      });
    }
    const g = groups.get(pid);
    g.total_quantity = Number(g.total_quantity) + Number(row.quantity || 0);
    g.variant_count.add(row.variant);
    g.locations.push({
      shop_id: row.shop,
      shop_name: row.shop_name,
      shop_code: row.shop_code,
      shop_type: row.shop_type,
      variant_id: row.variant,
      spec_label: row.spec_label,
      unit_code: row.unit_code,
      quantity: Number(row.quantity || 0),
    });
  }

  let grouped = Array.from(groups.values());

  if (search) {
    const s = search.toLowerCase();
    grouped = grouped.filter(
      (g) =>
        g.material.toLowerCase().includes(s) ||
        g.product_code.toLowerCase().includes(s) ||
        g.product_name.toLowerCase().includes(s)
    );
  }

  grouped.sort((a, b) => b.total_quantity - a.total_quantity);

  const totalItems = grouped.length;
  const totalQty = grouped.reduce((sum, g) => sum + g.total_quantity, 0);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Material / Product Stock"
        description="Total quantity of each material/product across all shops and warehouses."
        actions={
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search material / product…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-64"
            />
            <button
              type="button"
              onClick={() => refetch()}
              className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Materials / Products
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalItems}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total Quantity
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {totalQty.toFixed(3)}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Locations
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {grouped.reduce((sum, g) => sum + g.locations.length, 0)}
          </p>
        </div>
      </div>

      {/* Summary table */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">
            Stock by Material / Product
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Material
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Product Code
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Product Name
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Unit
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total Qty
                </th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Variants
                </th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Locations
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {grouped.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    No material stock found.
                  </td>
                </tr>
              ) : (
                grouped.map((g) => {
                  const isExpanded = expandedId === g.product_id;
                  return (
                    <>
                      <tr key={`${g.product_id}-row`} className={`border-b border-slate-50/50 ${isExpanded ? "bg-amber-25" : ""}`}>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                          {g.material}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-700">
                          {g.product_code}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {g.product_name}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {g.unit_code}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-slate-700">
                          {g.total_quantity.toFixed(3)}
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-slate-500">
                          {g.variant_count.size}
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-slate-500">
                          {g.locations.length}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(
                                isExpanded ? null : g.product_id
                              )
                            }
                            className={`text-xs px-2.5 py-1.5 rounded border ${
                              isExpanded
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-50 text-slate-600 border-slate-200"
                            }`}
                          >
                            {isExpanded ? "Collapse" : "View Locations"}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-b border-amber-300">
                          <td colSpan={8} className="p-0">
                            <div className="border-l-4 border-amber-500 bg-amber-50 p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                                  Location Breakdown
                                </span>
                                <span className="text-xs text-amber-600 font-mono">
                                  {g.product_code}
                                </span>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-amber-100 text-sm">
                                  <thead className="bg-amber-100">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wide text-amber-700">
                                        Shop
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wide text-amber-700">
                                        Spec Key
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wide text-amber-700">
                                        Variant Spec
                                      </th>
                                      <th className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wide text-amber-700">
                                        Quantity
                                      </th>
                                      <th className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wide text-amber-700">
                                        Unit
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-amber-200 bg-white">
                                    {g.locations
                                      .sort(
                                        (a, b) =>
                                          b.quantity - a.quantity ||
                                          a.shop_name.localeCompare(b.shop_name)
                                      )
                                      .map((loc) => (
                                        <tr key={`${loc.shop_id}-${loc.variant_id}`} className="">
                                          <td className="px-4 py-3 text-xs text-amber-800">
                                            {loc.shop_name}
                                            <span className="ml-1 text-xs text-amber-500">
                                              ({loc.shop_code})
                                            </span>
                                          </td>
                                          <td className="px-4 py-3 text-xs text-amber-700 font-mono truncate max-w-[120px]">
                                            {loc.spec_key || "—"}
                                          </td>
                                          <td className="px-4 py-3 text-xs text-amber-700">
                                            {loc.spec_label || "—"}
                                          </td>
                                          <td className="px-4 py-3 text-right text-xs font-bold text-amber-800">
                                            {loc.quantity.toFixed(3)}
                                          </td>
                                          <td className="px-4 py-3 text-right text-xs text-amber-500">
                                            {loc.unit_code}
                                          </td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              </div>
                              <div className="mt-3 flex justify-end border-t border-amber-200 pt-2">
                                <span className="text-xs font-bold text-amber-800">
                                  Total: {g.total_quantity.toFixed(3)}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4">
        <StageNotice>
          Stock is grouped by Material + Product. Click "View Locations" to
          see exactly which Shop or Warehouse holds each variant and its
          quantity. Data comes from the live Stock Balance ledger.
        </StageNotice>
      </div>
    </div>
  );
}