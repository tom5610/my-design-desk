export type DemoProject = {
  id: string;
  name: string;
  meta: string;
  focus: string;
};

export const demoProjects: readonly DemoProject[] = [
  {
    id: "ai-builder-suite",
    name: "AI Builder Suite",
    meta: "Prototype, replay, export",
    focus: "Default local-first editor demo",
  },
  {
    id: "ops-dashboard",
    name: "Ops Dashboard",
    meta: "Analytics review",
    focus: "Comments, snapshots, multiplayer",
  },
  {
    id: "mobile-assistant",
    name: "Mobile Assistant",
    meta: "Phone flow",
    focus: "Prototype links and generated React",
  },
];
