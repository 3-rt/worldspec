import { render, screen, waitFor } from "@testing-library/react";
import { expect, test } from "vitest";

import {
  type SceneDriver,
  type SceneDriverFactory,
  WorldViewer,
} from "./world-viewer";

function createDriverFactory(options?: { loadError?: Error }) {
  const modes: string[] = [];
  const anchors: unknown[] = [];
  let disposeCalls = 0;

  const driver: SceneDriver = {
    mount(container) {
      container.append(document.createElement("canvas"));
    },
    async loadWorld() {
      if (options?.loadError) {
        throw options.loadError;
      }
      return { meshes: [] };
    },
    setInteractionMode(mode) {
      modes.push(mode);
    },
    setAnchors(nextAnchors) {
      anchors.push(nextAnchors);
    },
    setColliderVisible() {},
    setOverlay() {},
    dispose() {
      disposeCalls += 1;
    },
  };

  const factory: SceneDriverFactory = () => driver;
  return {
    factory,
    modes,
    anchors,
    get disposeCalls() {
      return disposeCalls;
    },
  };
}

test("owns one scene driver across interaction updates and disposes it", async () => {
  const recorded = createDriverFactory();
  const { container, rerender, unmount } = render(
    <WorldViewer
      assets={null}
      interactionMode="inspect"
      driverFactory={recorded.factory}
    />,
  );

  expect(screen.getByRole("status")).toHaveTextContent("Loading spatial scene");
  expect(await screen.findByText("Scene ready")).toBeVisible();
  expect(container.querySelectorAll("canvas")).toHaveLength(1);

  rerender(
    <WorldViewer
      assets={null}
      interactionMode="place-start"
      anchors={{
        start: { x: -2, y: 0, z: 0 },
        goal: { x: 2, y: 0, z: 0 },
      }}
      driverFactory={recorded.factory}
    />,
  );

  await waitFor(() => {
    expect(recorded.modes.at(-1)).toBe("place-start");
  });
  expect(container.querySelectorAll("canvas")).toHaveLength(1);
  expect(recorded.anchors.at(-1)).toEqual({
    start: { x: -2, y: 0, z: 0 },
    goal: { x: 2, y: 0, z: 0 },
  });

  unmount();
  expect(recorded.disposeCalls).toBe(1);
});

test("reports scene-loading failures without leaving a blank canvas", async () => {
  const recorded = createDriverFactory({
    loadError: new Error("Collider download failed"),
  });

  render(
    <WorldViewer
      assets={null}
      interactionMode="inspect"
      driverFactory={recorded.factory}
    />,
  );

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Collider download failed",
  );
});

test("reports an unavailable WebGL driver instead of crashing the workspace", async () => {
  const unavailableFactory: SceneDriverFactory = () => {
    throw new Error("WebGL2 is unavailable");
  };

  render(
    <WorldViewer
      assets={null}
      interactionMode="inspect"
      driverFactory={unavailableFactory}
    />,
  );

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "WebGL2 is unavailable",
  );
});
