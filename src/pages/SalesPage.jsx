import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState } from "react";

import { productApi } from "../api/productApi";
import { shopApi } from "../api/authApi";
import { salesApi } from "../api/salesApi";
import PageHeader from "../components/common/PageHeader";
import SaleStatusBadge from "../components/common/SaleStatusBadge";
import StageNotice from "../components/common/StageNotice";
import SaleForm from "../components/forms/SaleForm";
import CorrectSaleDialog from "../components/sales/CorrectSaleDialog";

const EMPTY_FILTERS = {
  shop: "",
  employee: "",
  product: "",
  date_from: "",
  date_to: "",
  status: "",
  search: "",
};

function activeParams(filters) {
  const params = {};
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params[k] = v;
  });
  return params;
}

/**
 * Sales page shared by owner and manager: record sales (collapsible
 * entry form) + filterable history with the correction dialog.
 */
export default function SalesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [lastSale, setLastSale] = useState(null);
  const [correcting, setCorrecting] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["sales", "all", filters],
    queryFn: () => salesApi.list(activeParams(filters)),
    retry: 1,
  });

  const { data: shopsData } = useQuery({
    queryKey: ["shops", "all"],
    queryFn: () => shopApi.list(),
    staleTime: 60000,
  });
  const { data: employeesData } = useQuery({
    queryKey: ["sales", "employees"],
    queryFn: () => salesApi.employees(),
    staleTime: 60000,
  });
  const { data: productsData } = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => productApi.list(),
    staleTime: 60000,
  });

  const shops = (shopsData?.results || shopsData || []).filter(
    (s) => s.shop_type !== "IN_TRANSIT"
  );
  const employees = employeesData || [];
  const products = productsData?.results || productsData || [];
  const sales = data?.results || data || [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["sales"] });
    queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
    queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
  };

  const setFilter = (key, value) =>
    setFilters((cur) => ({ ...cur, [key]: value }));

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <PageHeader
        title="Sales"
        description="Record stock leaving a location. Quantity only — no prices."
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              onClick={() => setShowFilters((v) => !v)}
            >
              {showFilters ? "Hide filters" : "Filters"}
              {hasFilters ? " •" : ""}
            </button>
            <button
              type="button"
              className="btn-primary px-3 py-1.5 text-xs"
              onClick={() => setShowCreate((v) => !v)}
            >
              {showCreate ? "Close" : "+ New sale"}
            </button>
          </div>
        }
      />

      {showCreate ? (
        <div className="card mb-4 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-800">
            Record a sale
          </p>
          <SaleForm
            onCreated={(s) => {
              setLastSale(s);
              invalidate();
              setShowCreate(false);
            }}
          />
        </div>
      ) : null}

      {showFilters ? (
        <div className="card mb-4 p-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Location
              </span>
              <select
                value={filters.shop}
                onChange={(e) => setFilter("shop", e.target.value)}
                className="input"
              >
                <option value="">All</option>
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Employee
              </span>
              <select
                value={filters.employee}
                onChange={(e) => setFilter("employee", e.target.value)}
                className="input"
              >
                <option value="">All</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name || emp.username}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Product
              </span>
              <select
                value={filters.product}
                onChange={(e) => setFilter("product", e.target.value)}
                className="input"
              >
                <option value="">All</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Status
              </span>
              <select
                value={filters.status}
                onChange={(e) => setFilter("status", e.target.value)}
                className="input"
              >
                <option value="">All</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CORRECTED">CORRECTED</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                From
              </span>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilter("date_from", e.target.value)}
                className="input"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                To
              </span>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilter("date_to", e.target.value)}
                className="input"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Search
              </span>
              <input
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
                placeholder="Reference or customer…"
                className="input"
              />
            </label>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              onClick={() => setFilters(EMPTY_FILTERS)}
              disabled={!hasFilters}
            >
              Clear
            </button>
            <button
              type="button"
              className="text-xs font-semibold text-amber-700 hover:text-amber-800"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? "Refreshing…" : "Apply"}
            </button>
          </div>
        </div>
      ) : null}

      {lastSale ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Recorded sale <strong>{lastSale.reference}</strong>
          {lastSale.customer_name ? ` for ${lastSale.customer_name}` : ""}.
          {lastSale.corrects_reference
            ? ` Corrects ${lastSale.corrects_reference}.`
            : ""}
        </div>
      ) : null}

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">
            Sales history{hasFilters ? " (filtered)" : ""}
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
                  Employee
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
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
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
                    {error?.response?.data?.detail || "Failed to load sales."}
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    {hasFilters
                      ? "No sales match these filters."
                      : "No sales yet. Use “New sale” to record the first one."}
                  </td>
                </tr>
              ) : (
                sales.map((s) => (
                  <Fragment key={s.id}>
                    <tr>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="font-mono text-xs font-semibold text-slate-700 hover:text-amber-700"
                          onClick={() =>
                            setExpanded((cur) => (cur === s.id ? null : s.id))
                          }
                        >
                          {expanded === s.id ? "▾" : "▸"} {s.reference}
                        </button>
                        {s.corrects_reference ? (
                          <span className="ml-1.5 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                            corrects {s.corrects_reference}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(s.sold_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {s.shop_name}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {s.employee_username || "—"}
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
                      <td className="px-4 py-3 text-right">
                        {s.status === "COMPLETED" ? (
                          <button
                            type="button"
                            className="rounded-lg border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                            onClick={() => setCorrecting(s)}
                          >
                            Correct
                          </button>
                        ) : s.status === "CORRECTED" ? (
                          <span className="text-[11px] text-slate-400">
                            superseded
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                    {expanded === s.id ? (
                      <tr key={`${s.id}-detail`}>
                        <td colSpan={8} className="bg-slate-50 px-4 py-3">
                          <div className="flex flex-wrap gap-4 text-[11px] text-slate-600">
                            <span>
                              Recorded by{" "}
                              <strong>{s.created_by_username || "—"}</strong>
                            </span>
                            {s.corrected_at ? (
                              <span>
                                Corrected {new Date(s.corrected_at).toLocaleString()}{" "}
                                by <strong>{s.corrected_by_username}</strong>
                              </span>
                            ) : null}
                            {s.correction_chain?.length ? (
                              <span>
                                Chain:{" "}
                                {s.correction_chain
                                  .map((c) => c.reference)
                                  .join(" → ")}
                              </span>
                            ) : null}
                            {s.returns?.length ? (
                              <span>
                                Returns:{" "}
                                {s.returns
                                  .map(
                                    (r) =>
                                      `${r.reference} (${r.status} ×${r.quantity})`
                                  )
                                  .join(", ")}
                              </span>
                            ) : null}
                            {s.attachments?.length ? (
                              <a
                                href={s.attachments[0].file}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-amber-700 hover:underline"
                              >
                                View slip
                              </a>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
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

      {correcting ? (
        <CorrectSaleDialog
          sale={correcting}
          onClose={() => setCorrecting(null)}
          onDone={(corrected) => {
            setCorrecting(null);
            setLastSale(corrected);
            invalidate();
          }}
        />
      ) : null}

      <div className="mt-4">
        <StageNotice>
          Sales deduct stock immediately at the selected location. Wrong sale?
          Correct it — the original is reversed (SALE_REVERSAL) and a linked
          replacement is created; nothing is edited in place.
        </StageNotice>
      </div>
    </>
  );
}
