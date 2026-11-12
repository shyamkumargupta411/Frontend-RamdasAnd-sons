const styles = {
  ok: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  degraded: "bg-amber-50 text-amber-700 ring-amber-600/20",
  error: "bg-rose-50 text-rose-700 ring-rose-600/20",
  unknown: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const labels = {
  ok: "Operational",
  degraded: "Degraded",
  error: "Unreachable",
  unknown: "Unknown",
};

export default function StatusBadge({ status = "unknown", label }) {
  const key = styles[status] ? status : "unknown";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[key]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label || labels[key]}
    </span>
  );
}
