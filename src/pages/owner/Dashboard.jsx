import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { dashboardApi } from "../../api/reportsApi";
import { shopApi } from "../../api/authApi";
import PageHeader from "../../components/common/PageHeader";
import StageNotice from "../../components/common/StageNotice";

export default function OwnerDashboard() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [shopId, setShopId] = useState("");
  const [productId, setProductId] = useState("");

  const params = {
    ...(dateFrom && { date_from: dateFrom }),
    ...(dateTo && { date_to: dateTo }),
    ...(shopId && { shop: shopId }),
    ...(productId && { product: productId }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", params],
    queryFn: () => dashboardApi.list(params),
    enabled: true,
  });

  const { data: shopsData } = useQuery({
    queryKey: ["shops", "all"],
    queryFn: () => shopApi.list(),
    staleTime: 60000,
  });
  const shops = (shopsData?.results || shopsData || []).filter(
    (s) => s.shop_type !== "IN_TRANSIT"
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Loading dashboard…</p>
      </div>
    );
  }

  const d = data || {};
  const ti = d.total_inventory || {};
  const ws = d.warehouse_stock || {};
  const today = d.today_sales || {};
  const alerts = d.low_stock_alerts || [];
  const movements = d.recent_movements || [];
  const damaged = d.damaged_returned_stock || {};
  const discrepancy = d.stock_discrepancy || [];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Owner Dashboard"
        description="Ten-section inventory overview across warehouse and shops."
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total Products
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {ti.total_products ?? 0}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total Remaining Qty
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {ti.total_quantity ?? 0}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Active Shops
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {shops.length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Today's Sales Qty
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {today.total_quantity ?? 0}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <p className="mb-3 text-sm font-semibold text-slate-800">Filters</p>
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Shop
            </label>
            <select
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              className="input w-full"
            >
              <option value="">All shops</option>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Product
            </label>
            <input
              type="text"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="product id"
              className="input w-full"
            />
          </div>
        </div>
      </div>

      {/* Warehouse stock */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">
            Warehouse Stock ({ws.warehouse_name || "—"})
          </p>
        </div>
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
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Unit
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Qty
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {ws.items?.length ? (
                ws.items.map((i) => (
                  <tr key={i.variant_id} className="border-b border-slate-50/50">
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                      {i.product_code}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {i.spec_label}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {i.unit_code}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-slate-700">
                      {i.quantity}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    No warehouse stock.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-4 py-2 text-right">
          <p className="text-xs font-semibold text-slate-700">
            Total: {ws.total_quantity ?? 0}
          </p>
        </div>
      </div>

      {/* Shop-wise stock */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">
            Shop-wise Inventory
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Shop
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Type
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total Qty
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Variants
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {d.shop_stock?.length ? (
                d.shop_stock.map((s) => (
                  <tr key={s.shop_id} className="border-b border-slate-50/50">
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                      {s.shop_name} ({s.shop_code})
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {s.shop_type}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-slate-700">
                      {s.total_quantity ?? 0}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {s.items?.length ?? 0}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    No shop stock.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent movements */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">
            Recent Stock Movements
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ref
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Kind
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Shop
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Product
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Qty
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  User
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {movements.length ? (
                movements.map((m) => (
                  <tr key={m.transaction_id} className="border-b border-slate-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      {m.transaction_id}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {m.kind}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {m.shop_name}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {m.product_code} — {m.spec_label}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-slate-700">
                      {m.direction > 0 ? "+" : "−"}{m.quantity}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {m.user || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(m.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                    No recent movements.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low stock alerts */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">
            Low-stock Alerts ({alerts.length})
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Shop
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Product
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Current
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Threshold
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Shortfall
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {alerts.length ? (
                alerts.map((a) => (
                  <tr key={`${a.shop_id}-${a.variant_id}`} className="border-b border-slate-50/50">
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                      {a.shop_name}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {a.product_code} — {a.spec_label}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-rose-600 font-bold">
                      {a.current_quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500">
                      {a.threshold_quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-rose-600">
                      −{a.shortfall}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No low-stock alerts.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Damaged / returned */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Damaged / Missing
          </p>
          <p className="mt-1 text-2xl font-bold text-rose-600">
            {damaged.damaged_quantity ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {damaged.damaged_items?.length ?? 0} item(s)
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Returned (Accepted)
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {damaged.returned_quantity ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {damaged.returned_items?.length ?? 0} item(s)
          </p>
        </div>
      </div>

      {/* Discrepancy */}
      {discrepancy.length > 0 ? (
        <div className="card p-4 border-rose-200 bg-rose-50">
          <p className="text-sm font-semibold text-rose-800 mb-2">
            Stock Discrepancies ({discrepancy.length})
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-rose-100 text-sm">
              <thead className="bg-rose-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-rose-700">
                    Shop
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-rose-700">
                    Product
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-rose-700">
                    Balance
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-rose-700">
                    Ledger
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-rose-700">
                    Diff
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100 bg-white">
                {discrepancy.map((d) => (
                  <tr key={`${d.shop_id}-${d.variant_id}`} className="border-b border-rose-50/50">
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                      {d.shop_name}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {d.product_code} — {d.spec_label}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-slate-700">
                      {d.balance_quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500">
                      {d.ledger_quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-rose-600">
                      {d.discrepancy > 0 ? "+" : ""}{d.discrepancy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        <StageNotice>
          Filters apply to all sections. Use the Reports page to export any
          report to Excel. Low-stock thresholds can be managed at /owner/thresholds.
        </StageNotice>
      </div>
    </div>
  );
}