export default function StageNotice({ children }) {
  return (
    <div className="card p-4 sm:p-5">
      <p className="text-sm text-slate-600">{children}</p>
    </div>
  );
}
