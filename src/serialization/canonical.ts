import type { DesignFile } from "../model/scene";
import { assertValidDesign } from "../model/validation";

export type CanonicalValue =
  | null
  | boolean
  | number
  | string
  | readonly CanonicalValue[]
  | { readonly [key: string]: CanonicalValue };

const numberPrecision = 4;

function normalizeNumber(value: number) {
  if (!Number.isFinite(value)) {
    throw new Error(`Cannot serialize non-finite number: ${value}`);
  }

  const normalized = Number(value.toFixed(numberPrecision));
  return Object.is(normalized, -0) ? 0 : normalized;
}

export function canonicalize(value: unknown): CanonicalValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return normalizeNumber(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }

  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));

    return Object.fromEntries(entries.map(([key, entryValue]) => [key, canonicalize(entryValue)]));
  }

  throw new Error(`Cannot serialize value of type ${typeof value}`);
}

export function serializeCanonical(value: unknown) {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

export function serializeDesign(design: DesignFile) {
  assertValidDesign(design);
  return serializeCanonical(design);
}
