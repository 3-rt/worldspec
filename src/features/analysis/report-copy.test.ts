import { describe, expect, test } from "vitest";

import { summarizeReport } from "./report-copy";
import type { AnalysisReport } from "./schemas";

describe("summarizeReport", () => {
  test("explains a clearance failure using measured and required evidence", () => {
    const report: AnalysisReport = {
      status: "fail",
      path: [
        { x: 0, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
      ],
      routeLengthMeters: 2,
      minimumClearanceMeters: 0.42,
      failures: [
        {
          kind: "clearance",
          message: "The maintenance passage is too narrow.",
          location: { x: 1.2, y: 0, z: 0 },
          measuredValue: 0.42,
          requiredValue: 0.7,
        },
      ],
      elapsedMs: 18,
    };

    const summary = summarizeReport(report);

    expect(summary.title).toBe("Clearance fails");
    expect(summary.tone).toBe("fail");
    expect(summary.detail).toContain("0.42 m");
    expect(summary.detail).toContain("0.70 m");
  });

  test("describes a passing route with its measured length", () => {
    const report: AnalysisReport = {
      status: "pass",
      path: [
        { x: 0, y: 0, z: 0 },
        { x: 12.4, y: 0, z: 0 },
      ],
      routeLengthMeters: 12.4,
      minimumClearanceMeters: 1.1,
      failures: [],
      elapsedMs: 9,
    };

    expect(summarizeReport(report)).toEqual({
      title: "Contract verified",
      detail: "A 12.4 m traversable route satisfies the current profile.",
      tone: "pass",
    });
  });

  test("never calls a report successful when failures are present", () => {
    const inconsistentReport: AnalysisReport = {
      status: "pass",
      path: [],
      routeLengthMeters: 0,
      failures: [
        {
          kind: "unreachable",
          message: "No connected route reaches the destination.",
        },
      ],
      elapsedMs: 4,
    };

    expect(summarizeReport(inconsistentReport)).toEqual({
      title: "Route disconnected",
      detail: "No connected route reaches the destination.",
      tone: "fail",
    });
  });
});
