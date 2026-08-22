"use client";

import { useEffect, useRef, useState } from "react";

import type { WorldAssets } from "@/lib/worldlabs/schemas";
import {
  type ColliderSceneData,
  createSceneController,
  type InteractionMode,
  type SceneDriver,
  type SceneDriverFactory,
  type SceneOverlay,
  type SelectionEvent,
} from "@/features/viewer/scene-controller";

export type {
  ColliderSceneData,
  InteractionMode,
  SceneDriver,
  SceneDriverFactory,
  SceneOverlay,
  SelectionEvent,
};

type WorldViewerProps = {
  assets: WorldAssets | null;
  interactionMode: InteractionMode;
  colliderVisible?: boolean;
  overlay?: SceneOverlay | null;
  onPointSelected?: (event: SelectionEvent) => void;
  onColliderReady?: (data: ColliderSceneData) => void;
  driverFactory?: SceneDriverFactory;
};

type ViewerStatus =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "error"; message: string };

export function WorldViewer({
  assets,
  interactionMode,
  colliderVisible = true,
  overlay = null,
  onPointSelected,
  onColliderReady,
  driverFactory = createSceneController,
}: WorldViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const driverRef = useRef<SceneDriver | null>(null);
  const onPointSelectedRef = useRef(onPointSelected);
  const onColliderReadyRef = useRef(onColliderReady);
  const [status, setStatus] = useState<ViewerStatus>({ kind: "loading" });

  useEffect(() => {
    onPointSelectedRef.current = onPointSelected;
  }, [onPointSelected]);

  useEffect(() => {
    onColliderReadyRef.current = onColliderReady;
  }, [onColliderReady]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const driver = driverFactory({
      onPointSelected: (event) => onPointSelectedRef.current?.(event),
    });

    try {
      driver.mount(container);
      driverRef.current = driver;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "This browser could not start the 3D viewer.";
      queueMicrotask(() => {
        setStatus({ kind: "error", message });
      });
    }

    return () => {
      driverRef.current = null;
      driver.dispose();
    };
  }, [driverFactory]);

  useEffect(() => {
    const driver = driverRef.current;
    if (!driver) {
      return;
    }
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setStatus({ kind: "loading" });
      }
    });

    void driver
      .loadWorld(assets)
      .then((collider) => {
        if (!active) {
          return;
        }
        onColliderReadyRef.current?.(collider);
        setStatus({ kind: "ready" });
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        setStatus({
          kind: "error",
          message:
            error instanceof Error
              ? error.message
              : "The spatial scene could not be loaded.",
        });
      });

    return () => {
      active = false;
    };
  }, [assets, driverFactory]);

  useEffect(() => {
    driverRef.current?.setInteractionMode(interactionMode);
  }, [interactionMode]);

  useEffect(() => {
    driverRef.current?.setColliderVisible(colliderVisible);
  }, [colliderVisible]);

  useEffect(() => {
    driverRef.current?.setOverlay(overlay);
  }, [overlay]);

  return (
    <div className="world-viewer" data-status={status.kind}>
      <div
        ref={containerRef}
        className="world-viewer-canvas"
        aria-label="Interactive generated world"
      />
      <div className="world-viewer-status">
        {status.kind === "loading" ? (
          <span role="status">Loading spatial scene</span>
        ) : null}
        {status.kind === "ready" ? <span role="status">Scene ready</span> : null}
        {status.kind === "error" ? (
          <span role="alert">{status.message}</span>
        ) : null}
      </div>
    </div>
  );
}
