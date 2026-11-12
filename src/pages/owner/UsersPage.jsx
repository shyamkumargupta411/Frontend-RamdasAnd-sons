import { useQuery } from "@tanstack/react-query";

import { userApi } from "../../api/authApi";
import PageHeader from "../../components/common/PageHeader";
import StageNotice from "../../components/common/StageNotice";

const ROLE_BADGE = {
  OWNER: "bg-amber-50 text-amber-700 ring-amber-600/20",
  MANAGER: "bg-sky-50 text-sky-700 ring-sky-600/20",
  SELLER: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

function EmptyForm() {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Add user
      </p>
      <p className="mt-2 text-xs text-slate-400">
        Create/edit form arrives with the user-management stage polish. Use{" "}
        <code className="rounded bg-slate-100 px-1">/admin/</code> or the API
        for now.
      </p>
    </div>
  );
}

export default function OwnerUsersPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["owner", "users"],
    queryFn: () => userApi.list(),
    retry: 1,
  });

  const users = data?.results || data || [];

  return (
    <>
      <PageHeader
        title="Users & access"
        description="Create accounts and assign roles. Only the owner can manage users."
        actions={
          <button
            type="button"
            className="btn-secondary px-3 py-1.5 text-xs"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
        }
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  User
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Role
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Products
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Active
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-rose-600">
                    {error?.response?.data?.detail || "Failed to load users."}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{u.username}</p>
                      <p className="text-xs text-slate-500">
                        {[u.first_name, u.last_name].filter(Boolean).join(" ") ||
                          u.email ||
                        "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                          ROLE_BADGE[u.role] || ROLE_BADGE.SELLER
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {u.role === "MANAGER"
                        ? u.can_manage_products
                          ? "Yes"
                          : "No"
                        : u.role === "OWNER"
                        ? "Always"
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {u.is_active ? (
                        <span className="text-emerald-600">Active</span>
                      ) : (
                        <span className="text-slate-400">Disabled</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <EmptyForm />
        <StageNotice>
          Roles are enforced on the backend: managers and sellers receive 403 on{" "}
          <code className="rounded bg-slate-100 px-1">/api/users/</code>.
        </StageNotice>
      </div>
    </>
  );
}
