import type { AnalysisFailure, AnalysisReport } from "./schemas";

export type ReportSummary = {
  title: string;
  detail: string;
  tone: "pass" | "fail";
};

function summarizeFailure(failure: AnalysisFailure): ReportSummary {
  if (
    failure.kind === "clearance" &&
    failure.measuredValue !== undefined &&
    failure.requiredValue !== undefined
  ) {
    return {
      title: "Clearance fails",
      detail: `Measured ${failure.measuredValue.toFixed(2)} m at the narrowest point; the contract requires ${failure.requiredValue.toFixed(2)} m.`,
      tone: "fail",
    };
  }

  const titles: Record<AnalysisFailure["kind"], string> = {
    "invalid-start": "Entrance is invalid",
    "invalid-goal": "Destination is invalid",
    unreachable: "Route disconnected",
    clearance: "Clearance fails",
    alignment: "World alignment unverified",
  };

  return {
    title: titles[failure.kind],
    detail: failure.message,
    tone: "fail",
  };
}

export function summarizeReport(report: AnalysisReport): ReportSummary {
  const firstFailure = report.failures[0];
  if (firstFailure) {
    return summarizeFailure(firstFailure);
  }

  if (report.status === "fail") {
    return {
      title: "Contract not verified",
      detail: "The spatial test did not produce a valid route.",
      tone: "fail",
    };
  }

  return {
    title: "Contract verified",
    detail: `A ${report.routeLengthMeters.toFixed(1)} m traversable route satisfies the current profile.`,
    tone: "pass",
  };
}
