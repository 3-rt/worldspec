import { useEffect } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import type { AnalysisReport } from "@/features/analysis/schemas";
import { normalizeWorld } from "@/lib/worldlabs/normalize";
import type { WorldOperation } from "@/lib/worldlabs/schemas";
import { worldResponseFixture } from "@/test/fixtures/worldlabs";

import {
  type WorkspaceViewerProps,
  Workspace,
} from "./workspace";

function FakeViewer({
  assets,
  anchors,
  interactionMode,
  onColliderReady,
  onPointSelected,
}: WorkspaceViewerProps) {
  useEffect(() => {
    onColliderReady?.({ meshes: [] });
  }, [onColliderReady]);

  return (
    <div aria-label="Test spatial viewer">
      <span>World: {assets?.displayName ?? "Synthetic"}</span>
      <span>Anchors: {anchors?.start && anchors.goal ? "yes" : "no"}</span>
      <span>Mode: {interactionMode}</span>
      {interactionMode === "place-start" ? (
        <button
          type="button"
          onClick={() =>
            onPointSelected?.({
              mode: "place-start",
              point: { x: -2, y: 0, z: 0 },
            })
          }
        >
          Place test entrance
        </button>
      ) : null}
      {interactionMode === "place-goal" ? (
        <button
          type="button"
          onClick={() =>
            onPointSelected?.({
              mode: "place-goal",
              point: { x: 2, y: 0, z: 0 },
            })
          }
        >
          Place test destination
        </button>
      ) : null}
    </div>
  );
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

async function placeEndpoints(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Set entrance" }));
  expect(screen.getByRole("status")).toHaveTextContent(
    "Click a walkable surface to place the entrance",
  );
  await user.click(
    screen.getByRole("button", { name: "Place test entrance" }),
  );
  await user.click(screen.getByRole("button", { name: "Set destination" }));
  await user.click(
    screen.getByRole("button", { name: "Place test destination" }),
  );
}

const passingReport: AnalysisReport = {
  status: "pass",
  path: [
    { x: -2, y: 0, z: 0 },
    { x: 3, y: 0, z: 0 },
  ],
  routeLengthMeters: 5,
  minimumClearanceMeters: 1.4,
  failures: [],
  elapsedMs: 32,
};

const failingReport: AnalysisReport = {
  status: "fail",
  path: [
    { x: -2, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
  ],
  routeLengthMeters: 2,
  minimumClearanceMeters: 0.6,
  failures: [
    {
      kind: "clearance",
      message: "The route narrows below the required width.",
      location: { x: 0, y: 0, z: 0 },
      measuredValue: 0.6,
      requiredValue: 0.7,
    },
  ],
  elapsedMs: 28,
};

describe("Workspace", () => {
  test("keeps the prepared demo but hides unavailable generation", () => {
    const preparedWorld = normalizeWorld(worldResponseFixture.world);

    render(
      <Workspace
        initialAssets={preparedWorld}
        ViewerComponent={FakeViewer}
        generationEnabled={false}
      />,
    );

    expect(screen.getByText("World: Threshold Courtyard")).toBeVisible();
    expect(screen.queryByText("Generate another world")).not.toBeInTheDocument();
  });

  test("loads the prepared Marble world into the inspection flow", async () => {
    const world = normalizeWorld(worldResponseFixture.world);

    render(
      <Workspace
        ViewerComponent={FakeViewer}
        loadDemo={async () => world}
      />,
    );

    expect(screen.getByText("Resolving prepared demo")).toBeVisible();
    expect(await screen.findByText("Threshold Courtyard")).toBeVisible();
    expect(screen.getByText("World: Threshold Courtyard")).toBeVisible();
  });

  test("keeps the prepared demo visible while generating a new world", async () => {
    const user = userEvent.setup();
    const preparedWorld = normalizeWorld(worldResponseFixture.world);
    const generatedWorld = {
      ...preparedWorld,
      worldId: "world-456",
      displayName: "Generated Passage",
    };
    let finishGeneration!: (operation: WorldOperation) => void;
    const generation = new Promise<WorldOperation>((resolve) => {
      finishGeneration = resolve;
    });

    render(
      <Workspace
        initialAssets={preparedWorld}
        ViewerComponent={FakeViewer}
        generate={async (_input, options) => {
          options?.onProgress?.({
            operationId: "operation-456",
            done: false,
            status: "IN_PROGRESS",
            description: "World generation in progress",
            worldId: "world-456",
            error: null,
            world: null,
          });
          return generation;
        }}
      />,
    );

    await user.click(screen.getByText("Generate another world"));
    await user.click(
      screen.getByRole("button", { name: "Generate with Marble" }),
    );

    expect(screen.getByText("World: Threshold Courtyard")).toBeVisible();
    expect(screen.getByText("World generation in progress")).toBeVisible();

    finishGeneration({
      operationId: "operation-456",
      done: true,
      status: "SUCCEEDED",
      description: "World generation completed successfully",
      worldId: "world-456",
      error: null,
      world: generatedWorld,
    });

    expect(await screen.findByText("World: Generated Passage")).toBeVisible();
  });

  test("loads the verified route for a reliable prepared-world demo", async () => {
    const user = userEvent.setup();
    const world = {
      ...normalizeWorld(worldResponseFixture.world),
      worldId: "90307e9c-afa8-47f9-9182-68ff5846378f",
    };

    render(<Workspace initialAssets={world} ViewerComponent={FakeViewer} />);

    await user.click(
      screen.getByRole("button", { name: "Load verified route" }),
    );

    expect(screen.getByText("Anchors: yes")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Run spatial test" }),
    ).toBeEnabled();
    expect(screen.getByText("6.3 m proof route")).toBeVisible();
  });

  test("guides endpoint placement and presents passing evidence", async () => {
    const user = userEvent.setup();
    render(
      <Workspace
        initialAssets={null}
        ViewerComponent={FakeViewer}
        analyze={async () => passingReport}
      />,
    );

    expect(
      screen.getByRole("textbox", { name: "Movement requirement" }),
    ).toHaveValue(
      "A player who is 1.8 m tall and 0.7 m wide must travel from the entrance to the platform without jumping.",
    );

    await placeEndpoints(user);

    const runButton = screen.getByRole("button", {
      name: "Run spatial test",
    });
    expect(runButton).toBeEnabled();
    await user.click(runButton);

    expect(await screen.findByText("Contract verified")).toBeVisible();
    expect(screen.getByText("5.0 m")).toBeVisible();
    expect(screen.getByText("1.40 m")).toBeVisible();
  });

  test("presents measured and required widths for a failure", async () => {
    const user = userEvent.setup();
    render(
      <Workspace
        initialAssets={null}
        ViewerComponent={FakeViewer}
        analyze={async () => failingReport}
      />,
    );

    await placeEndpoints(user);
    await user.click(
      screen.getByRole("button", { name: "Run spatial test" }),
    );

    expect(await screen.findByText("Clearance fails")).toBeVisible();
    expect(screen.getByText("0.60 m measured")).toBeVisible();
    expect(screen.getByText("0.70 m required")).toBeVisible();
  });

  test("discards an analysis completed after the requirement changes", async () => {
    const user = userEvent.setup();
    const analysis = createDeferred<AnalysisReport>();

    render(
      <Workspace
        initialAssets={null}
        ViewerComponent={FakeViewer}
        analyze={() => analysis.promise}
      />,
    );

    await placeEndpoints(user);
    await user.click(
      screen.getByRole("button", { name: "Run spatial test" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Movement requirement" }),
      " The route must also support a scout.",
    );

    await act(async () => {
      analysis.resolve(passingReport);
      await analysis.promise;
    });

    expect(screen.getByText("Awaiting a route")).toBeVisible();
    expect(screen.queryByText("Contract verified")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Run spatial test" }),
    ).toBeEnabled();
  });

  test("discards an analysis completed after the active world changes", async () => {
    const user = userEvent.setup();
    const analysis = createDeferred<AnalysisReport>();
    const preparedWorld = {
      ...normalizeWorld(worldResponseFixture.world),
      worldId: "90307e9c-afa8-47f9-9182-68ff5846378f",
    };
    const generatedWorld = {
      ...preparedWorld,
      worldId: "world-456",
      displayName: "Generated Passage",
    };

    render(
      <Workspace
        initialAssets={preparedWorld}
        ViewerComponent={FakeViewer}
        analyze={() => analysis.promise}
        generate={async () => ({
          operationId: "operation-456",
          done: true,
          status: "SUCCEEDED",
          description: "World generation completed successfully",
          worldId: "world-456",
          error: null,
          world: generatedWorld,
        })}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Load verified route" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Run spatial test" }),
    );
    await user.click(screen.getByText("Generate another world"));
    await user.click(
      screen.getByRole("button", { name: "Generate with Marble" }),
    );
    expect(await screen.findByText("World: Generated Passage")).toBeVisible();

    await act(async () => {
      analysis.resolve(passingReport);
      await analysis.promise;
    });

    expect(screen.getByText("Awaiting a route")).toBeVisible();
    expect(screen.queryByText("Contract verified")).not.toBeInTheDocument();
  });
});
