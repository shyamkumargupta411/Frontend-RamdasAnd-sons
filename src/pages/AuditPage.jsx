import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { auditApi, ActionBadge } from "../api/auditApi";
import { shopApi } from "../api/authApi";
import { userApi } from "../api/authApi";
import PageHeader from "../components/common/PageHeader";
import StageNotice from "../components/common/StageNotice";

export default function AuditPage() {
  const [modelFilter, setModelFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [objectId, setObjectId] = useState("");
  const [page, setPage] = useState(1);

  const params = {
    ...(modelFilter && { model: modelFilter }),
    ...(userFilter && { user: userFilter }),
    ...(dateFrom && { date_from: dateFrom }),
    ...(dateTo && { date_to: dateTo }),
    ...(objectId && { object_id: objectId }),
    page,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["audit", params],
    queryFn: () => auditApi.list(params),
    enabled: true,
  });

  const { data: modelsData } = useQuery({
    queryKey: ["audit-models"],
    queryFn: () => auditApi.models(),
    staleTime: 60000,
  });
  const auditModels = modelsData || [];

  const { data: usersData } = useQuery({
    queryKey: ["audit-users"],
    queryFn: () => auditApi.users(),
    staleTime: 60000,
  });
  const auditUsers = usersData || [];

  const results = data?.results || [];
  const count = data?.count ?? 0;
  const totalPages = data?.total_pages ?? 1;
  const currentPage = data?.page ?? 1;

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Loading audit log…</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Audit Log"
        description="History of edits across products, stock, sales, transfers and more. Owner and Manager only."
      />

      <div className="card p-4">
        <div className="grid gap-4 sm:grid-cols-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Model
            </label>
            <select
              value={modelFilter}
              onChange={(e) => {
                setModelFilter(e.target.value);
                setPage(1);
              }}
              className="input w-full"
            >
              <option value="">All models</option>
              {auditModels.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              User
            </label>
            <select
              value={userFilter}
              onChange={(e) => {
                setUserFilter(e.target.value);
                setPage(1);
              }}
              className="input w-full"
            >
              <option value="">All users</option>
              {auditUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username} ({u.role})
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
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
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
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Object ID
            </label>
            <input
              type="number"
              value={objectId}
              onChange={(e) => {
                setObjectId(e.target.value);
                setPage(1);
              }}
              className="input w-full"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setModelFilter("");
                setUserFilter("");
                setDateFrom("");
                setDateTo("");
                setObjectId("");
                setPage(1);
              }}
              className="btn-secondary px-4 py-2 w-full"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">
            Audit Entries ({count})
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Time
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  User
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Model
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Object
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Action
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Changes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {results.length ? (
                results.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50/50">
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {new Date(e.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {e.user || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                      {e.model}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {e.object_repr} <span className="text-slate-400">#{e.object_id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={e.action} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[300px]">
                      {e.changes ? (
                        <div className="space-y-1">
                          {Object.entries(e.changes.changed || {}).map(
                            ([field, vals]) => (
                              <div key={field} className="text-[10px]">
                                <span className="text-slate-400">{field}:</span>{" "}
                                {Array.isArray(vals)
                                  ? `${vals[0]} → ${vals[1]}`
                                  : vals}
                              </div>
                            )
                          )}
                          {Object.entries(e.changes.added || {}).map(
                            ([field, val]) => (
                              <div key={`add-${field}`} className="text-[10px] text-emerald-600">
                                + {field}: {val}
                              </div>
                            )
                          )}
                          {Object.entries(e.changes.removed || {}).map(
                            ([field, val]) => (
                              <div key={`rem-${field}`} className="text-[10px] text-rose-600">
                                − {field}: {val}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No audit entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-2.5 py-1 text-xs rounded border border-slate-200 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-2.5 py-1 text-xs rounded border border-slate-200 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        <StageNotice>
          Entries are created automatically when a tracked model is created,
          updated, or soft-deleted. "Changes" shows field-level before/after
          values for updates. The log is append-only and cannot be edited.
        </StageNotice>
      </div>
    </div>
  );
}