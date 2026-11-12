import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { productApi } from "../../api/productApi";

/**
 * Reusable searchable product-variant picker.
 *
 * value: { product: id|null, variant: id|null } (controlled)
 * onChange: ({ product, variant, productObj, variantObj }) => void
 */
export default function ProductVariantSelector({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(
    value?.product || null
  );

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", "selector", search],
    queryFn: () => productApi.list({ search: search || undefined, status: "ACTIVE" }),
    enabled: open,
    staleTime: 15000,
  });

  const { data: detail, isLoading: loadingDetail } = useQuery({
    queryKey: ["product", selectedProductId],
    queryFn: () => productApi.retrieve(selectedProductId),
    enabled: Boolean(selectedProductId),
    staleTime: 30000,
  });

  const list = products?.results || products || [];
  const variants = detail?.variants || [];

  useEffect(() => {
    if (value?.product) setSelectedProductId(value.product);
  }, [value?.product]);

  const selectedVariant = useMemo(
    () => variants.find((v) => String(v.id) === String(value?.variant)) || null,
    [variants, value?.variant]
  );

  const selectedProduct = detail || null;

  function pickProduct(p) {
    setSelectedProductId(p.id);
    onChange?.({
      product: p.id,
      variant: null,
      productObj: p,
      variantObj: null,
    });
    setOpen(false);
    setSearch("");
  }

  function pickVariant(v) {
    onChange?.({
      product: selectedProductId,
      variant: v.id,
      productObj: selectedProduct,
      variantObj: v,
    });
    setOpen(false);
  }

  function clear() {
    setSelectedProductId(null);
    onChange?.({ product: null, variant: null, productObj: null, variantObj: null });
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={
            open
              ? search
              : selectedProduct
              ? `${selectedProduct.code} — ${selectedProduct.name}`
              : search
          }
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
            if (selectedProductId && !open) {
              setSelectedProductId(null);
              onChange?.({
                product: null,
                variant: null,
                productObj: null,
                variantObj: null,
              });
            }
          }}
          onFocus={() => setOpen(true)}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder="Search product by name or code…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        />
        {selectedProduct && !open ? (
          <button
            type="button"
            onClick={clear}
            disabled={disabled}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        ) : null}

        {open ? (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {isLoading ? (
              <p className="px-3 py-2 text-xs text-slate-500">Searching…</p>
            ) : list.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-500">No products found.</p>
            ) : (
              list.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pickProduct(p)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-amber-50"
                >
                  <span className="font-mono text-xs text-slate-400">{p.code}</span>{" "}
                  <span className="font-medium text-slate-800">{p.name}</span>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>

      {selectedProductId ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Variant
          </p>
          {loadingDetail ? (
            <p className="mt-1 text-xs text-slate-500">Loading variants…</p>
          ) : variants.length === 0 ? (
            <p className="mt-1 text-xs text-slate-500">
              No variants for this product.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {variants.map((v) => {
                const active = String(value?.variant) === String(v.id);
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => pickVariant(v)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition ${
                      active
                        ? "bg-brand-900 text-white ring-brand-900"
                        : "bg-white text-slate-700 ring-slate-300 hover:bg-amber-50"
                    }`}
                  >
                    {v.spec_label} · {v.unit_code}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
