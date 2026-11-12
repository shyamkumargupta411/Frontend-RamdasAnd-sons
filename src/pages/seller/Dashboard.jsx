import { Link } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

const links = [
  { to: "/seller/stock", label: "My Shop Stock", hint: "Live quantities" },
  { to: "/seller/new-sale", label: "New Sale", hint: "Record stock out" },
  { to: "/seller/my-sales", label: "My Sales", hint: "Your sale history" },
  { to: "/seller/incoming", label: "Incoming", hint: "Receive transfers" },
];

export default function SellerDashboard() {
  const { user } = useAuth();
  const shop = user?.shops?.[0];

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Your shop
        </p>
        <h2 className="mt-1 text-lg font-bold text-slate-900">
          {shop?.name || "Not assigned"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Hello {user?.first_name || user?.username}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="card block p-4 transition hover:border-amber-300 hover:shadow"
          >
            <p className="text-sm font-bold text-slate-800">{l.label}</p>
            <p className="mt-0.5 text-xs text-slate-500">{l.hint}</p>
          </Link>
        ))}
      </div>

      <div className="card p-4">
        <p className="text-xs text-slate-400">
          You will only ever see stock and sales for your assigned shop.
        </p>
      </div>
    </div>
  );
}
