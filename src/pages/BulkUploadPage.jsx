import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { bulkUploadApi } from "../api/reportsApi";
import { shopApi } from "../api/authApi";
import PageHeader from "../components/common/PageHeader";
import StageNotice from "../components/common/StageNotice";

export default function BulkUploadPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [shopId, setShopId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const { data: shopsData } = useQuery({
    queryKey: ["shops", "all"],
    queryFn: () => shopApi.list(),
    staleTime: 60000,
  });
  const shops = (shopsData?.results || shopsData || []).filter(
    (s) => s.shop_type !== "IN_TRANSIT"
  );

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const handlePreview = async () => {
    if (!file) return;
    setError(null);
    try {
      const data = await bulkUploadApi.preview(file, shopId || undefined);
      setPreview(data);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        "Preview failed."
      );
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setConfirming(true);
    setError(null);
    try {
      const data = await bulkUploadApi.confirm({
        rows: preview.rows.map((r) => ({
          raw_name: r.raw_name,
          product_name: r.product_name,
          variant_spec: r.variant_spec,
          quantity: r.quantity,
          unit_code: r.unit_code,
          shop_id: r.shop_id || shopId || "",
        })),
        shop_id: shopId || "",
      });
      setResult(data);
      setPreview(null);
      setFile(null);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        "Confirm failed."
      );
    } finally {
      setConfirming(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setShopId("");
    const input = document.querySelector('input[type="file"]');
    if (input) input.value = "";
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Bulk Material Upload"
        description="Upload an Excel list of materials. The system parses each row, creates products/variants, and adds stock to the selected location."
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload panel */}
        <div className="col-span-1 md:col-span-1 card p-6">
          <p className="mb-3 text-sm font-semibold text-slate-800">
            Step 1 — Upload Excel
          </p>
          <p className="mb-3 text-xs text-slate-500">
            First column = material name (e.g. "GI SATTER PATTI (HAVY) 14 FUT").
            Optional second column = quantity. Optional third = unit (KG/FEET/etc).
          </p>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-amber-500 hover:bg-amber-50 transition">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-500"
            />
            <p className="mt-2 text-xs text-slate-400">
              {file ? file.name : "Choose file"}
            </p>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Location (Shop / Warehouse)
            </label>
            <select
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              className="input w-full"
            >
              <option value="">Default warehouse</option>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handlePreview}
            disabled={!file || preview}
            className="btn-primary px-4 py-2 w-full disabled:opacity-50"
          >
            {preview ? "Preview Loaded" : "Preview & Parse"}
          </button>

          {error && (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}
        </div>

        {/* Preview / Confirm panel */}
        <div className="col-span-1 md:col-span-1">
          {!preview ? (
            <div className="card p-6 text-center">
              <p className="text-sm text-slate-500">
                Upload an Excel file to see a preview of parsed materials.
              </p>
            </div>
          ) : (
            <>
              <div className="card p-4">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-semibold text-slate-800">
                    Step 2 — Review & Edit ({preview.count} items)
                  </p>
                  <button
                    type="button"
                    onClick={reset}
                    className="text-xs underline text-slate-500 hover:text-slate-700"
                  >
                    Reset
                  </button>
                </div>
                <div className="overflow-x-auto max-h-[60vh] overflow-y-auto border border-slate-200 rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Raw Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Product Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Variant Spec
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Qty
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Unit
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {preview.rows.map((r, i) => (
                        <tr key={i} className="border-b border-slate-50/50">
                          <td className="px-3 py-2 text-xs text-slate-600 truncate max-w-[200px]">
                            {r.raw_name}
                            {r.error && (
                              <span className="text-rose-600"> ⚠ {r.error}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-700">
                            <input
                              type="text"
                              value={r.product_name}
                              onChange={(e) =>
                                (r.product_name = e.target.value)
                              }
                              className="input w-full text-xs"
                            />
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-700">
                            <input
                              type="text"
                              value={r.variant_spec}
                              onChange={(e) =>
                                (r.variant_spec = e.target.value)
                              }
                              className="input w-full text-xs"
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-xs text-slate-700">
                            <input
                              type="number"
                              step="0.001"
                              value={r.quantity}
                              onChange={(e) =>
                                (r.quantity = parseFloat(e.target.value) || 0)
                              }
                              className="input w-full text-right text-xs"
                            />
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-500">
                            <input
                              type="text"
                              value={r.unit_code}
                              onChange={(e) =>
                                (r.unit_code = e.target.value.toUpperCase())
                              }
                              className="input w-full text-xs uppercase"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={confirming}
                    className="btn-primary px-4 py-2 disabled:opacity-50"
                  >
                    {confirming ? "Importing…" : "Confirm & Add Stock"}
                  </button>
                </div>
              </div>
            </>
          )}

          {result && (
            <div className="mt-4 card p-4 border-green-200 bg-green-50">
              <p className="text-sm font-semibold text-green-800 mb-1">
                Import Complete
              </p>
              <p className="text-xs text-green-700">
                {result.created} item(s) added. {result.errors} error(s).
              </p>
              {result.results && result.results.length > 0 && (
                <div className="mt-2 overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-green-50">
                      <tr>
                        <th className="px-2 py-1 text-left text-[10px] font-semibold text-green-800">
                          Material
                        </th>
                        <th className="px-2 py-1 text-left text-[10px] font-semibold text-green-800">
                          Product
                        </th>
                        <th className="px-2 py-1 text-left text-[10px] font-semibold text-green-800">
                          Variant
                        </th>
                        <th className="px-2 py-1 text-right text-[10px] font-semibold text-green-800">
                          Qty
                        </th>
                        <th className="px-2 py-1 text-left text-[10px] font-semibold text-green-800">
                          Unit
                        </th>
                        <th className="px-2 py-1 text-left text-[10px] font-semibold text-green-800">
                          Shop
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-100">
                      {result.results.map((r, i) => (
                        <tr key={i}>
                          <td className="px-2 py-1 text-[10px] text-slate-600 truncate max-w-[120px]">
                            {r.raw_name}
                          </td>
                          <td className="px-2 py-1 text-[10px] text-slate-700">
                            {r.product_code} — {r.product_name}
                          </td>
                          <td className="px-2 py-1 text-[10px] text-slate-600 truncate max-w-[100px]">
                            {r.variant}
                          </td>
                          <td className="px-2 py-1 text-right text-[10px] text-green-700 font-bold">
                            {r.quantity}
                          </td>
                          <td className="px-2 py-1 text-[10px] text-slate-500 uppercase">
                            {r.unit}
                          </td>
                          <td className="px-2 py-1 text-[10px] text-slate-500">
                            {r.shop}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {result.error_details && result.error_details.length > 0 && (
                <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  <p className="font-semibold mb-1">Errors:</p>
                  <ul className="list-disc list-inside text-xs">
                    {result.error_details.map((e, i) => (
                      <li key={i}>
                        {e.raw_name}: {e.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <StageNotice>
          After import, use the Dashboard to search for the material and view
          its stock across shops/warehouses. Use Stock In or Adjustments to
          add more quantity later.
        </StageNotice>
      </div>
    </div>
  );
}