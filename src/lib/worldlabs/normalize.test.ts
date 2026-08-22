import { describe, expect, test } from "vitest";

import { worldResponseFixture } from "@/test/fixtures/worldlabs";

import { normalizeWorld } from "./normalize";

describe("normalizeWorld", () => {
  test("selects analysis-ready assets and retains safe world metadata", () => {
    expect(normalizeWorld(worldResponseFixture.world)).toEqual({
      worldId: "world-123",
      displayName: "Threshold Courtyard",
      caption:
        "An orbital greenhouse with connected paths and a narrow maintenance passage.",
      marbleUrl: "https://marble.worldlabs.ai/world/world-123",
      thumbnailUrl: "https://assets.example.test/world-123-thumbnail.webp",
      splatUrl: "https://assets.example.test/world-123-full.spz",
      availableSplats: {
        preview: "https://assets.example.test/world-123-100k.spz",
        interactive: "https://assets.example.test/world-123-500k.spz",
        full: "https://assets.example.test/world-123-full.spz",
      },
      colliderGlbUrl: "https://assets.example.test/world-123-collider.glb",
      metricScaleFactor: 1.25,
      groundPlaneOffset: 0.4,
      prompt: "An orbital greenhouse with a narrow passage.",
      model: "marble-1.1",
    });
  });

  test("falls back to the interactive SPZ when full resolution is unavailable", () => {
    const response = {
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
    };

    expect(normalizeWorld(response)).toMatchObject({
      splatUrl: "https://assets.example.test/world-123-500k.spz",
      availableSplats: {
        interactive: "https://assets.example.test/world-123-500k.spz",
        full: null,
      },
    });
  });

  test("rejects a world without a full or interactive SPZ asset", () => {
    const response = {
      ...worldResponseFixture.world,
      assets: {
        ...worldResponseFixture.world.assets,
        splats: {
          ...worldResponseFixture.world.assets.splats,
          spz_urls: {
            ...worldResponseFixture.world.assets.splats.spz_urls,
            "500k": "",
            full_res: "",
          },
        },
      },
    };

    expect(() => normalizeWorld(response)).toThrow(
      "World assets are incomplete",
    );
  });

  test("rejects a world without a collider mesh", () => {
    const response = {
      ...worldResponseFixture.world,
      assets: {
        ...worldResponseFixture.world.assets,
        mesh: {
          ...worldResponseFixture.world.assets.mesh,
          collider_mesh_url: "",
        },
      },
    };

    expect(() => normalizeWorld(response)).toThrow(
      "World assets are incomplete",
    );
  });
});
