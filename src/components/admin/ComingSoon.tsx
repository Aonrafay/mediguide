export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-4xl">🚧</p>
        <p className="mt-3 font-medium text-slate-700">
          This section arrives in {phase}.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          The data model is ready — the interface is being built next.
        </p>
      </div>
    </div>
  );
}
