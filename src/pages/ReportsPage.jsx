import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { reportsApi, downloadExcel } from "../api/reportsApi";
import { shopApi } from "../api/authApi";
import PageHeader from "../components/common/PageHeader";
import StageNotice from "../components/common/StageNotice";

const REPORT_TYPES = [
  { value: "product-wise", label: "Product-wise" },
  { value: "shop-wise", label: "Shop-wise" },
  { value: "employee-wise", label: "Employee-wise" },
  { value: "stock-movement", label: "Stock Movement" },
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState("product-wise");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [shopId, setShopId] = useState("");
  const [productId, setProductId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [downloading, setDownloading] = useState(false);

  const params = {
    report_type: reportType,
    ...(dateFrom && { date_from: dateFrom }),
    ...(dateTo && { date_to: dateTo }),
    ...(shopId && { shop: shopId }),
    ...(productId && { product: productId }),
    ...(employeeId && { employee: employeeId }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ["report", params],
    queryFn: () => reportsApi.list(params),
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

  const results = data?.results || [];
  const count = data?.count ?? 0;

  const headersByType = {
    "product-wise": [
      "Product Code",
      "Spec Label",
      "Unit",
      "Total Quantity",
      "Sale Count",
    ],
    "shop-wise": [
      "Shop Code",
      "Shop Name",
      "Total Quantity",
      "Sale Count",
    ],
    "employee-wise": [
      "Employee",
      "Role",
      "Total Quantity",
      "Sale Count",
    ],
    "stock-movement": [
      "Transaction ID",
      "Kind",
      "Shop",
      "Product",
      "Spec",
      "Unit",
      "Quantity",
      "Direction",
      "User",
      "Created At",
    ],
  };

  const rowsByType = {
    "product-wise": results.map((r) => [
      r.product_code,
      r.spec_label,
      r.unit_code,
      r.total_quantity,
      r.sale_count,
    ]),
    "shop-wise": results.map((r) => [
      r.shop_code,
      r.shop_name,
      r.total_quantity,
      r.sale_count,
    ]),
    "employee-wise": results.map((r) => [
      r.employee_name,
      r.employee_role,
      r.total_quantity,
      r.sale_count,
    ]),
    "stock-movement": results.map((r) => [
      r.transaction_id,
      r.kind,
      r.shop_code,
      r.product_code,
      r.spec_label,
      r.unit_code,
      r.quantity,
      r.direction,
      r.user || "",
      r.created_at,
    ]),
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const resp = await reportsApi.excel(params);
      const filename = resp.headers["content-disposition"]?.match(
        /filename="(.+)"/
      )?.[1] || `report_${reportType}.xlsx`;
      downloadExcel(resp.data, filename);
    } catch (err) {
      alert("Excel download failed.");
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Loading report…</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Reports"
        description="Product-wise, shop-wise, employee-wise, and stock-movement reports with Excel export."
      />

      <div className="card p-4">
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="input w-full"
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
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
              Product ID
            </label>
            <input
              type="text"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="product id"
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Employee ID
            </label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="employee id"
              className="input w-full"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="btn-primary px-4 py-2 w-full disabled:opacity-50"
            >
              {downloading ? "Downloading…" : "Download Excel"}
            </button>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">
            {REPORT_TYPES.find((t) => t.value === reportType)?.label} Report
            ({count} rows)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {headersByType[reportType].map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {results.length ? (
                rowsByType[reportType].map((row, i) => (
                  <tr key={i} className="border-b border-slate-50/50">
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`px-4 py-3 text-xs text-slate-600 ${
                          j === 0 ? "font-semibold text-slate-700" : ""
                        } ${j >= 3 ? "text-right" : ""}`}
                      >
                        {cell ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={headersByType[reportType].length}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    No data for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4">
        <StageNotice>
          Select a report type, set optional filters, and click "Download
          Excel" to export the current report as an .xlsx file. Filters also
          apply to the JSON table above.
        </StageNotice>
      </div>
    </div>
  );
}