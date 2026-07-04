const projects = [
  { name: "AI Landing", meta: "Marketing frame" },
  { name: "Ops Dashboard", meta: "Analytics mock" },
  { name: "Mobile Assistant", meta: "Phone flow" },
];

export function DemoProjectPicker() {
  return (
    <section className="border-t border-desk-line p-3" data-testid="demo-project-picker">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-desk-muted">Demo Projects</h2>
        <button className="rounded border border-desk-line px-2 py-1 text-xs font-medium">Open</button>
      </div>
      <div className="space-y-2">
        {projects.map((project) => (
          <button className="flex w-full items-center justify-between rounded border border-desk-line px-3 py-2 text-left" key={project.name}>
            <span>
              <span className="block text-sm font-medium">{project.name}</span>
              <span className="block text-xs text-desk-muted">{project.meta}</span>
            </span>
            <span className="text-xs text-desk-muted">Local</span>
          </button>
        ))}
      </div>
    </section>
  );
}
