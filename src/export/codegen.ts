import { assertValidDesign, resolveComponentInstance, type ComponentDefinition, type DesignFile, type Geometry, type ImageNode, type NodeId, type NodeStyle, type SceneNode } from "../model";
import { serializeCanonical, serializeDesign } from "../serialization";

export type GeneratedFile = {
  path: string;
  content: string;
};

export type ExportAssetReference = {
  source: string;
  outputPath: string;
};

type Point = {
  x: number;
  y: number;
};

type StyleValue = number | string;
type StyleEntry = readonly [string, StyleValue | undefined];

function q(value: string) {
  return JSON.stringify(value);
}

function solidFill(style: NodeStyle) {
  const solid = style.fills.find((fill) => fill.kind === "solid");
  return solid?.kind === "solid" ? solid.color : "#ffffff";
}

function pascalCase(value: string, fallback: string) {
  const words = value.match(/[A-Za-z0-9]+/g) ?? [];
  const name = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
  return name || fallback;
}

function uniqueNames<T extends { id: string; name: string }>(items: readonly T[], suffix: string) {
  const used = new Set<string>();
  const names = new Map<string, string>();

  for (const item of items) {
    let base = pascalCase(item.name, `${suffix}${used.size + 1}`);
    if (!/^[A-Za-z]/.test(base)) {
      base = `${suffix}${base}`;
    }
    let next = base;
    let index = 2;
    while (used.has(next)) {
      next = `${base}${index}`;
      index += 1;
    }
    used.add(next);
    names.set(item.id, next);
  }

  return names;
}

function styleObject(entries: readonly StyleEntry[]) {
  const body = entries
    .filter((entry): entry is [string, StyleValue] => entry[1] !== undefined)
    .map(([key, value]) => `${key}: ${typeof value === "number" ? Number(value.toFixed(4)) : q(value)}`)
    .join(", ");
  return `{{ ${body} }}`;
}

function layoutStyle(geometry: Geometry, origin: Point, extra: readonly StyleEntry[] = []) {
  return styleObject([
    ["position", "absolute"],
    ["left", geometry.x - origin.x],
    ["top", geometry.y - origin.y],
    ["width", geometry.width],
    ["height", geometry.height],
    ["transform", geometry.rotation === 0 ? undefined : `rotate(${geometry.rotation}deg)`],
    ...extra,
  ]);
}

function nodeStyle(style: NodeStyle) {
  return [
    ["backgroundColor", solidFill(style)],
    ["borderRadius", style.radius ?? 0],
    ["opacity", style.opacity],
    ["border", style.stroke ? `${style.stroke.width}px solid ${style.stroke.color}` : undefined],
    ["boxShadow", style.shadows.length > 0 ? style.shadows.map((shadow) => `${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${shadow.color}`).join(", ") : undefined],
  ] as const;
}

function imageAssetPath(src: string) {
  const name = src.split("/").filter(Boolean).at(-1) ?? "asset";
  return `public/assets/${name}`;
}

function imageRuntimePath(src: string) {
  return `/${imageAssetPath(src).replace(/^public\//, "")}`;
}

function isContainer(node: SceneNode): node is Extract<SceneNode, { children: readonly NodeId[] }> {
  return "children" in node;
}

function renderChildren(design: DesignFile, nodes: Record<NodeId, SceneNode>, childIds: readonly NodeId[], origin: Point, indent: string): string {
  return childIds.map((childId) => renderNode(design, nodes, childId, origin, indent)).filter(Boolean).join("\n");
}

function renderTextNode(node: Extract<SceneNode, { kind: "Text" }>, origin: Point, indent: string) {
  return `${indent}<p className="absolute m-0 whitespace-pre-wrap" style=${layoutStyle(node.geometry, origin, [
    ["color", node.textStyle.color],
    ["fontFamily", node.textStyle.fontFamily],
    ["fontSize", node.textStyle.fontSize],
    ["fontWeight", node.textStyle.fontWeight],
    ["lineHeight", node.textStyle.lineHeight],
    ["letterSpacing", node.textStyle.letterSpacing],
  ])}>{${q(node.text)}}</p>`;
}

function renderButtonNode(design: DesignFile, nodes: Record<NodeId, SceneNode>, node: Extract<SceneNode, { kind: "Button" }>, origin: Point, indent: string) {
  const children = renderChildren(design, nodes, node.children, origin, `${indent}  `);
  const body = `${indent}<button className="absolute flex items-center justify-center text-center" style=${layoutStyle(node.geometry, origin, [
    ...nodeStyle(node.style),
    ["color", node.textStyle.color],
    ["fontFamily", node.textStyle.fontFamily],
    ["fontSize", node.textStyle.fontSize],
    ["fontWeight", node.textStyle.fontWeight],
  ])} type="button">\n${indent}  {${q(node.label)}}${children ? `\n${children}` : ""}\n${indent}</button>`;
  return body;
}

function renderImageNode(node: ImageNode, origin: Point, indent: string) {
  return `${indent}<div className="absolute overflow-hidden" style=${layoutStyle(node.geometry, origin, nodeStyle(node.style))}>\n${indent}  <img alt={${q(node.alt)}} className="size-full object-cover" src={${q(imageRuntimePath(node.src))}} />\n${indent}</div>`;
}

function renderChartNode(node: Extract<SceneNode, { kind: "ChartPlaceholder" }>, origin: Point, indent: string) {
  const bars = [0, 1, 2, 3]
    .map((index) => {
      const height = 42 + index * 22;
      return `${indent}  <span className="absolute rounded" style=${styleObject([
        ["left", 42 + index * 70],
        ["bottom", 42],
        ["width", 42],
        ["height", height],
        ["backgroundColor", "#0f766e"],
        ["opacity", 0.22 + index * 0.12],
      ])} />`;
    })
    .join("\n");
  return `${indent}<div className="absolute" style=${layoutStyle(node.geometry, origin, nodeStyle(node.style))}>\n${bars}\n${indent}</div>`;
}

function renderLineNode(node: Extract<SceneNode, { kind: "Line" }>, origin: Point, indent: string) {
  const left = Math.min(node.start.x, node.end.x) - origin.x;
  const top = Math.min(node.start.y, node.end.y) - origin.y;
  const width = Math.abs(node.end.x - node.start.x) || node.stroke.width;
  const height = Math.abs(node.end.y - node.start.y) || node.stroke.width;
  return `${indent}<svg className="absolute overflow-visible" style=${styleObject([
    ["position", "absolute"],
    ["left", left],
    ["top", top],
    ["width", width],
    ["height", height],
  ])}>\n${indent}  <line stroke={${q(node.stroke.color)}} strokeWidth={${node.stroke.width}} x1={${node.start.x - origin.x - left}} x2={${node.end.x - origin.x - left}} y1={${node.start.y - origin.y - top}} y2={${node.end.y - origin.y - top}} />\n${indent}</svg>`;
}

function renderNode(design: DesignFile, nodes: Record<NodeId, SceneNode>, nodeId: NodeId, origin: Point, indent: string): string {
  const node = nodes[nodeId];
  if (!node || !node.visible) {
    return "";
  }

  switch (node.kind) {
    case "Frame":
    case "Rectangle":
      return `${indent}<div className="absolute" style=${layoutStyle(node.geometry, origin, nodeStyle(node.style))}>${isContainer(node) ? `\n${renderChildren(design, nodes, node.children, origin, `${indent}  `)}\n${indent}` : ""}</div>`;
    case "Ellipse":
      return `${indent}<div className="absolute rounded-full" style=${layoutStyle(node.geometry, origin, nodeStyle(node.style))} />`;
    case "Group":
    case "ComponentRoot":
      return renderChildren(design, nodes, node.children, origin, indent);
    case "Line":
      return renderLineNode(node, origin, indent);
    case "Text":
      return renderTextNode(node, origin, indent);
    case "Image":
      return renderImageNode(node, origin, indent);
    case "Button":
      return renderButtonNode(design, nodes, node, origin, indent);
    case "Icon":
      return `${indent}<svg className="absolute overflow-visible" style=${layoutStyle(node.geometry, origin)} viewBox="0 0 24 24"><path d={${q(node.svgPath)}} fill={${q(node.color)}} /></svg>`;
    case "ChartPlaceholder":
      return renderChartNode(node, origin, indent);
    case "ComponentInstance": {
      const resolved = resolveComponentInstance(design, node);
      if (!resolved) {
        return `${indent}<div className="absolute flex items-center justify-center border border-slate-900 bg-white text-sm font-semibold" style=${layoutStyle(node.geometry, origin)}>{${q(String(node.overrides.label ?? "Instance"))}}</div>`;
      }
      return renderChildren(design, resolved.nodes, resolved.childIds, origin, indent);
    }
  }
}

function generateFrameComponent(design: DesignFile, frame: SceneNode, componentName: string) {
  if (frame.kind !== "Frame") {
    throw new Error(`Root ${frame.id} is not a frame`);
  }
  const origin = { x: frame.geometry.x, y: frame.geometry.y };
  const children = renderChildren(design, design.nodes, frame.children, origin, "      ");
  return `export function ${componentName}() {\n  return (\n    <section className="relative overflow-hidden" style=${styleObject([
    ["width", frame.geometry.width],
    ["height", frame.geometry.height],
    ["backgroundColor", solidFill(frame.style)],
  ])}>\n${children}\n    </section>\n  );\n}\n`;
}

function generateComponentFile(design: DesignFile, component: ComponentDefinition, componentName: string) {
  const root = design.nodes[component.rootNodeId];
  if (!root || root.kind !== "ComponentRoot") {
    throw new Error(`Component ${component.id} is missing a component root`);
  }
  const origin = { x: root.geometry.x, y: root.geometry.y };
  const children = renderChildren(design, design.nodes, root.children, origin, "      ");
  return `import type { CSSProperties } from "react";\n\nexport function ${componentName}({ style }: { style?: CSSProperties }) {\n  return (\n    <div className="relative overflow-hidden" style={{ width: ${root.geometry.width}, height: ${root.geometry.height}, ...style }}>\n${children}\n    </div>\n  );\n}\n`;
}

export function collectExportAssets(design: DesignFile): readonly ExportAssetReference[] {
  const refs = Object.values(design.nodes)
    .filter((node): node is ImageNode => node.kind === "Image")
    .map((node) => ({ source: node.src, outputPath: imageAssetPath(node.src) }));
  return refs.sort((left, right) => left.outputPath.localeCompare(right.outputPath) || left.source.localeCompare(right.source));
}

export function createAssetManifest(references: readonly (ExportAssetReference & { copied?: boolean })[]) {
  return `${serializeCanonical({ assets: references })}\n`;
}

export function generateExportFiles(design: DesignFile): readonly GeneratedFile[] {
  assertValidDesign(design);

  const roots = design.rootIds.map((rootId) => design.nodes[rootId]).filter((node): node is SceneNode => Boolean(node));
  const rootNames = uniqueNames(roots, "Frame");
  const componentNames = uniqueNames(Object.values(design.components), "Component");
  const files: GeneratedFile[] = [
    {
      path: "design.json",
      content: `${serializeDesign(design)}\n`,
    },
    {
      path: "package.json",
      content: `${serializeCanonical({
        dependencies: { "@vitejs/plugin-react": "^6.0.3", react: "^18.3.1", "react-dom": "^18.3.1", vite: "^8.1.3" },
        devDependencies: { tailwindcss: "^3.4.17", typescript: "^5.7.2" },
        private: true,
        scripts: { build: "vite build", dev: "vite --host 127.0.0.1" },
        type: "module",
      })}\n`,
    },
    {
      path: "tailwind.config.js",
      content: "export default { content: [\"./index.html\", \"./src/**/*.{ts,tsx}\"], theme: { extend: {} }, plugins: [] };\n",
    },
    {
      path: "src/index.css",
      content: "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n",
    },
  ];

  for (const root of roots) {
    const name = rootNames.get(root.id);
    if (name && root.kind === "Frame") {
      files.push({ path: `src/frames/${name}.tsx`, content: generateFrameComponent(design, root, name) });
    }
  }

  for (const component of Object.values(design.components).sort((left, right) => left.id.localeCompare(right.id))) {
    const name = componentNames.get(component.id);
    if (name) {
      files.push({ path: `src/components/${name}.tsx`, content: generateComponentFile(design, component, name) });
    }
  }

  const frameExports = roots
    .map((root) => rootNames.get(root.id))
    .filter((name): name is string => Boolean(name))
    .map((name) => `import { ${name} } from "./frames/${name}";`)
    .join("\n");
  const frameElements = roots
    .map((root) => rootNames.get(root.id))
    .filter((name): name is string => Boolean(name))
    .map((name) => `      <${name} />`)
    .join("\n");

  files.push({
    path: "src/App.tsx",
    content: `${frameExports}\n\nexport function App() {\n  return (\n    <main className="flex min-h-screen flex-col gap-8 bg-slate-100 p-8">\n${frameElements}\n    </main>\n  );\n}\n\nexport default App;\n`,
  });
  files.push({
    path: "src/main.tsx",
    content: "import React from \"react\";\nimport { createRoot } from \"react-dom/client\";\nimport { App } from \"./App\";\nimport \"./index.css\";\n\ncreateRoot(document.getElementById(\"root\")!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n);\n",
  });
  files.push({
    path: "index.html",
    content: "<!doctype html>\n<html lang=\"en\">\n  <head><meta charset=\"UTF-8\" /><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /><title>Design Desk Export</title></head>\n  <body><div id=\"root\"></div><script type=\"module\" src=\"/src/main.tsx\"></script></body>\n</html>\n",
  });
  files.push({
    path: "assets/asset-manifest.json",
    content: createAssetManifest(collectExportAssets(design)),
  });

  return files.sort((left, right) => left.path.localeCompare(right.path));
}
