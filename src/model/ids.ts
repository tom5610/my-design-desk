export type Brand<Value, Name extends string> = Value & { readonly __brand: Name };

export type NodeId = Brand<string, "NodeId">;
export type ComponentId = Brand<string, "ComponentId">;
export type StyleId = Brand<string, "StyleId">;
export type CommentId = Brand<string, "CommentId">;
export type PrototypeLinkId = Brand<string, "PrototypeLinkId">;
export type SnapshotId = Brand<string, "SnapshotId">;

export type IdPrefix = "node" | "component" | "style" | "comment" | "prototype" | "snapshot";

export type DeterministicIdFactory = {
  node: (hint?: string) => NodeId;
  component: (hint?: string) => ComponentId;
  style: (hint?: string) => StyleId;
  comment: (hint?: string) => CommentId;
  prototype: (hint?: string) => PrototypeLinkId;
  snapshot: (hint?: string) => SnapshotId;
};

const fallbackSeed = "design-desk";

function slug(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return normalized.length > 0 ? normalized : fallbackSeed;
}

function buildId(prefix: IdPrefix, seed: string, hint: string | undefined, counter: number) {
  const pieces = [prefix, slug(seed), hint ? slug(hint) : undefined, counter.toString().padStart(4, "0")].filter(Boolean);
  return pieces.join("_");
}

export function createDeterministicIdFactory(seed: string): DeterministicIdFactory {
  const counters = new Map<IdPrefix, number>();

  function next(prefix: IdPrefix, hint?: string) {
    const counter = (counters.get(prefix) ?? 0) + 1;
    counters.set(prefix, counter);
    return buildId(prefix, seed, hint, counter);
  }

  return {
    node: (hint) => next("node", hint) as NodeId,
    component: (hint) => next("component", hint) as ComponentId,
    style: (hint) => next("style", hint) as StyleId,
    comment: (hint) => next("comment", hint) as CommentId,
    prototype: (hint) => next("prototype", hint) as PrototypeLinkId,
    snapshot: (hint) => next("snapshot", hint) as SnapshotId,
  };
}
