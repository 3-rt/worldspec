import type { ChangeEvent } from "react";

import { summarizeReport } from "@/features/analysis/report-copy";
import type {
  AgentProfile,
  AnalysisReport,
} from "@/features/analysis/schemas";

type AnalysisPanelProps = {
  requirement: string;
  agent: AgentProfile;
  minimumClearanceMeters: number;
  canRun: boolean;
  isAnalyzing: boolean;
  onRequirementChange(value: string): void;
  onMetricChange(
    field: "height" | "width" | "slope" | "step",
    value: number,
  ): void;
  onRun(): void;
};

type MetricFieldProps = {
  label: string;
  value: number;
  step: number;
  min: number;
  max: number;
  unit: string;
  onChange(value: number): void;
};

function MetricField({
  label,
  value,
  step,
  min,
  max,
  unit,
  onChange,
}: MetricFieldProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = event.currentTarget.valueAsNumber;
    if (Number.isFinite(nextValue)) {
      onChange(nextValue);
    }
  }

  return (
    <label className="metric-field">
      <span>{label}</span>
      <span className="metric-input-wrap">
        <input
          aria-label={`${label} (${unit})`}
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={handleChange}
        />
        <small>{unit}</small>
      </span>
    </label>
  );
}

export function AnalysisPanel({
  requirement,
  agent,
  minimumClearanceMeters,
  canRun,
  isAnalyzing,
  onRequirementChange,
  onMetricChange,
  onRun,
}: AnalysisPanelProps) {
  return (
    <section className="rail-section contract-section" aria-labelledby="contract-title">
      <div className="section-index">02 / Contract</div>
      <h2 id="contract-title">Movement requirement</h2>
      <label className="requirement-field">
        <span className="sr-only">Movement requirement</span>
        <textarea
          aria-label="Movement requirement"
          value={requirement}
          onChange={(event) => onRequirementChange(event.currentTarget.value)}
          rows={5}
        />
      </label>

      <div className="metric-grid" aria-label="Avatar dimensions">
        <MetricField
          label="Height"
          value={agent.heightMeters}
          min={0.2}
          max={5}
          step={0.05}
          unit="m"
          onChange={(value) => onMetricChange("height", value)}
        />
        <MetricField
          label="Width"
          value={minimumClearanceMeters}
          min={0.1}
          max={5}
          step={0.05}
          unit="m"
          onChange={(value) => onMetricChange("width", value)}
        />
        <MetricField
          label="Max slope"
          value={agent.maxSlopeDegrees}
          min={0}
          max={89}
          step={1}
          unit="deg"
          onChange={(value) => onMetricChange("slope", value)}
        />
        <MetricField
          label="Step"
          value={agent.stepHeightMeters}
          min={0}
          max={2}
          step={0.05}
          unit="m"
          onChange={(value) => onMetricChange("step", value)}
        />
      </div>

      <button
        type="button"
        className="run-test-button"
        onClick={onRun}
        disabled={!canRun || isAnalyzing}
      >
        <span>{isAnalyzing ? "Analyzing geometry" : "Run spatial test"}</span>
        <span aria-hidden="true">↗</span>
      </button>
    </section>
  );
}

type EvidenceLedgerProps = {
  report: AnalysisReport | null;
  error: string | null;
  isAnalyzing: boolean;
};

export function EvidenceLedger({
  report,
  error,
  isAnalyzing,
}: EvidenceLedgerProps) {
  const summary = report ? summarizeReport(report) : null;
  const clearanceFailure = report?.failures.find(
    (failure) => failure.kind === "clearance",
  );

  return (
    <aside
      className={`evidence-ledger ${summary ? `is-${summary.tone}` : ""}`}
      aria-labelledby="evidence-title"
    >
      <div className="section-index">03 / Evidence</div>
      {isAnalyzing ? (
        <div className="evidence-pending">
          <span className="evidence-spinner" aria-hidden="true" />
          <h2 id="evidence-title">Reading the collider</h2>
          <p>Building walkable regions and sampling the route envelope.</p>
        </div>
      ) : error ? (
        <div className="evidence-empty is-error" role="alert">
          <h2 id="evidence-title">Analysis interrupted</h2>
          <p>{error}</p>
        </div>
      ) : summary && report ? (
        <div className="evidence-result" aria-live="polite">
          <div className="result-kicker">
            <span aria-hidden="true">{summary.tone === "pass" ? "✓" : "!"}</span>
            <span>{summary.tone === "pass" ? "Pass" : "Action required"}</span>
          </div>
          <h2 id="evidence-title">{summary.title}</h2>
          <p>{summary.detail}</p>

          <dl className="evidence-metrics">
            <div>
              <dt>Route</dt>
              <dd>{report.routeLengthMeters.toFixed(1)} m</dd>
            </div>
            {report.minimumClearanceMeters !== undefined ? (
              <div>
                <dt>Minimum clear</dt>
                <dd>{report.minimumClearanceMeters.toFixed(2)} m</dd>
              </div>
            ) : null}
            <div>
              <dt>Compute</dt>
              <dd>{Math.round(report.elapsedMs)} ms</dd>
            </div>
          </dl>

          {clearanceFailure?.measuredValue !== undefined &&
          clearanceFailure.requiredValue !== undefined ? (
            <div className="clearance-comparison">
              <span>{clearanceFailure.measuredValue.toFixed(2)} m measured</span>
              <span>{clearanceFailure.requiredValue.toFixed(2)} m required</span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="evidence-empty">
          <span className="empty-glyph" aria-hidden="true">
            ⌁
          </span>
          <h2 id="evidence-title">Awaiting a route</h2>
          <p>
            Place an entrance and destination. WorldSpec will show what works
            and where it fails.
          </p>
        </div>
      )}
    </aside>
  );
}
