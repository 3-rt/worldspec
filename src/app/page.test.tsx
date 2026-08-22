import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("@/components/world-viewer", () => ({
  WorldViewer: () => <div aria-label="Interactive generated world" />,
}));

import Home from "./page";

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
