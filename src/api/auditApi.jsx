import client from "./client";

/** Audit log (owner + manager): history across tracked models. */
export const auditApi = {
  list: (params = {}) =>
    client.get("/audit/", { params }).then((r) => r.data),
  models: () => client.get("/audit/models/").then((r) => r.data),
  users: () => client.get("/audit/users/").then((r) => r.data),
};

const ACTION_COLORS = {
  Created: "text-emerald-700 bg-emerald-50",
  Updated: "text-amber-700 bg-amber-50",
  Deleted: "text-rose-700 bg-rose-50",
};

export function ActionBadge({ action }) {
  const cls = ACTION_COLORS[action] || "text-slate-700 bg-slate-50";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
      {action}
    </span>
  );
}