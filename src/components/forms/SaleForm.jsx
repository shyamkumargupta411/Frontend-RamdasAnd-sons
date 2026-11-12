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

/**
 * Sale form (inventory-outward, no prices).
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
  const [product, setProduct] = useState(null);
  const [variant, setVariant] = useState(null);
  const [variantObj, setVariantObj] = useState(null);
  const [qty, setQty] = useState("");
  const [unitId, setUnitId] = useState("");
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

  // Default the unit to the variant's own unit when a variant is picked.
  useEffect(() => {
    if (!variantObj) return;
    const code = variantObj.unit || variantObj.unit_code;
    const match = units.find((u) => u.code === code);
    if (match) setUnitId(String(match.id));
  }, [variantObj, units]);

  const createMut = useMutation({
    mutationFn: salesApi.create,
    onSuccess: (sale) => {
      setError(null);
      setDone(sale);
      setVariant(null);
      setVariantObj(null);
      setProduct(null);
      setQty("");
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
        const msgs = Object.values(data)
          .flat()
          .map(String);
        setError(msgs.join(" "));
      } else {
        setError("Could not record the sale. Check the form and try again.");
      }
    },
  });

  const activeShopId = fixedShop || shopId;
  const canSubmit =
    activeShopId &&
    variant &&
    qty &&
    Number(qty) > 0 &&
    !createMut.isPending;

  function submit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    const fd = new FormData();
    fd.append("shop", String(activeShopId));
    fd.append("customer_name", customer);
    fd.append("idempotency_key", idemKey);
    const line = { variant, quantity: String(qty) };
    if (unitId) line.unit = Number(unitId);
    fd.append("lines", JSON.stringify([line]));
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
          Product
        </span>
        <ProductVariantSelector
          value={{ product, variant }}
          onChange={(v) => {
            setProduct(v.product);
            setVariant(v.variant);
            setVariantObj(v.variantObj || null);
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
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
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Unit
          </span>
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className={inputCls}
          >
            <option value="">Unit…</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code} — {u.name}
              </option>
            ))}
          </select>
        </label>
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
