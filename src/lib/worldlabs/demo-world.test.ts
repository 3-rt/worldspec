import { describe, expect, test, vi } from "vitest";

import { worldResponseFixture } from "@/test/fixtures/worldlabs";

import { WorldLabsError } from "./errors";
import { normalizeWorld } from "./normalize";
import { resolveDemoWorld } from "./demo-world";

describe("resolveDemoWorld", () => {
  test("rejects an unconfigured demo before contacting World Labs", async () => {
    const getWorld = vi.fn();

    await expect(resolveDemoWorld("   ", { getWorld })).rejects.toMatchObject({
      code: "demo-not-configured",
      status: 503,
    } satisfies Partial<WorldLabsError>);
    expect(getWorld).not.toHaveBeenCalled();
  });

  test("resolves fresh assets by world ID", async () => {
    const world = normalizeWorld(worldResponseFixture.world);
    const getWorld = vi.fn(async () => world);

    await expect(resolveDemoWorld(" world-123 ", { getWorld })).resolves.toEqual(
      world,
    );
    expect(getWorld).toHaveBeenCalledWith("world-123");
  });
});
