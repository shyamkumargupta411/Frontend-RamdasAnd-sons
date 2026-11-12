import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-600">
        404
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-1 text-sm text-slate-500">
        This route is not part of the Stage 1 skeleton.
      </p>
      <Link to="/" className="btn-primary mt-5">
        Back to health check
      </Link>
    </div>
  );
}
