import { expect, test } from "@playwright/test";

test("proves the prepared Marble route through the visible workflow", async ({
  page,
  request,
}) => {
  const demoResponse = await request.get("/api/worlds/demo");
  test.skip(
    !demoResponse.ok(),
    "DEMO_WORLD_ID and World Labs access are required for the live journey.",
  );

  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "WorldSpec" }),
  ).toBeVisible();
  await expect(page.locator("canvas[data-worldspec-viewer='true']")).toHaveCount(
    1,
  );
  await expect(page.getByText("Scene ready")).toBeVisible({ timeout: 120_000 });
  await expect(page.getByRole("link", { name: "Open in Marble" })).toBeVisible();

  await page.getByRole("button", { name: "Load verified route" }).click();
  await expect(
    page.getByRole("button", { name: "Run spatial test" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Run spatial test" }).click();

  await expect(page.getByText("Contract verified")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("6.3 m")).toBeVisible();
  await page.screenshot({
    path: "test-results/worldspec-pass.png",
    fullPage: true,
  });
});
