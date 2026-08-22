import { describe, expect, test } from "vitest";

import { getDemoScenario } from "./demo-scenario";

describe("getDemoScenario", () => {
  test("returns the verified route and contrasting profiles for the prepared world", () => {
    const scenario = getDemoScenario(
      "90307e9c-afa8-47f9-9182-68ff5846378f",
    );

    expect(scenario).toMatchObject({
      route: {
        expectedLengthMeters: 6.3,
      },
      profiles: [
        { label: "Explorer", widthMeters: 0.7, expected: "pass" },
        { label: "Rescue bot", widthMeters: 1.4, expected: "fail" },
      ],
    });
  });

  test("does not apply coordinates to another world", () => {
    expect(getDemoScenario("another-world")).toBeNull();
  });
});
