const STYLES = {
  COMPLETED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  CORRECTED: "bg-violet-50 text-violet-800 ring-violet-200",
};

export default function SaleStatusBadge({ status }) {
  const cls = STYLES[status] || STYLES.COMPLETED;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${cls}`}
    >
      {status}
    </span>
  );
}
