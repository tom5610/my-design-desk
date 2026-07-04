import { demoProjects } from "../demo";

export function DemoProjectPicker() {
  return (
    <section className="border-t border-desk-line p-3" data-testid="demo-project-picker">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-desk-muted">Demo Projects</h2>
        <button className="rounded border border-desk-line px-2 py-1 text-xs font-medium">Open</button>
      </div>
      <div className="space-y-2">
        {demoProjects.map((project, index) => (
          <button className="flex w-full items-center justify-between rounded border border-desk-line px-3 py-2 text-left hover:border-teal-600 hover:bg-teal-50" key={project.id}>
            <span>
              <span className="block text-sm font-medium">{project.name}</span>
              <span className="block text-xs text-desk-muted">{project.meta}</span>
            </span>
            <span className="text-xs text-desk-muted">{index === 0 ? "Open" : "Local"}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
