import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { authApi } from "../api/authApi";
import { useAuth } from "../hooks/useAuth";
import { ROLE_HOME } from "../utils/constants";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authApi.login(username.trim(), password);
      setSession(data);
      const from = location.state?.from?.pathname;
      const target =
        from && from !== "/login"
          ? from
          : ROLE_HOME[data.user?.role] || "/";
      navigate(target, { replace: true });
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        (err?.response?.status === 401
          ? "Invalid username or password."
          : "Could not reach the server. Is the API running?");
      setError(detail);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-600">
            Metal Wholesale &amp; Retail
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Sign in
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Inventory Management System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-5">
          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          ) : null}

          <div>
            <label
              htmlFor="username"
              className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
              placeholder="your username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          <Link to="/" className="hover:text-slate-600">
            API health check
          </Link>
        </p>
      </div>
    </div>
  );
}
