import type { Vec3 } from "@/features/analysis/schemas";
import type { InteractionMode } from "@/features/viewer/scene-controller";

type SceneToolbarProps = {
  interactionMode: InteractionMode;
  start: Vec3 | null;
  goal: Vec3 | null;
  colliderVisible: boolean;
  isAnalyzing: boolean;
  verifiedRouteLength?: number;
  onSetStart(): void;
  onSetGoal(): void;
  onToggleCollider(): void;
  onLoadVerifiedRoute?(): void;
};

function pointLabel(point: Vec3 | null): string {
  return point
    ? `${point.x.toFixed(1)} / ${point.y.toFixed(1)} / ${point.z.toFixed(1)}`
    : "Not placed";
}

export function SceneToolbar({
  interactionMode,
  start,
  goal,
  colliderVisible,
  isAnalyzing,
  verifiedRouteLength,
  onSetStart,
  onSetGoal,
  onToggleCollider,
  onLoadVerifiedRoute,
}: SceneToolbarProps) {
  const instruction = isAnalyzing
    ? "Testing the route against collider geometry."
    : interactionMode === "place-start"
      ? "Click a walkable surface to place the entrance."
      : interactionMode === "place-goal"
        ? "Click a walkable surface to place the destination."
        : "Orbit to inspect. Place both route anchors to begin.";

  return (
    <div className="scene-toolbar">
      <div className="placement-status" role="status" aria-live="polite">
        <span className="placement-crosshair" aria-hidden="true">
          +
        </span>
        <span>{instruction}</span>
      </div>

      <div
        className={`scene-actions ${onLoadVerifiedRoute ? "has-verified-route" : ""}`}
        aria-label="Scene controls"
      >
        <button
          type="button"
          aria-label="Set entrance"
          className={interactionMode === "place-start" ? "is-active" : ""}
          onClick={onSetStart}
          disabled={isAnalyzing}
        >
          <span>Set entrance</span>
          <small>{pointLabel(start)}</small>
        </button>
        <button
          type="button"
          aria-label="Set destination"
          className={interactionMode === "place-goal" ? "is-active" : ""}
          onClick={onSetGoal}
          disabled={isAnalyzing}
        >
          <span>Set destination</span>
          <small>{pointLabel(goal)}</small>
        </button>
        <button
          type="button"
          aria-label="Toggle collider"
          className="collider-toggle"
          aria-pressed={colliderVisible}
          onClick={onToggleCollider}
        >
          <span>Collider</span>
          <small>{colliderVisible ? "Visible" : "Hidden"}</small>
        </button>
        {onLoadVerifiedRoute && verifiedRouteLength ? (
          <button
            type="button"
            className="verified-route"
            aria-label="Load verified route"
            onClick={onLoadVerifiedRoute}
            disabled={isAnalyzing}
          >
            <span>Load proof route</span>
            <small>{verifiedRouteLength.toFixed(1)} m proof route</small>
          </button>
        ) : null}
      </div>
    </div>
  );
}
