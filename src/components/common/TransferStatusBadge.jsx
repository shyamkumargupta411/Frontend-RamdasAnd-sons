const STYLES = {
  DRAFT: "bg-slate-100 text-slate-700 ring-slate-200",
  DISPATCHED: "bg-amber-50 text-amber-800 ring-amber-200",
  RECEIVED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-700 ring-rose-200",
};

export default function TransferStatusBadge({ status }) {
  const cls = STYLES[status] || STYLES.DRAFT;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${cls}`}
    >
      {status}
    </span>
  );
}
