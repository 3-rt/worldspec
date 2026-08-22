import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

vi.mock("@/components/world-viewer", () => ({
  WorldViewer: () => <div aria-label="Interactive generated world" />,
}));

import Home from "./page";

afterEach(() => {
  vi.unstubAllEnvs();
});

test("introduces WorldSpec as spatial QA rather than world generation", () => {
  render(<Home />);

  expect(
    screen.getByRole("heading", { level: 1, name: "WorldSpec" }),
  ).toBeVisible();
  expect(screen.getByText("Prove the world works.")).toBeVisible();
  expect(screen.getByRole("main")).toHaveAccessibleName(
    "WorldSpec analysis workspace",
  );
});

test("does not offer generation on a production deployment by default", () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("WORLDLABS_GENERATION_ENABLED", "");

  render(<Home />);

  expect(screen.queryByText("Generate another world")).not.toBeInTheDocument();
});
