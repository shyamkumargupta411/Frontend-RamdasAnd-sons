import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { categoryApi } from "../../api/productApi";
import CategoryForm from "../../components/forms/CategoryForm";
import PageHeader from "../../components/common/PageHeader";
import StageNotice from "../../components/common/StageNotice";

const FACTOR_BADGE = {
  INGOT: "bg-amber-50 text-amber-700 ring-amber-600/20",
  FLAT: "bg-sky-50 text-sky-700 ring-sky-600/20",
  PIPE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  OTHER: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["product-categories", search],
    queryFn: () => categoryApi.list({ search: search || undefined }),
    retry: 1,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["product-categories"] });

  const createMut = useMutation({
    mutationFn: categoryApi.create,
    onSuccess: () => {
      invalidate();
      setShowForm(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...payload }) => categoryApi.update(id, payload),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });

  const categories = data?.results || data || [];

  return (
    <>
      <PageHeader
        title="Product categories"
        description="Categories control which variant fields the product form shows."
        actions={
          <button
            type="button"
            className="btn-primary px-3 py-1.5 text-xs"
            onClick={() => {
              setEditing(null);
              setShowForm((v) => !v);
            }}
          >
            {showForm ? "Close" : "+ New category"}
          </button>
        }
      />

      {showForm || editing ? (
        <div className="card mb-4 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-800">
            {editing ? `Edit ${editing.name}` : "New category"}
          </p>
          <CategoryForm
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

      <div className="mb-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories…"
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Category
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Code
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Variant fields
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Products
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
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-rose-600">
                    {error?.response?.data?.detail || "Failed to load."}
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{c.name}</p>
                      {c.description ? (
                        <p className="text-xs text-slate-500">{c.description}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {c.code}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                          FACTOR_BADGE[c.form_factor] || FACTOR_BADGE.OTHER
                        }`}
                      >
                        {c.form_factor}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {c.product_count ?? 0}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {c.is_active ? (
                        <span className="text-emerald-600">Active</span>
                      ) : (
                        <span className="text-slate-400">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="text-xs font-semibold text-amber-600 hover:text-amber-800"
                        onClick={() => {
                          setShowForm(false);
                          setEditing(c);
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

      <div className="mt-4">
        <StageNotice>
          Writes require OWNER or MANAGER with{" "}
          <code className="rounded bg-slate-100 px-1">can_manage_products</code>.
          Seeded: Metal Ingots · Patiya/Flat · Metal Pipes · Other Metal.
        </StageNotice>
      </div>
    </>
  );
}
