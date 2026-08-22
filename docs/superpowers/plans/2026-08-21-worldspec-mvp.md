# WorldSpec MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and ship a polished web application that loads a World Labs Marble world, tests whether a configured avatar can move from a selected start to goal with sufficient clearance, and explains pass or fail evidence directly in the 3D scene.

**Architecture:** A Next.js App Router application keeps World Labs credentials in server-only route handlers and runs the interactive Three.js, Spark, and Recast workflow in the browser. Domain parsing, coordinate transforms, route classification, and clearance measurement live in focused framework-independent modules with deterministic tests. The reliable demo path resolves a pre-generated world ID through the API, while live generation is an additional supported path.

**Tech Stack:** Node.js 24.19 LTS, npm 11, Next.js 16.3.2, React 19.2.8, TypeScript, Three.js 0.185.1, Spark 2.1.0, Recast Navigation 0.43.1, Zod, Vitest 4.1.11, Testing Library, Playwright 1.62.1, ESLint, and CSS.

**Spec:** `docs/design/2026-08-21-worldspec-design.md`

## Global Constraints

- Work in the dedicated repository on branch `feat/worldspec-mvp`, never directly on `main`.
- Use npm and commit `package-lock.json`.
- Keep `WORLDLABS_API_KEY` server-only. Never add it to a public variable, client bundle, log, fixture, screenshot, or commit.
- Target current desktop Chromium with WebGL2 for the judged demo and provide a readable mobile fallback.
- Use Marble model `marble-1.1` unless a live API response proves it unavailable.
- Fetch current asset URLs from the World API by world ID because CDN asset URLs may expire.
- Use the 500k SPZ asset for the interactive default.
- Apply `metric_scale_factor`, subtract `ground_plane_offset` from Gaussian center Y, and rotate generated SPZ assets 180 degrees around X according to World Labs documentation.
- Treat collider alignment as a verified integration boundary. Do not analyze when splat and collider transforms disagree.
- Every behavior change follows red, green, refactor. Configuration and generated framework metadata do not receive tautological tests.
- The main flow must remain deterministic without an OpenAI API key.
- The visual direction is an industrial spatial-inspection instrument: warm paper-white panels, near-black viewport chrome, safety-orange failures, acid-lime passes, condensed technical labels, and restrained cartographic motion.
- The product must not resemble a generic AI chat interface or a uniform-card dashboard.
- The final repository and video links must be public, and the demo video must be three minutes or shorter.

## File Structure

```text
.
├── .env.example
├── README.md
├── package.json
├── playwright.config.ts
├── vitest.config.ts
├── docs/
│   ├── HACKATHON.md
│   ├── HACKATHON_STATE.md
│   ├── SUBMISSION_CHECKLIST.md
│   └── design/ and superpowers/
├── e2e/worldspec.spec.ts
└── src/
    ├── app/
    │   ├── api/operations/[operationId]/route.ts
    │   ├── api/worlds/[worldId]/route.ts
    │   ├── api/worlds/generate/route.ts
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    ├── components/
    │   ├── analysis-panel.tsx
    │   ├── generation-panel.tsx
    │   ├── scene-toolbar.tsx
    │   ├── world-viewer.tsx
    │   └── workspace.tsx
    ├── features/analysis/
    │   ├── analyze-world.ts
    │   ├── clearance.ts
    │   ├── navigation.ts
    │   ├── requirement-parser.ts
    │   ├── report-copy.ts
    │   └── schemas.ts
    ├── features/viewer/
    │   ├── scene-controller.ts
    │   ├── synthetic-world.ts
    │   └── world-transform.ts
    ├── lib/worldlabs/
    │   ├── client.ts
    │   ├── errors.ts
    │   ├── normalize.ts
    │   └── schemas.ts
    └── test/
        ├── fixtures/worldlabs.ts
        └── setup.ts
```

---

### Task 1: Quality Baseline and Application Shell

**Files:**
- Create: `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`
- Create: `vitest.config.ts`, `playwright.config.ts`, `.env.example`, `src/test/setup.ts`
- Test: `src/app/page.test.tsx`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `docs/HACKATHON_STATE.md`

**Interfaces:**
- Consumes: approved design and submission facts.
- Produces: `npm run dev`, `npm run test`, `npm run test:e2e`, `npm run lint`, `npm run typecheck`, `npm run build`, a server-rendered shell, and safe environment names.

- [x] **Step 1: Create the feature branch and configuration**

Run `git switch -c feat/worldspec-mvp`. Configure exact scripts, TypeScript strict mode, `@/` alias, Vitest `jsdom`, Testing Library cleanup, ESLint, and Playwright desktop Chromium on port 3000. Set `.env.example` to:

```dotenv
WORLDLABS_API_KEY=
WORLDLABS_API_BASE_URL=https://api.worldlabs.ai
WORLDLABS_MODEL=marble-1.1
DEMO_WORLD_ID=
```

Install the versions in the header and verify `npm audit --omit=dev` has no high or critical runtime findings.

- [x] **Step 2: Write the failing shell test**

```tsx
import { render, screen } from "@testing-library/react";
import Home from "./page";

test("introduces WorldSpec as spatial QA rather than world generation", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { level: 1, name: "WorldSpec" })).toBeVisible();
  expect(screen.getByText("Prove the world works.")).toBeVisible();
  expect(screen.getByRole("main")).toHaveAccessibleName("WorldSpec analysis workspace");
});
```

- [x] **Step 3: Verify red**

Run `npm test -- src/app/page.test.tsx`. Expect failure because `page.tsx` is absent.

- [x] **Step 4: Implement the minimal shell**

Use Archivo and Fragment Mono through `next/font/google`. Render the required `main`, `h1`, thesis, and `Workspace initializing` status. Establish color, typography, focus, reduced-motion, and viewport variables without building later controls.

- [x] **Step 5: Verify and commit**

Run `npm test -- src/app/page.test.tsx`, `npm run lint`, `npm run typecheck`, and `npm run build`. Record exact evidence, next task, risks, and submission clock in `docs/HACKATHON_STATE.md`.

Commit with `git commit -m "build: establish WorldSpec application baseline"`.

### Task 2: Domain Contract and Requirement Compiler

**Files:**
- Create: `src/features/analysis/schemas.ts`
- Test/Create: `src/features/analysis/requirement-parser.test.ts`, `src/features/analysis/requirement-parser.ts`
- Test/Create: `src/features/analysis/report-copy.test.ts`, `src/features/analysis/report-copy.ts`
- Modify: `docs/HACKATHON_STATE.md`

**Interfaces:**
- Produces: `defaultAgentProfile`, Zod domain schemas, `compileRequirement(sourceText, baseAgent)`, and `summarizeReport(report)`.

- [x] **Step 1: Write failing compiler tests**

Define desired defaults: radius `0.35`, height `1.8`, maximum slope `45`, step height `0.3`, and minimum clearance `0.7`. Assert:

```ts
expect(compileRequirement(
  "A player who is 1.8 m tall and 0.7 m wide must reach the platform without jumping.",
  defaultAgentProfile,
)).toMatchObject({
  agent: { heightMeters: 1.8, radiusMeters: 0.35, stepHeightMeters: 0 },
  minimumClearanceMeters: 0.7,
  requirePath: true,
});
```

Also prove missing measurements use the literal defaults.

- [x] **Step 2: Verify red, implement, and verify green**

Run `npm test -- src/features/analysis/requirement-parser.test.ts`. Implement metre unit normalization, height matching near `tall` or `height`, width matching near `wide` or `width`, width-to-radius conversion, and `without jumping` handling. Validate the returned value through `worldContractSchema`. Rerun until green.

- [x] **Step 3: Test and implement evidence copy**

First assert that measured clearance `0.42` against required `0.7` yields title `Clearance fails`, tone `fail`, and both values. Assert a passing 12.4 metre route yields `Contract verified`, tone `pass`, and `12.4 m`. Implement `summarizeReport` using the first failure as evidence.

- [x] **Step 4: Verify and commit**

Run `npm test -- src/features/analysis`. Update state and commit with `git commit -m "feat: compile spatial requirements into test contracts"`.

### Task 3: World Labs API Boundary

**Files:**
- Test/Create: `src/lib/worldlabs/normalize.test.ts`, `schemas.ts`, `normalize.ts`
- Test/Create: `src/lib/worldlabs/client.test.ts`, `client.ts`, `errors.ts`
- Create: `src/test/fixtures/worldlabs.ts`
- Create: three API routes listed in the file map
- Modify: `docs/HACKATHON_STATE.md`

**Interfaces:**
- Produces: `WorldAssets`, `WorldOperation`, `createWorldLabsClient({ apiKey, baseUrl, fetch })`, world retrieval, generation, and operation polling routes.

- [x] **Step 1: Write a full sanitized fixture and failing normalization tests**

Mirror every documented field used by the app. Use `https://assets.example.test/` URLs, `metric_scale_factor: 1.25`, and `ground_plane_offset: 0.4`. Assert the 500k SPZ and collider normalize into `WorldAssets`, while either missing asset returns `World assets are incomplete`.

- [x] **Step 2: Implement schemas and normalization**

Use Zod for nullable API metadata, require consumed assets, retain all SPZ resolutions, and never return credentials. Verify with `npm test -- src/lib/worldlabs/normalize.test.ts`.

- [x] **Step 3: Write failing injected-fetch client tests**

Using real `Response` objects, prove `getWorld("world-123")` sends a GET to `/marble/v1/worlds/world-123` with `WLT-Api-Key`; `generateWorld` sends the documented `marble-1.1` text body; `getOperation` parses in-progress and complete operations; and HTTP 429 maps to code `rate-limited` without response bodies or credentials in its message.

- [x] **Step 4: Implement client, safe errors, and thin routes**

Use one private request function with `cache: "no-store"`, schema validation, injected fetch, and bounded safe errors. Validate generation input as trimmed `{ displayName, prompt }` with a 1,500-character maximum. Routes serialize normalized results or `{ error: { code, message } }`.

- [x] **Step 5: Verify live read-only access and commit**

Run all World Labs tests and typecheck. Call `POST /marble/v1/worlds:list` with `{}` using the configured key, printing only HTTP status and world count. Expect 200. Update state and commit with `git commit -m "feat: add secure World Labs API boundary"`.

### Task 4: Coordinate Transform and Scene Foundation

**Files:**
- Test/Create: `src/features/viewer/world-transform.test.ts`, `world-transform.ts`
- Create: `src/features/viewer/synthetic-world.ts`, `scene-controller.ts`
- Test/Create: `src/components/world-viewer.test.tsx`, `world-viewer.tsx`
- Modify: `docs/HACKATHON_STATE.md`

**Interfaces:**
- Produces: metric transform functions, `SceneController`, `WorldViewer`, collider scene data, and point-selection events.

- [x] **Step 1: Write failing transform tests**

```ts
expect(toMetricPosition(
  { x: 2, y: 3, z: 4 },
  { metricScaleFactor: 1.25, groundPlaneOffset: 0.4 },
)).toEqual({ x: 2.5, y: 3.35, z: 5 });
```

Also assert uniform scale `1.25`, direct Three.js object Y translation `+0.4`, X rotation `Math.PI`, and inverse round-trip tolerance `1e-6`. The positive object translation is the composed result of subtracting the offset before the 180-degree X-axis conversion.

- [x] **Step 2: Verify red, implement transforms, and verify green**

Run `npm test -- src/features/viewer/world-transform.test.ts` before and after the pure implementation.

- [x] **Step 3: Write a failing viewer lifecycle test**

Inject a `SceneDriver`. Assert mount adds exactly one canvas, interaction mode changes reach the driver, unmount disposes it, and loading/errors are user-visible. Do not test Three.js internals.

- [x] **Step 4: Implement scene controller and synthetic world**

The synthetic world contains a floor, raised goal, and narrow opening. The controller owns renderer, camera, orbit controls, Spark renderer, SplatMesh, collider, resize observer, raycaster, markers, route, failure marker, frame loop, and disposal. Spark loads dynamically in the browser. The collider is translucent with depth-aware edges.

- [x] **Step 5: Verify and commit**

Run viewer and transform tests plus typecheck, with no browser-only code during server render. Update state and commit with `git commit -m "feat: render Marble worlds in a testable scene"`.

### Task 5: Navigation and Reachability

**Files:**
- Test/Create: `src/features/analysis/navigation.test.ts`, `navigation.ts`
- Test/Create: `src/features/analysis/analyze-world.test.ts`, `analyze-world.ts`
- Modify: schemas and state

**Interfaces:**
- Produces: `buildNavigationSurface(meshes, profile)`, `findRoute(surface, start, goal)`, and `analyzeWorld(input)`.

- [ ] **Step 1: Write failing tests against real synthetic geometry**

Initialize Recast. A broad floor must return a path from `(-4, 0, 0)` to `(4, 0, 0)` with endpoints within `0.25` metres. Disconnected floor islands must return `unreachable`.

- [ ] **Step 2: Implement the Recast adapter**

Cache WASM initialization. Use `threeToSoloNavMesh` with profile-derived radius, height, slope, climb, cell size `0.15`, and cell height `0.1`. Return a narrow wrapper with `findNearestPoint`, `computePath`, and `destroy` rather than leaking Recast objects.

- [ ] **Step 3: Test and implement orchestration**

After the adapter is green, test invalid start, invalid goal, unreachable, and passing route reports. Project endpoints within `0.75` metres, calculate route length, return explicit failure locations, and destroy resources in `finally`.

- [ ] **Step 4: Verify and commit**

Run `npm test -- src/features/analysis`. Expect no WASM leaks or console errors. Update state and commit with `git commit -m "feat: verify world reachability with collider navigation"`.

### Task 6: Clearance and Spatial Failure Evidence

**Files:**
- Test/Create: `src/features/analysis/clearance.test.ts`, `clearance.ts`
- Modify: analysis orchestration, schemas, scene controller, and state

**Interfaces:**
- Produces: `measureRouteClearance(input)` and a visible failure location in `AnalysisReport`.

- [ ] **Step 1: Write failing corridor tests**

Use real Three.js walls around a straight route. A 2.0 metre corridor must measure within `0.1` of `2.0`. A section narrowing to `0.6` against required `0.7` must fail near that segment. No nearby walls returns `Infinity` and passes.

- [ ] **Step 2: Implement deterministic sampling**

Resample every `0.2` metres. At avatar mid-height, cast paired horizontal rays in 16 directions bounded at 5 metres. The minimum sum of opposing hits is passage width. Record global minimum and the first sample below the threshold.

- [ ] **Step 3: Integrate route evidence**

Run reachability first. A narrow route retains its path, returns `fail`, and includes measured and required values. Passing routes render acid-lime; failures render safety-orange with a pulsing ring at the recorded location.

- [ ] **Step 4: Verify and commit**

Run all analysis and viewer tests plus typecheck. Update state and commit with `git commit -m "feat: expose route clearance failures in space"`.

### Task 7: Complete Interactive Workspace

**Files:**
- Test/Create: `src/components/workspace.test.tsx`, `workspace.tsx`
- Create: `analysis-panel.tsx`, `generation-panel.tsx`, `scene-toolbar.tsx`
- Modify: `page.tsx`, `globals.css`, and state

**Interfaces:**
- Produces: the complete setup, inspect, analyze, and result journey.

- [ ] **Step 1: Write failing workflow tests**

With only WebGL and API boundaries injected, prove: prepared demo opens with the example contract; `Set entrance` changes the instruction; both points enable `Run spatial test`; passing analysis displays `Contract verified`; failing analysis displays `Clearance fails` with both measurements.

- [ ] **Step 2: Implement explicit workflow states**

Use `loading-world`, `placing-start`, `placing-goal`, `ready`, `analyzing`, `pass`, and `fail`. Keep one source of truth for contract and selections. Abort stale fetches and runs on world change.

- [ ] **Step 3: Implement the intentional interface**

Build an asymmetric desktop composition with numbered contract rail, dominant viewport, evidence ledger, and baseline status strip. Use surveying marks and hairline grids instead of generic cards. During analysis, briefly desaturate the viewport, pass one scan line across it, and resolve the route. Respect reduced motion.

Below 900px, put the viewer first, controls in a horizontal step rail, and evidence in a bottom sheet. Use 44px targets, visible focus, non-color labels, and no page-level horizontal overflow.

- [ ] **Step 4: Verify and commit**

Run component tests, lint, typecheck, and production build with no hydration, accessibility, or lifecycle warnings. Update state and commit with `git commit -m "feat: complete the WorldSpec inspection workflow"`.

### Task 8: Live Marble World and Demo Scenario

**Files:**
- Create/Test: `src/lib/worldlabs/demo-world.ts`, `demo-world.test.ts`
- Create: `src/app/api/worlds/demo/route.ts`
- Modify: generation panel, workspace, `.env.example`, and state

**Interfaces:**
- Produces: reliable demo resolution by ID, live prompt generation, bounded polling, and retry.

- [ ] **Step 1: Test and implement the demo resolver**

Blank world ID returns code `demo-not-configured`; a valid ID resolves through the normalizer. Store no CDN URL in configuration. Expose `GET /api/worlds/demo` backed by server-only `DEMO_WORLD_ID`.

- [ ] **Step 2: Generate a purpose-built Marble world**

Use this exact prompt:

```text
A compact abandoned orbital greenhouse converted into an indie game level, with a clear entrance, a central observation platform, walkable concrete paths, dense overgrown planters, and one visibly narrow maintenance passage connecting two open areas. Realistic scale, coherent continuous floor, no people, no text or signs.
```

Poll every 10 seconds. Record only operation ID, final world ID, duration, and status. Set `DEMO_WORLD_ID` only in `.env.local` and the deployment environment.

- [ ] **Step 3: Verify alignment visually**

Compare three recognizable anchors while toggling collider visibility. Correct only `WorldTransform` if needed, and reproduce any correction with a failing test first.

- [ ] **Step 4: Finish live generation and deterministic scenario**

Poll every five seconds for up to ten minutes with progress, retry, and `Open in Marble`. Keep the prepared demo usable during generation. Confirm one coordinate pair plus two profiles produce deterministic contrasting results. Store only safe points and profiles, not asset URLs.

- [ ] **Step 5: Verify and commit**

Run all tests and build. Update state and commit with `git commit -m "feat: connect WorldSpec to a live Marble world"`.

### Task 9: End-to-End Verification and Polish

**Files:**
- Create: `e2e/worldspec.spec.ts`
- Modify: Playwright config, affected UI files, and state

**Interfaces:**
- Produces: reproducible judged journey and visually verified layouts.

- [ ] **Step 1: Write and verify a failing browser test**

Open `/`, wait for the prepared world, confirm a non-empty viewer canvas, load or place deterministic endpoints through visible controls, run analysis, assert result and `Open in Marble`, and capture a result screenshot. A test fixture may substitute assets, but must keep the real user workflow and components.

- [ ] **Step 2: Add only the missing deterministic seams**

Run `npm run test:e2e -- e2e/worldspec.spec.ts`, confirm the first failure, implement the smallest stable fixture route or selector, and rerun until green.

- [ ] **Step 3: Inspect the rendered product**

Use the in-app browser at 1440x1000 and 390x844. Check typography, alignment, canvas sizing, loading, selection, pass, fail, upstream error, long text, focus, reduced motion, and scrolling. Fix every visible or console issue encountered.

- [ ] **Step 4: Verify the full local gate and commit**

Run `npm test`, `npm run test:e2e`, `npm run lint`, `npm run typecheck`, and `npm run build`. Confirm the viewer does not recreate WebGL on ordinary state changes and leaves no observer or animation leaks. Commit with `git commit -m "test: verify the complete WorldSpec journey"`.

### Task 10: Public Delivery and Submission Package

**Files:**
- Create: `README.md`, `docs/SUBMISSION_CHECKLIST.md`, `docs/DEMO_SCRIPT.md`
- Modify: state and `.gitignore`

**Interfaces:**
- Produces: public repository, production deployment, reproducible setup, and timed video script.

- [ ] **Step 1: Complete public documentation**

Cover problem, flow, World Labs dependency, architecture, setup, environment, test commands, limitations, sponsor/category attribution, deployment, and screenshots. Exclude organizer codes, emails, secrets, and expiring URLs from README.

- [ ] **Step 2: Create submission checklist and 2:45 script**

Use this timing: problem 0:00-0:20; world and collider 0:20-0:45; contract and points 0:45-1:20; failure 1:20-2:05; passing result and architecture 2:05-2:30; impact and close 2:30-2:45. Checklist HackHub code `IHacksV7`, solo identity fields, public repo/deployment/video, three-minute limit, World Labs prize, Art category, and signed-out checks.

- [ ] **Step 3: Check secrets and deploy**

Run:

```bash
git ls-files | rg '(^|/)\.env($|\.)' && exit 1 || true
git grep -nE 'WLT-Api-Key|WORLDLABS_API_KEY=[^[:space:]]+' -- ':!docs/superpowers/plans/*' && exit 1 || true
git status --short
```

Deploy with server-only environment values. Test the signed-out production journey, CORS, source maps/client sources, desktop, and mobile. Confirm no API key appears in browser network headers.

- [ ] **Step 4: Publish and verify public access**

Create a public repository under the authenticated account, push and integrate the verified branch, and confirm the repository and README signed out. Record the working production application, edit to 2:45 or less, upload publicly, and verify playback signed out.

- [ ] **Step 5: Run final gate and commit**

Run all unit, E2E, lint, typecheck, and build commands plus `git status --short --branch`. Commit with `git commit -m "docs: prepare WorldSpec hackathon submission"`.

Do not submit the HackHub form until Basil confirms the final video URL and explicitly authorizes the external submission.
