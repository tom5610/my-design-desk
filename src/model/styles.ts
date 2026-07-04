import type { StyleId } from "./ids";

export type ColorValue = `#${string}` | `rgb(${string})` | `rgba(${string})`;

export type GradientStop = {
  offset: number;
  color: ColorValue;
};

export type Fill =
  | {
      kind: "solid";
      color: ColorValue;
    }
  | {
      kind: "linearGradient";
      from: { x: number; y: number };
      to: { x: number; y: number };
      stops: readonly GradientStop[];
    };

export type Stroke = {
  color: ColorValue;
  width: number;
};

export type Shadow = {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: ColorValue;
};

export type TextStyle = {
  id: StyleId;
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  color: ColorValue;
};

export type ColorStyle = {
  id: StyleId;
  name: string;
  value: ColorValue;
};

export type NodeStyle = {
  fills: readonly Fill[];
  stroke?: Stroke;
  radius?: number;
  opacity: number;
  shadows: readonly Shadow[];
};

export type StyleTokens = {
  colors: Record<StyleId, ColorStyle>;
  text: Record<StyleId, TextStyle>;
};

export const emptyStyleTokens: StyleTokens = {
  colors: {},
  text: {},
};

export const defaultNodeStyle: NodeStyle = {
  fills: [{ kind: "solid", color: "#ffffff" }],
  opacity: 1,
  shadows: [],
};
