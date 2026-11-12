import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { dashboardApi } from "../../api/reportsApi";
import PageHeader from "../../components/common/PageHeader";
import StageNotice from "../../components/common/StageNotice";

export default function ManagerDashboard() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const params = {
    ...(dateFrom && { date_from: dateFrom }),
    ...(dateTo && { date_to: dateTo }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ["manager-dashboard", params],
    queryFn: () => dashboardApi.list(params),
  });

  if (isLoading) {
    return (
      <div className="card p-5">
        <p className="text-slate-500">Loading manager dashboard…</p>
      </div>
    );
  }

  const d = data || {};
  const ti = d.total_inventory || {};
  const today = d.today_sales || {};

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Manager Dashboard"
        description="Stock operations overview: receipts, transfers, sales, adjustments."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            Total Variants
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {ti.total_variants ?? 0}
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
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Today's Sales Count
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {today.sale_count ?? 0}
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-sm font-semibold text-slate-800 mb-3">
            Quick Actions
          </p>
          <div className="space-y-2">
            <Link to="/manager/stock-in" className="card block p-3 hover:shadow-sm">
              Stock In
            </Link>
            <Link to="/manager/transfers" className="card block p-3 hover:shadow-sm">
              Shop Transfers
            </Link>
            <Link to="/manager/sales" className="card block p-3 hover:shadow-sm">
              Sales Entry
            </Link>
            <Link to="/manager/returns" className="card block p-3 hover:shadow-sm">
              Returns
            </Link>
            <Link to="/manager/adjustments" className="card block p-3 hover:shadow-sm">
              Adjustments
            </Link>
          </div>
        </div>

        <div className="card p-4">
          <p className="text-sm font-semibold text-slate-800 mb-3">
            Low-stock Alerts
          </p>
          <div className="space-y-2">
            {(d.low_stock_alerts || []).slice(0, 5).map((a) => (
              <div key={`${a.shop_id}-${a.variant_id}`} className="text-xs">
                <p className="text-slate-700">
                  {a.shop_name} — {a.product_code} [{a.spec_label}]
                </p>
                <p className="text-rose-600 font-bold">
                  {a.current_quantity} / threshold {a.threshold_quantity}
                </p>
              </div>
            ))}
            {(d.low_stock_alerts || []).length === 0 && (
              <p className="text-xs text-slate-500">No alerts.</p>
            )}
          </div>
        </div>

        <div className="card p-4">
          <p className="text-sm font-semibold text-slate-800 mb-3">
            Recent Movements
          </p>
          <div className="space-y-2">
            {(d.recent_movements || []).slice(0, 5).map((m) => (
              <div key={m.transaction_id} className="text-xs">
                <p className="text-slate-700">
                  {m.transaction_id} — {m.kind}
                </p>
                <p className="text-xs text-slate-500">
                  {m.shop_name} • {m.product_code} •{" "}
                  {m.direction > 0 ? "+" : "−"}{m.quantity} {m.unit_code}
                </p>
              </div>
            ))}
            {(d.recent_movements || []).length === 0 && (
              <p className="text-xs text-slate-500">No movements.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <StageNotice>
          Use the Reports page to export product-wise, shop-wise, employee-wise,
          or stock-movement reports to Excel.
        </StageNotice>
      </div>
    </div>
  );
}