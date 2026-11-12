import { Navigate, Outlet, useLocation } from "react-router-dom";

import LoadingSpinner from "../components/common/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import { ROLE_HOME } from "../utils/constants";

function FullScreenLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <LoadingSpinner label="Loading session..." />
    </div>
  );
}

/** Requires a logged-in user; optional `roles` allow-list. */
export function RequireAuth({ roles = null, children }) {
  const { isAuthenticated, user, bootstrapped } = useAuth();
  const location = useLocation();

  if (!bootstrapped) return <FullScreenLoading />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] || "/"} replace />;
  }
  return children ?? <Outlet />;
}

/** Already-logged-in users bounce off /login to their role home. */
export function RedirectIfAuthenticated({ children }) {
  const { isAuthenticated, user, bootstrapped } = useAuth();
  if (!bootstrapped) return <FullScreenLoading />;
  if (isAuthenticated && user) {
    return <Navigate to={ROLE_HOME[user.role] || "/"} replace />;
  }
  return children;
}

export default RequireAuth;
