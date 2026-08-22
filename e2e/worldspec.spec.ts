import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

import { worldAssetsSchema } from "@/lib/worldlabs/schemas";

async function reusePreparedDemo(
  page: Page,
  request: APIRequestContext,
) {
  const demoResponse = await request.get("/api/worlds/demo");
  test.skip(
    !demoResponse.ok(),
    "DEMO_WORLD_ID and World Labs access are required for the live journey.",
  );
  const demoWorld = worldAssetsSchema.parse(await demoResponse.json());
  const interactiveWorld = {
    ...demoWorld,
    splatUrl: demoWorld.availableSplats.interactive,
  };
  await page.route("**/api/worlds/demo", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(interactiveWorld),
    }),
  );
}

test("proves the prepared Marble route through the visible workflow", async ({
  page,
  request,
}) => {
  test.setTimeout(360_000);
  await reusePreparedDemo(page, request);

  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "WorldSpec" }),
  ).toBeVisible();
  await expect(page.locator("canvas[data-worldspec-viewer='true']")).toHaveCount(
    1,
    { timeout: 60_000 },
  );
  await expect(page.getByText("WorldSpec Orbital Greenhouse")).toBeVisible({
    timeout: 120_000,
  });
  await expect(page.getByText("1 geometry layers")).toBeVisible({
    timeout: 180_000,
  });
  await expect(page.getByText("Scene ready")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open in Marble" })).toBeVisible();

  await page.getByRole("button", { name: "Load verified route" }).click();
  await expect(
    page.getByRole("button", { name: "Run spatial test" }),
  ).toBeEnabled();

  const requirement = page.getByRole("textbox", {
    name: "Movement requirement",
  });
  await requirement.fill(
    "A service robot that is 1.8 m tall and 1.4 m wide must travel from the entrance to the platform without jumping.",
  );
  await page.getByRole("button", { name: "Run spatial test" }).click();
  await expect(page.getByText("Destination is invalid")).toBeVisible({
    timeout: 60_000,
  });

  await requirement.fill(
    "A player who is 1.8 m tall and 0.7 m wide must travel from the entrance to the platform without jumping.",
  );
  await expect(page.getByText("Destination is invalid")).not.toBeVisible();
  await page.getByRole("button", { name: "Run spatial test" }).click();

  await expect(page.getByText("Contract verified")).toBeVisible({
    timeout: 120_000,
  });
  await expect(page.getByText("6.3 m", { exact: true })).toBeVisible();
  await expect(page.getByText("2.22 m")).toBeVisible();
  await page.screenshot({
    path: "test-results/worldspec-pass.png",
    fullPage: true,
  });
});

test("keeps every scene control readable on a phone viewport", async ({
  page,
  request,
}) => {
  test.setTimeout(180_000);
  await reusePreparedDemo(page, request);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByText("WorldSpec Orbital Greenhouse")).toBeVisible({
    timeout: 120_000,
  });
  const controls = page.locator(".scene-actions button");
  await expect(controls).toHaveCount(4);

  for (const control of await controls.all()) {
    const box = await control.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(150);

    const label = control.locator("span");
    await expect
      .poll(() =>
        label.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      )
      .toBe(true);
  }
});

test("keeps evidence status labels above WCAG AA contrast", async ({ page }) => {
  await page.route("**/api/worlds/demo", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "audit-fixture", message: "Not needed for CSS audit." },
      }),
    }),
  );
  await page.route("https://cdn.marble.worldlabs.ai/**", (route) =>
    route.abort(),
  );
  await page.goto("/");

  const contrastRatios = await page.evaluate(() => {
    const relativeLuminance = (color: string) => {
      const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [];
      const [red = 0, green = 0, blue = 0] = channels.map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    };

    const ratio = (foreground: string, background: string) => {
      const foregroundLuminance = relativeLuminance(foreground);
      const backgroundLuminance = relativeLuminance(background);
      return (
        (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
        (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
      );
    };

    return (["pass", "fail"] as const).map((tone) => {
      const ledger = document.createElement("aside");
      ledger.className = `evidence-ledger is-${tone}`;
      ledger.style.backgroundColor = "var(--paper-raised)";
      const label = document.createElement("div");
      label.className = "result-kicker";
      label.textContent = tone;
      ledger.append(label);
      document.body.append(ledger);

      const labelStyle = getComputedStyle(label);
      const ledgerStyle = getComputedStyle(ledger);
      const contrast = ratio(labelStyle.color, ledgerStyle.backgroundColor);
      ledger.remove();
      return contrast;
    });
  });

  expect(contrastRatios[0]).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatios[1]).toBeGreaterThanOrEqual(4.5);
});
