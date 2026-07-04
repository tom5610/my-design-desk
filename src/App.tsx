import {
  Circle,
  Component,
  Download,
  Layers,
  MessageSquare,
  MousePointer2,
  Play,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Square,
  Type,
  Users,
} from "lucide-react";

const layers = [
  { name: "Landing page frame", kind: "Frame", active: true },
  { name: "Hero panel", kind: "Group", active: false },
  { name: "Primary action", kind: "Button", active: false },
  { name: "Metrics preview", kind: "Chart", active: false },
];

const properties = [
  ["X", "128"],
  ["Y", "96"],
  ["W", "960"],
  ["H", "620"],
  ["Rotate", "0"],
  ["Radius", "16"],
];

export function App() {
  return (
    <main className="flex h-screen min-h-[720px] bg-desk-canvas text-desk-ink">
      <aside className="flex w-[284px] shrink-0 flex-col border-r border-desk-line bg-white">
        <div className="flex h-14 items-center gap-2 border-b border-desk-line px-4">
          <div className="flex size-8 items-center justify-center rounded bg-desk-accent text-white">
            <Sparkles size={18} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-5">Design Desk</h1>
            <p className="text-xs text-desk-muted">AI Builder starter file</p>
          </div>
        </div>

        <div className="flex border-b border-desk-line px-3 py-2">
          <button className="flex flex-1 items-center justify-center gap-2 rounded bg-slate-100 px-3 py-2 text-xs font-medium">
            <Layers size={15} aria-hidden="true" />
            Layers
          </button>
          <button className="flex flex-1 items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-desk-muted">
            <Component size={15} aria-hidden="true" />
            Assets
          </button>
        </div>

        <label className="mx-3 mt-3 flex items-center gap-2 rounded border border-desk-line bg-white px-3 py-2 text-sm text-desk-muted">
          <Search size={15} aria-hidden="true" />
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-desk-muted"
            placeholder="Search layers"
            type="search"
          />
        </label>

        <div className="flex-1 overflow-auto px-2 py-3">
          {layers.map((layer) => (
            <button
              className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm ${
                layer.active ? "bg-teal-50 text-teal-900" : "text-slate-700 hover:bg-slate-50"
              }`}
              key={layer.name}
            >
              <span className="truncate">{layer.name}</span>
              <span className="text-xs text-desk-muted">{layer.kind}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-desk-line bg-white px-4">
          <div className="flex items-center gap-1">
            {[
              { label: "Select", icon: MousePointer2, active: true },
              { label: "Frame", icon: Square },
              { label: "Ellipse", icon: Circle },
              { label: "Text", icon: Type },
            ].map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  aria-label={tool.label}
                  className={`flex size-9 items-center justify-center rounded ${
                    tool.active ? "bg-desk-ink text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                  key={tool.label}
                  title={tool.label}
                >
                  <Icon size={17} aria-hidden="true" />
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 rounded border border-desk-line px-3 py-2 text-xs font-medium">
              <Users size={15} aria-hidden="true" />
              Local session
            </button>
            <button className="flex items-center gap-2 rounded bg-desk-accent px-3 py-2 text-xs font-semibold text-white">
              <Share2 size={15} aria-hidden="true" />
              Share
            </button>
          </div>
        </header>

        <div className="relative flex-1 overflow-hidden bg-[radial-gradient(circle_at_1px_1px,rgba(102,112,133,0.28)_1px,transparent_0)] [background-size:24px_24px]">
          <div className="absolute left-6 top-5 flex items-center gap-2 rounded border border-desk-line bg-white/95 px-3 py-2 text-xs font-medium shadow-panel">
            <span className="size-2 rounded-full bg-emerald-500" />
            100% · Draft saved locally
          </div>

          <div className="absolute left-1/2 top-1/2 h-[560px] w-[860px] -translate-x-1/2 -translate-y-1/2 rounded border border-slate-300 bg-white shadow-panel">
            <div className="flex h-full flex-col p-10">
              <div className="mb-8 flex items-center justify-between">
                <div className="text-sm font-semibold">AI Builder Suite</div>
                <div className="flex gap-2 text-xs text-desk-muted">
                  <span>Dashboard</span>
                  <span>Replay</span>
                  <span>Export</span>
                </div>
              </div>
              <div className="grid flex-1 grid-cols-[1.05fr_0.95fr] gap-8">
                <div className="flex flex-col justify-center">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                    Local-first design editor
                  </p>
                  <h2 className="text-5xl font-semibold leading-tight text-slate-950">
                    Prototype, replay, and export with deterministic design ops.
                  </h2>
                  <div className="mt-7 flex gap-3">
                    <button className="rounded bg-desk-ink px-4 py-2 text-sm font-semibold text-white">
                      Start editing
                    </button>
                    <button className="rounded border border-desk-line px-4 py-2 text-sm font-semibold">
                      View replay
                    </button>
                  </div>
                </div>
                <div className="grid content-center gap-4">
                  <div className="rounded border border-desk-line bg-slate-50 p-4">
                    <div className="mb-3 h-3 w-36 rounded bg-slate-300" />
                    <div className="h-28 rounded bg-white shadow-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-28 rounded border border-desk-line bg-teal-50" />
                    <div className="h-28 rounded border border-desk-line bg-indigo-50" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex h-9 items-center justify-between border-t border-desk-line bg-white px-4 text-xs text-desk-muted">
          <span>Session: local-demo</span>
          <span>Milestone 2 scaffold</span>
        </footer>
      </section>

      <aside className="flex w-[320px] shrink-0 flex-col border-l border-desk-line bg-white">
        <div className="flex h-14 items-center justify-between border-b border-desk-line px-4">
          <div>
            <h2 className="text-sm font-semibold">Inspector</h2>
            <p className="text-xs text-desk-muted">Landing page frame</p>
          </div>
          <SlidersHorizontal size={18} aria-hidden="true" />
        </div>

        <div className="space-y-5 overflow-auto p-4">
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-desk-muted">Geometry</h3>
            <div className="grid grid-cols-2 gap-2">
              {properties.map(([label, value]) => (
                <label className="rounded border border-desk-line px-3 py-2" key={label}>
                  <span className="block text-[11px] font-medium text-desk-muted">{label}</span>
                  <input className="mt-1 w-full bg-transparent text-sm font-medium outline-none" value={value} readOnly />
                </label>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-desk-muted">Appearance</h3>
            <div className="space-y-2">
              <button className="flex w-full items-center justify-between rounded border border-desk-line px-3 py-2 text-sm">
                Fill
                <span className="size-5 rounded bg-teal-600" />
              </button>
              <button className="flex w-full items-center justify-between rounded border border-desk-line px-3 py-2 text-sm">
                Stroke
                <span className="size-5 rounded border border-slate-400" />
              </button>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-desk-muted">Panels</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Comments", icon: MessageSquare },
                { label: "Replay", icon: Play },
                { label: "Export", icon: Download },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button className="flex flex-col items-center gap-2 rounded border border-desk-line px-2 py-3 text-xs" key={item.label}>
                    <Icon size={16} aria-hidden="true" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </aside>
    </main>
  );
}
