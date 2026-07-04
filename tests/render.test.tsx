import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { createStarterDesign } from "../src/demo";
import { SvgScene } from "../src/render";

describe("SVG scene renderer", () => {
  it("renders the starter design with stable node selectors", () => {
    const markup = renderToStaticMarkup(<svg><SvgScene design={createStarterDesign()} /></svg>);

    expect(markup).toMatchSnapshot();
    expect(markup).toContain('data-node-kind="Frame"');
    expect(markup).toContain('data-node-name="Hero headline"');
    expect(markup).toContain("Prototype, replay, and export deterministic design ops.");
  });
});
