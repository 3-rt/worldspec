import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { normalizeWorld } from "@/lib/worldlabs/normalize";
import { worldResponseFixture } from "@/test/fixtures/worldlabs";

import { GenerationPanel } from "./generation-panel";

describe("GenerationPanel", () => {
  test("identifies the selected full-resolution Marble visual", () => {
    render(<GenerationPanel assets={normalizeWorld(worldResponseFixture.world)} />);

    expect(screen.getByText("SPZ Full")).toBeVisible();
  });

  test("identifies the interactive fallback visual", () => {
    const assets = normalizeWorld({
      ...worldResponseFixture.world,
      assets: {
        ...worldResponseFixture.world.assets,
        splats: {
          ...worldResponseFixture.world.assets.splats,
          spz_urls: {
            ...worldResponseFixture.world.assets.splats.spz_urls,
            full_res: "",
          },
        },
      },
    });

    render(<GenerationPanel assets={assets} />);

    expect(screen.getByText("SPZ 500K")).toBeVisible();
  });
});
