"use client";

import {
  type ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { analyzeWorld, type AnalyzeWorldInput } from "@/features/analysis/analyze-world";
import { compileRequirement } from "@/features/analysis/requirement-parser";
import {
  type AnalysisReport,
  defaultAgentProfile,
  type WorldContract,
} from "@/features/analysis/schemas";
import type { ColliderSceneData } from "@/features/viewer/scene-controller";
import { getDemoScenario } from "@/features/demo/demo-scenario";
import type { WorldAssets } from "@/lib/worldlabs/schemas";
import {
  fetchPreparedWorld,
  generateAndPollWorld,
} from "@/lib/worldlabs/browser";

import { AnalysisPanel, EvidenceLedger } from "./analysis-panel";
import { GenerationPanel } from "./generation-panel";
import { SceneToolbar } from "./scene-toolbar";
import {
  type WorldViewerProps,
  WorldViewer,
} from "./world-viewer";

const EXAMPLE_REQUIREMENT =
  "A player who is 1.8 m tall and 0.7 m wide must travel from the entrance to the platform without jumping.";

type WorkspacePhase =
  | "loading-world"
  | "placing-start"
  | "placing-goal"
  | "ready"
  | "analyzing"
  | "pass"
  | "fail";

export type WorkspaceViewerProps = WorldViewerProps;

type WorkspaceProps = {
  initialAssets?: WorldAssets | null;
  ViewerComponent?: ComponentType<WorkspaceViewerProps>;
  analyze?: (input: AnalyzeWorldInput) => Promise<AnalysisReport>;
  loadDemo?: (signal?: AbortSignal) => Promise<WorldAssets>;
  generate?: typeof generateAndPollWorld;
};

const loadPreparedDemo = (signal?: AbortSignal) =>
  fetchPreparedWorld({ signal });

export function Workspace({
  initialAssets,
  ViewerComponent = WorldViewer,
  analyze = analyzeWorld,
  loadDemo = loadPreparedDemo,
  generate = generateAndPollWorld,
}: WorkspaceProps) {
  const [assets, setAssets] = useState<WorldAssets | null>(
    initialAssets ?? null,
  );
  const [sourceMessage, setSourceMessage] = useState(
    initialAssets === undefined ? "Resolving prepared demo" : null,
  );
  const [contract, setContract] = useState<WorldContract>(() =>
    compileRequirement(EXAMPLE_REQUIREMENT, defaultAgentProfile),
  );
  const [interactionMode, setInteractionMode] =
    useState<WorldViewerProps["interactionMode"]>("inspect");
  const [colliderVisible, setColliderVisible] = useState(true);
  const [collider, setCollider] = useState<ColliderSceneData | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<string | null>(
    null,
  );
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [phase, setPhase] = useState<WorkspacePhase>(
    initialAssets === undefined ? "loading-world" : "placing-start",
  );
  const runSequence = useRef(0);
  const generationController = useRef<AbortController | null>(null);

  const handleColliderReady = useCallback((data: ColliderSceneData) => {
    setCollider(data);
    setPhase((current) =>
      current === "loading-world" ? "placing-start" : current,
    );
  }, []);

  useEffect(() => {
    if (initialAssets !== undefined) {
      return;
    }

    const controller = new AbortController();
    void loadDemo(controller.signal)
      .then((world) => {
        setAssets(world);
        setCollider(null);
        setSourceMessage(null);
        setPhase("loading-world");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setSourceMessage("Prepared demo unavailable / calibration scene active");
        setPhase("placing-start");
      });

    return () => controller.abort();
  }, [initialAssets, loadDemo]);

  useEffect(
    () => () => {
      generationController.current?.abort();
    },
    [],
  );

  const handleGenerate = useCallback(
    async (prompt: string) => {
      generationController.current?.abort();
      const controller = new AbortController();
      generationController.current = controller;
      setIsGenerating(true);
      setGenerationError(null);
      setGenerationProgress("Preparing generation request");

      try {
        const operation = await generate(
          { displayName: "WorldSpec Spatial Test", prompt },
          {
            signal: controller.signal,
            onProgress: (progress) =>
              setGenerationProgress(progress.description),
          },
        );
        if (controller.signal.aborted || !operation.world) {
          return;
        }
        setAssets(operation.world);
        setCollider(null);
        setContract((current) => ({ ...current, start: null, goal: null }));
        setReport(null);
        setAnalysisError(null);
        setGenerationProgress("Generated world ready for inspection");
        setPhase("loading-world");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setGenerationError(
          error instanceof Error
            ? error.message
            : "The world could not be generated.",
        );
      } finally {
        if (generationController.current === controller) {
          generationController.current = null;
          setIsGenerating(false);
        }
      }
    },
    [generate],
  );

  const clearResult = useCallback(() => {
    runSequence.current += 1;
    setReport(null);
    setAnalysisError(null);
    setPhase("placing-start");
  }, []);

  const handlePointSelected = useCallback(
    (event: Parameters<NonNullable<WorldViewerProps["onPointSelected"]>>[0]) => {
      setContract((current) => ({
        ...current,
        ...(event.mode === "place-start"
          ? { start: event.point }
          : { goal: event.point }),
      }));
      setInteractionMode("inspect");
      setReport(null);
      setAnalysisError(null);
      setPhase(() => {
        const hasBothPoints =
          event.mode === "place-start"
            ? Boolean(contract.goal)
            : Boolean(contract.start);
        if (hasBothPoints) {
          return "ready";
        }
        return event.mode === "place-start" ? "placing-goal" : "placing-start";
      });
    },
    [contract.goal, contract.start],
  );

  const handleRequirementChange = useCallback((value: string) => {
    setContract((current) => ({
      ...compileRequirement(value, current.agent),
      start: current.start,
      goal: current.goal,
    }));
    setReport(null);
    setAnalysisError(null);
  }, []);

  const handleMetricChange = useCallback(
    (field: "height" | "width" | "slope" | "step", value: number) => {
      setContract((current) => {
        if (field === "width") {
          return {
            ...current,
            minimumClearanceMeters: value,
            agent: { ...current.agent, radiusMeters: value / 2 },
          };
        }
        const fieldMap = {
          height: "heightMeters",
          slope: "maxSlopeDegrees",
          step: "stepHeightMeters",
        } as const;
        return {
          ...current,
          agent: { ...current.agent, [fieldMap[field]]: value },
        };
      });
      setReport(null);
      setAnalysisError(null);
    },
    [],
  );

  const canRun = Boolean(contract.start && contract.goal && collider);
  const isAnalyzing = phase === "analyzing";
  const scenario = useMemo(
    () => (assets ? getDemoScenario(assets.worldId) : null),
    [assets],
  );
  const anchors = useMemo(
    () => ({ start: contract.start, goal: contract.goal }),
    [contract.goal, contract.start],
  );

  const handleLoadVerifiedRoute = useCallback(() => {
    if (!scenario) {
      return;
    }
    const explorer = scenario.profiles[0];
    setContract((current) => ({
      ...current,
      start: scenario.route.start,
      goal: scenario.route.goal,
      minimumClearanceMeters: explorer.widthMeters,
      agent: {
        ...current.agent,
        radiusMeters: explorer.widthMeters / 2,
      },
    }));
    setInteractionMode("inspect");
    setReport(null);
    setAnalysisError(null);
    setPhase("ready");
  }, [scenario]);

  const handleRun = useCallback(async () => {
    if (!contract.start || !contract.goal || !collider) {
      return;
    }
    const thisRun = ++runSequence.current;
    setPhase("analyzing");
    setReport(null);
    setAnalysisError(null);

    try {
      const nextReport = await analyze({
        meshes: collider.meshes,
        contract,
      });
      if (runSequence.current !== thisRun) {
        return;
      }
      setReport(nextReport);
      setPhase(nextReport.status);
    } catch (error) {
      if (runSequence.current !== thisRun) {
        return;
      }
      setAnalysisError(
        error instanceof Error
          ? error.message
          : "The collider could not be analyzed.",
      );
      setPhase("fail");
    }
  }, [analyze, collider, contract]);

  const overlay = useMemo<WorldViewerProps["overlay"]>(() => {
    if (!report || report.path.length < 2) {
      return null;
    }
    return {
      path: report.path,
      tone: report.status,
      failureLocation: report.failures.find((failure) => failure.location)
        ?.location,
    };
  }, [report]);

  return (
    <main
      aria-label="WorldSpec analysis workspace"
      className={`workspace-shell phase-${phase}`}
    >
      <header className="workspace-header">
        <div className="workspace-wordmark">
          <span className="wordmark-mark" aria-hidden="true">
            WS
          </span>
          <div>
            <h1>WorldSpec</h1>
            <p>Prove the world works.</p>
          </div>
        </div>
        <div className="workspace-context">
          <span>Ignition Hacks V7</span>
          <span>World Labs / Spatial QA</span>
        </div>
      </header>

      <div className="workspace-grid">
        <aside className="contract-rail" aria-label="Spatial test contract">
          <GenerationPanel
            assets={assets}
            message={sourceMessage}
            isGenerating={isGenerating}
            generationProgress={generationProgress}
            generationError={generationError}
            onGenerate={handleGenerate}
          />
          <AnalysisPanel
            requirement={contract.sourceText}
            agent={contract.agent}
            minimumClearanceMeters={contract.minimumClearanceMeters}
            canRun={canRun}
            isAnalyzing={isAnalyzing}
            onRequirementChange={handleRequirementChange}
            onMetricChange={handleMetricChange}
            onRun={handleRun}
          />
        </aside>

        <section className="viewport-stage" aria-labelledby="viewport-title">
          <div className="viewport-header">
            <div>
              <span className="section-index">Live / 3D</span>
              <h2 id="viewport-title">Traversability field</h2>
            </div>
            <div className="viewport-coordinates">
              <span>Y up</span>
              <span>Metric</span>
              <span>WebGL2</span>
            </div>
          </div>

          <div className="viewer-frame">
            <ViewerComponent
              assets={assets}
              interactionMode={interactionMode}
              anchors={anchors}
              colliderVisible={colliderVisible}
              overlay={overlay}
              onPointSelected={handlePointSelected}
              onColliderReady={handleColliderReady}
            />
            {isAnalyzing ? <div className="analysis-scan" aria-hidden="true" /> : null}
            <span className="frame-corner frame-corner-tl" aria-hidden="true" />
            <span className="frame-corner frame-corner-br" aria-hidden="true" />
          </div>

          <SceneToolbar
            interactionMode={interactionMode}
            start={contract.start}
            goal={contract.goal}
            colliderVisible={colliderVisible}
            isAnalyzing={isAnalyzing}
            verifiedRouteLength={scenario?.route.expectedLengthMeters}
            onSetStart={() => {
              clearResult();
              setPhase("placing-start");
              setInteractionMode("place-start");
            }}
            onSetGoal={() => {
              clearResult();
              setPhase("placing-goal");
              setInteractionMode("place-goal");
            }}
            onToggleCollider={() => setColliderVisible((visible) => !visible)}
            onLoadVerifiedRoute={
              scenario ? handleLoadVerifiedRoute : undefined
            }
          />
        </section>

        <EvidenceLedger
          report={report}
          error={analysisError}
          isAnalyzing={isAnalyzing}
        />
      </div>

      <footer className="workspace-status-strip">
        <span>
          <i aria-hidden="true" /> Collider pipeline online
        </span>
        <span>{collider ? `${collider.meshes.length} geometry layers` : "Loading geometry"}</span>
        <span>World API / Ready</span>
      </footer>
    </main>
  );
}
