import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { categoryApi, productApi } from "../../api/productApi";
import PageHeader from "../../components/common/PageHeader";
import ProductForm from "../../components/forms/ProductForm";
import StageNotice from "../../components/common/StageNotice";

const STATUS_BADGE = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  INACTIVE: "bg-slate-100 text-slate-600 ring-slate-500/20",
  DISCONTINUED: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: catData } = useQuery({
    queryKey: ["product-categories", "all"],
    queryFn: () => categoryApi.list(),
    staleTime: 60000,
  });

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["products", search, category],
    queryFn: () =>
      productApi.list({
        search: search || undefined,
        category: category || undefined,
      }),
    retry: 1,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["products"] });

  const createMut = useMutation({
    mutationFn: productApi.create,
    onSuccess: () => {
      invalidate();
      setShowForm(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...payload }) => productApi.update(id, payload),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });

  const categories = catData?.results || catData || [];
  const products = data?.results || data || [];

  return (
    <>
      <PageHeader
        title="Products"
        description="Product master with size variants. Codes auto-generate as PROD-0001."
        actions={
          <button
            type="button"
            className="btn-primary px-3 py-1.5 text-xs"
            onClick={() => {
              setEditing(null);
              setShowForm((v) => !v);
            }}
          >
            {showForm ? "Close" : "+ New product"}
          </button>
        }
      />

      {showForm || editing ? (
        <div className="card mb-4 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-800">
            {editing ? `Edit ${editing.code} — ${editing.name}` : "New product"}
          </p>
          <ProductForm
            categories={categories}
            initial={editing}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
            onSubmit={(payload) =>
              editing
                ? updateMut.mutateAsync({ id: editing.id, ...payload })
                : createMut.mutateAsync(payload)
            }
          />
        </div>
      ) : null}

      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, code, material, grade…"
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn-secondary px-3 py-2 text-xs"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? "…" : "Refresh"}
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Code
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Product
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Category
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Material / Grade
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Variants
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-rose-600">
                    {error?.response?.data?.detail || "Failed to load products."}
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                    No products yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-600">
                      {p.code}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{p.name}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {p.category_name}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {p.material}
                      {p.grade ? ` · ${p.grade}` : ""}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {p.variant_count ?? p.variants?.length ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                          STATUS_BADGE[p.status] || STATUS_BADGE.ACTIVE
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="text-xs font-semibold text-amber-600 hover:text-amber-800"
                        onClick={() => {
                          setShowForm(false);
                          setEditing(p);
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4">
        <StageNotice>
          Variant fields follow the category form factor — ingot, flat, pipe or
          other. Duplicate sizes within a product are rejected by the backend.
        </StageNotice>
      </div>
    </>
  );
}
