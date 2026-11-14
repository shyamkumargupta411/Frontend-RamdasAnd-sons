import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { shopApi } from "../../api/authApi";
import { unitApi } from "../../api/productApi";
import { salesApi } from "../../api/salesApi";
import ProductVariantSelector from "./ProductVariantSelector";

const newKey = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `sale-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const newLineKey = () => `line-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * Sale form (inventory-outward, no prices).
 *
 * Supports MULTIPLE product lines per sale (like StockInForm).
 *
 * props:
 *  - fixedShop: shop id for sellers (hidden select); null/undefined shows
 *    a location selector (manager/owner entry).
 *  - mobile: large touch-friendly inputs (seller phone-first screens).
 *  - onCreated(sale) callback.
 *
 * Double-submit protection: submit disabled while pending + an
 * idempotency key per form fill (replayed posts return the same sale).
 */
export default function SaleForm({
  fixedShop = null,
  mobile = false,
  onCreated,
}) {
  const [shopId, setShopId] = useState("");
  const [lines, setLines] = useState([
    { key: newLineKey(), product: null, variant: null, variantObj: null, qty: "", unitId: "" },
  ]);
  const [customer, setCustomer] = useState("");
  const [slip, setSlip] = useState(null);
  const [idemKey, setIdemKey] = useState(newKey);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);

  const { data: shopsData } = useQuery({
    queryKey: ["shops", "all"],
    queryFn: () => shopApi.list(),
    enabled: !fixedShop,
    staleTime: 60000,
  });

  const { data: unitsData } = useQuery({
    queryKey: ["units"],
    queryFn: unitApi.list,
    staleTime: 60000,
  });

  const units = unitsData?.results || unitsData || [];
  const shops = shopsData?.results || shopsData || [];
  const sellableShops = shops.filter((s) => s.shop_type !== "IN_TRANSIT");

  const activeShopId = fixedShop || shopId;

  // Default the unit to the variant's own unit when a variant is picked.
  useEffect(() => {
    lines.forEach((line) => {
      if (!line.variantObj) return;
      const code = line.variantObj.unit || line.variantObj.unit_code;
      const match = units.find((u) => u.code === code);
      if (match) {
        setLines((prev) =>
          prev.map((l) =>
            l.key === line.key ? { ...l, unitId: String(match.id) } : l
          )
        );
      }
    });
  }, [variantObj, units]);

  const createMut = useMutation({
    mutationFn: salesApi.create,
    onSuccess: (sale) => {
      setError(null);
      setDone(sale);
      setLines([
        {
          key: newLineKey(),
          product: null,
          variant: null,
          variantObj: null,
          qty: "",
          unitId: "",
        },
      ]);
      setCustomer("");
      setSlip(null);
      setIdemKey(newKey()); // next sale gets a fresh key
      onCreated?.(sale);
    },
    onError: (err) => {
      const data = err?.response?.data;
      if (Array.isArray(data?.detail)) {
        setError(data.detail.join(" "));
      } else if (Array.isArray(data?.non_field_errors)) {
        setError(data.non_field_errors.join(" "));
      } else if (data?.detail) {
        setError(String(data.detail));
      } else if (data && typeof data === "object") {
        const msgs = Object.values(data).flat().map(String);
        setError(msgs.join(" "));
      } else {
        setError("Could not record the sale. Check the form and try again.");
      }
    },
  });

  const validLines = lines.filter((l) => l.variant && l.qty && Number(l.qty) > 0);
  const canSubmit =
    activeShopId &&
    validLines.length > 0 &&
    !createMut.isPending;

  function updateLine(key, patch) {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l))
    );
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      { key: newLineKey(), product: null, variant: null, variantObj: null, qty: "", unitId: "" },
    ]);
  }

  function removeLine(key) {
    setLines((prev) =>
      prev.length === 1 ? prev : prev.filter((l) => l.key !== key)
    );
  }

  function submit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    const fd = new FormData();
    fd.append("shop", String(activeShopId));
    fd.append("customer_name", customer);
    fd.append("idempotency_key", idemKey);
    const lineItems = validLines.map((l) => ({
      variant: l.variant,
      quantity: String(l.qty),
      ...(l.unitId ? { unit: Number(l.unitId) } : {}),
    }));
    fd.append("lines", JSON.stringify(lineItems));
    if (slip) fd.append("slip", slip);
    createMut.mutate(fd);
  }

  const inputCls = mobile
    ? "w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
    : "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none";
  const btnCls = mobile
    ? "w-full rounded-xl bg-amber-600 px-4 py-4 text-base font-semibold text-white shadow-sm hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
    : "btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <form onSubmit={submit} className="space-y-4">
      {done ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Recorded <strong>{done.reference}</strong>
          {done.customer_name ? ` for ${done.customer_name}` : ""}.
        </div>
      ) : null}

      {!fixedShop ? (
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Location
          </span>
          <select
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
            required
            className={inputCls}
          >
            <option value="">Select location…</option>
            {sellableShops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="space-y-1.5">
        <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Products
        </span>
        {lines.map((line) => (
          <div key={line.key} className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <ProductVariantSelector
                value={{ product: line.product, variant: line.variant }}
                onChange={(v) =>
                  updateLine(line.key, {
                    product: v.product,
                    variant: v.variant,
                    variantObj: v.variantObj || null,
                  })
                }
              />
            </div>
            <input
              type="number"
              min="0.001"
              step="any"
              inputMode="decimal"
              value={line.qty}
              onChange={(e) => updateLine(line.key, { qty: e.target.value })}
              placeholder="0.000"
              className="w-24 rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-amber-500 focus:outline-none"
            />
            <select
              value={line.unitId}
              onChange={(e) => updateLine(line.key, { unitId: e.target.value })}
              placeholder="Unit"
              className="w-24 rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-amber-500 focus:outline-none"
            >
              <option value="">Unit…</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.code} — {u.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removeLine(line.key)}
              disabled={lines.length === 1}
              className="mt-1 text-xs font-semibold text-slate-400 hover:text-rose-600 disabled:opacity-40"
              title="Remove line"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addLine}
          className="text-xs font-semibold text-amber-600 hover:text-amber-800"
        >
          + Add product line
        </button>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Customer (optional)
        </span>
        <input
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          placeholder="e.g. Walk-in customer"
          className={inputCls}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Slip photo (optional)
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setSlip(e.target.files?.[0] || null)}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
        />
        {slip ? (
          <span className="mt-1 block text-[11px] text-slate-500">
            {slip.name} · {Math.round(slip.size / 1024)} KB — JPEG/PNG/WebP,
            max 5 MB
          </span>
        ) : null}
      </label>

      {error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={!canSubmit} className={btnCls}>
        {createMut.isPending ? "Recording…" : "Record sale"}
      </button>
    </form>
  );
}