import { Link } from "react-router-dom";

import { API_BASE_URL } from "../api/client";
import StatusBadge from "../components/common/StatusBadge";
import { useHealth } from "../hooks/useHealth";
import { formatDateTime } from "../utils/format";

function Detail({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 break-all text-sm font-medium text-slate-800">
        {value ?? "—"}
      </dd>
    </div>
  );
}

export default function HealthCheckPage() {
  const { data, error, isError, isFetching, refetch, dataUpdatedAt } = useHealth();

  const payload = data || error?.response?.data;
  const status = isError
    ? payload?.status === "degraded"
      ? "degraded"
      : "error"
    : data
      ? data.status === "ok"
        ? "ok"
        : "degraded"
      : "unknown";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-600">
            Metal Wholesale &amp; Retail
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Inventory Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Phase 1 · Stage 1 setup · API connectivity check
          </p>
        </div>

        <section className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Backend health
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {dataUpdatedAt
                  ? `Checked ${formatDateTime(new Date(dataUpdatedAt))}`
                  : "Checking the API..."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={status} />
              <button
                type="button"
                className="btn-secondary px-3 py-1.5 text-xs"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                {isFetching ? "Checking..." : "Re-check"}
              </button>
            </div>
          </div>

          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
            <Detail label="API base URL" value={API_BASE_URL} />
            <Detail label="Service" value={payload?.service} />
            <Detail label="Version" value={payload?.version} />
            <Detail label="Database" value={payload?.database} />
            <Detail label="Server time (IST)" value={formatDateTime(payload?.time)} />
            <Detail
              label="HTTP"
              value={isError ? error?.response?.status || "Network error" : "200 OK"}
            />
          </dl>

          {isError ? (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              Could not reach the API. Start Django on port 8000, then confirm{" "}
              <code className="rounded bg-white px-1 py-0.5">
                CORS_ALLOWED_ORIGINS
              </code>{" "}
              includes this origin (http://localhost:5173).
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              Frontend → Axios → React Query → Django is wired correctly.
            </div>
          )}
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { to: "/owner", title: "Owner", note: "Full access console" },
            { to: "/manager", title: "Manager", note: "Stock operations" },
            { to: "/seller", title: "Seller", note: "Simple mobile view" },
          ].map((role) => (
            <Link
              key={role.to}
              to={role.to}
              className="card block p-4 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-sm font-semibold text-slate-900">{role.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{role.note}</p>
              <p className="mt-3 text-xs font-semibold text-amber-600">
                Open skeleton →
              </p>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
