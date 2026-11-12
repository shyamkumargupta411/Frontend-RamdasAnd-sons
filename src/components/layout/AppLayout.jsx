import { Link, NavLink, useNavigate } from "react-router-dom";

import { API_BASE_URL } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";

function navClasses(isActive) {
  return [
    "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition",
    isActive
      ? "bg-white/10 text-white"
      : "text-slate-300 hover:bg-white/5 hover:text-white",
  ].join(" ");
}

function NavItems({ items }) {
  return (
    <nav className="space-y-1">
      {items.map((item) =>
        item.soon ? (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-500"
          >
            <span>{item.label}</span>
            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Soon
            </span>
          </div>
        ) : (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) => navClasses(isActive)}
          >
            <span>{item.label}</span>
          </NavLink>
        )
      )}
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/" className="block">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-400">
        Metal
      </p>
      <p className="text-lg font-bold leading-tight text-white">Inventory</p>
    </Link>
  );
}

function ConsoleShell({ title, subtitle, badge, navItems, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-brand-900 px-4 py-6 md:flex">
        <Brand />
        <div className="mt-8 flex-1">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            {badge}
          </p>
          <NavItems items={navItems} />
        </div>
        <div className="border-t border-white/10 pt-4">
          <p className="mb-2 truncate px-3 text-xs text-slate-400">
            {user?.username}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
          >
            Sign out
          </button>
          <Link
            to="/"
            className="mt-1 block truncate rounded-lg px-3 py-2 text-xs text-slate-500 hover:bg-white/5 hover:text-slate-300"
          >
            API: {API_BASE_URL}
          </Link>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {title}
              </p>
              <p className="truncate text-xs text-slate-500">{subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                Health
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-secondary px-3 py-1.5 text-xs md:hidden"
              >
                Exit
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function SellerShell({ title, subtitle, navItems, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 bg-brand-900 px-4 py-3 text-white">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-400">
              Metal Inventory
            </p>
            <p className="text-base font-bold leading-tight">{title}</p>
            <p className="text-[11px] text-slate-400">
              {subtitle}
              {user?.shops?.[0]?.name ? ` · ${user.shops[0].name}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg px-4 pb-28 pt-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid w-full max-w-lg grid-cols-3">
          {navItems.map((item) =>
            item.soon ? (
              <div
                key={item.label}
                className="flex flex-col items-center gap-1 px-2 py-3 text-[11px] font-medium text-slate-400"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                {item.label}
              </div>
            ) : (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    "flex flex-col items-center gap-1 px-2 py-3 text-[11px] font-semibold",
                    isActive ? "text-brand-900" : "text-slate-400",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isActive ? "bg-accent-500" : "bg-slate-300"
                      }`}
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            )
          )}
        </div>
      </nav>
    </div>
  );
}

export default function AppLayout({
  variant = "console",
  title,
  subtitle,
  badge = "Workspace",
  navItems = [],
  children,
}) {
  if (variant === "seller") {
    return (
      <SellerShell title={title} subtitle={subtitle} navItems={navItems}>
        {children}
      </SellerShell>
    );
  }

  return (
    <ConsoleShell
      title={title}
      subtitle={subtitle}
      badge={badge}
      navItems={navItems}
    >
      {children}
    </ConsoleShell>
  );
}
