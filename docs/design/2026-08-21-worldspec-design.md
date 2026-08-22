# WorldSpec Design

Status: Ready for review before implementation

Date: August 21, 2026

Event: Ignition Hacks V7

Primary target: Best of World Labs

Category: Art

## Decision summary

WorldSpec is a practical QA tool for AI-generated 3D worlds. It lets a game, AR, or VR creator generate or load a World Labs Marble world, express a functional requirement, and see whether an agent can actually traverse the resulting space.

The hackathon demo will prove one narrow claim:

> AI can generate a beautiful world. WorldSpec proves whether you can actually use it.

The core example is: "A player who is 1.8 metres tall and 0.7 metres wide must be able to travel from the entrance to the platform without jumping."

WorldSpec converts that requirement into editable constraints, analyzes Marble's collider mesh, and overlays the route or failure directly on the generated world.

## Why this project

Generative world tools make visual creation fast, but creators still need to know whether a generated environment works. A visually convincing scene may contain disconnected surfaces, passages that are too narrow, steep slopes, blocked routes, or geometry that does not match the intended interaction.

WorldSpec makes World Labs essential to the product rather than decorative. It uses both the visual Gaussian splat and the collider mesh produced by Marble, turning the generated world into something testable.

The project is deliberately positioned for indie and small-team creators rather than broad robotics validation. That keeps the workflow understandable in a three-minute demo while retaining a technically serious core.

## Target user and job

The primary user is an indie game, AR, or VR creator prototyping a traversable environment with generative 3D tools.

Their job is:

1. Generate or select a world.
2. Describe how an avatar should be able to move through it.
3. Identify a start and destination.
4. Learn immediately whether the world satisfies that requirement.
5. Understand the exact point and reason for any failure.

## Demo narrative

The three-minute submission should follow one continuous story:

1. Show a Marble-generated world and its visual quality.
2. Enter a functional requirement for a specific avatar.
3. Select the entrance and target platform in the 3D viewer.
4. Run WorldSpec.
5. Show a failed route with the blocking bottleneck highlighted and a concise explanation.
6. Change the avatar constraint or analyze a second candidate world.
7. Show a passing route and a compact verification report.

The demo should use pre-generated Marble assets for reliability. Live generation remains available, but it must not be on the critical presentation path because generation can take several minutes.

## Goals

- Load a Marble world generated through the World Labs API.
- Display the Gaussian splat and collider mesh in a shared, aligned 3D viewer.
- Let the user set start and goal points directly in the scene.
- Accept a natural-language movement requirement and expose its structured interpretation for editing.
- Build a navigation representation from the collider mesh for a configurable avatar.
- Test start-to-goal reachability and minimum passage clearance.
- Display a clear pass or fail result with route and failure overlays.
- Produce a polished, understandable three-minute demo, deployed application, public repository, and complete README.

## Non-goals

- Automatic repair or regeneration of failed worlds.
- A complete game engine or level editor.
- Multiplayer collaboration.
- General-purpose robotics simulation or dynamics.
- Formal accessibility certification.
- Exhaustive physical validation of every possible interaction.
- Training or fine-tuning a new model.

## Scope and priority

### Required vertical slice

The minimum shippable product must:

1. Load one pre-generated Marble world and its collider through saved World Labs API output.
2. Render the splat and collider with a synchronized camera and consistent coordinate transform.
3. Accept an avatar radius and height.
4. Let the user place a start and goal.
5. Determine whether a traversable path exists.
6. Sample the resulting route for clearance violations.
7. Render the path or the first useful failure location in the world.
8. Present a concise result panel with evidence, not only a pass or fail label.

### Full MVP

After the vertical slice works, add:

- World generation from a text prompt through a server-side World Labs route.
- Natural-language requirement parsing into an editable structured contract.
- World and analysis loading states, progress, retry, and useful errors.
- A deterministic demo fixture and a second contrasting world or agent profile.
- A polished landing and analysis flow suitable for screen recording.

### Stretch work

Only after the full MVP is stable:

- Maximum slope validation.
- Line-of-sight validation.
- Reachable-area percentage.
- Side-by-side candidate world comparison.
- A suggested Marble repair prompt based on a failure.

## User experience

WorldSpec is a single focused workspace rather than a dashboard.

### Setup state

The user chooses a prepared demo world, supplies an existing Marble world ID, or starts a new generation. A simple avatar card exposes height, radius, maximum slope, and step height. A requirement field contains a useful example by default.

### Inspect state

The 3D scene is the dominant surface. The user can toggle the visual splat, translucent collider, and analysis overlays. Start and goal placement use explicit modes so ordinary camera clicks cannot accidentally move them.

### Result state

The scene displays a green route for a pass. A failure uses a red route segment or marker at the most informative detected obstruction. The result panel states what was tested, what passed, what failed, and the relevant measurements.

The interface should feel like a spatial engineering instrument, not a generic AI chat application. Natural language is an input convenience, while the 3D evidence is the product.

## Technical architecture

### Application shell

- Next.js App Router with TypeScript for a unified web application.
- React client components for the interactive viewer and analysis workspace.
- Server route handlers for World Labs and optional language-model requests.
- npm as the package manager because it is already available in the environment.
- Vercel-compatible deployment, with final hosting confirmed during implementation.

### 3D rendering

- Three.js for the scene, camera, controls, ray casting, and analysis overlays.
- `@sparkjsdev/spark` for World Labs SPZ Gaussian splats.
- `GLTFLoader` for the Marble collider GLB.
- A single `WorldTransform` boundary normalizes asset scale, offset, axes, and coordinate conversions. All selection points, paths, and reports use one canonical world coordinate system.

### Spatial analysis

- `recast-navigation` and `@recast-navigation/three` generate and query a navigation mesh from the collider geometry.
- Avatar radius, height, maximum slope, and step height become navigation-build parameters.
- The path test projects start and goal onto the navigation mesh, calculates a route, and reports disconnected or invalid endpoints.
- Clearance analysis samples the route against nearby collider geometry. It records the minimum measured clearance and the first point below the contract threshold.
- Analysis logic is kept independent of React and rendering so it can be tested deterministically with small geometry fixtures.

### Requirement parsing

The reliable core is a structured, editable contract. Natural-language parsing is an enhancement layered on top of it.

If an OpenAI API key is configured, a server route converts the user's sentence into schema-validated JSON. The user always sees and can edit the interpreted values before analysis. If parsing is unavailable or fails, the structured controls remain fully functional.

This design prevents the core demo from depending on a second external API while preserving the compelling natural-language interaction.

### World Labs integration

- `WORLDLABS_API_KEY` remains server-only and is never exposed through a `NEXT_PUBLIC_` variable.
- The server starts Marble generation, polls operation status, and returns normalized asset metadata.
- The client can also load saved metadata from a successfully generated demo world.
- The application records the world ID, asset URLs, generation prompt, scale metadata, and coordinate metadata needed to recreate an analysis session.

## Core data contracts

```ts
type Vec3 = { x: number; y: number; z: number };

type WorldAssets = {
  worldId: string;
  prompt?: string;
  splatUrl: string;
  colliderGlbUrl: string;
  metricScaleFactor: number;
  groundPlaneOffset: number;
};

type AgentProfile = {
  radiusMeters: number;
  heightMeters: number;
  maxSlopeDegrees: number;
  stepHeightMeters: number;
};

type WorldContract = {
  sourceText: string;
  start: Vec3 | null;
  goal: Vec3 | null;
  requirePath: boolean;
  minimumClearanceMeters: number;
  agent: AgentProfile;
};

type AnalysisFailure = {
  kind: "invalid-start" | "invalid-goal" | "unreachable" | "clearance";
  message: string;
  location?: Vec3;
  measuredValue?: number;
  requiredValue?: number;
};

type AnalysisReport = {
  status: "pass" | "fail";
  path: Vec3[];
  minimumClearanceMeters?: number;
  failures: AnalysisFailure[];
  elapsedMs: number;
};
```

These types are the conceptual boundary. Exact fields may be refined during implementation when verified against live World Labs responses.

## Data flow

1. A world prompt is sent to a server route, or a saved `WorldAssets` fixture is selected.
2. The server calls World Labs and returns normalized metadata after generation completes.
3. The client loads the SPZ and collider GLB into a shared Three.js scene.
4. The user confirms the agent profile and places start and goal points.
5. Optional language parsing populates the editable `WorldContract`.
6. The analysis module builds or reuses the navigation mesh, finds a route, and checks clearance.
7. The viewer renders path and failure geometry from the `AnalysisReport`.
8. The result panel explains the evidence in the same units as the contract.

## Failure handling

- Invalid or missing API credentials produce an actionable server-side configuration message without revealing secrets.
- World Labs authorization, quota, rate-limit, and generation failures are mapped to distinct user messages.
- Generation polling has a bounded timeout and preserves the operation ID for retry.
- Asset load failures identify whether the splat or collider failed and offer retry.
- Coordinate or alignment problems block analysis rather than producing a misleading report.
- Start and goal points that cannot be projected onto traversable geometry are shown explicitly.
- Navigation generation failures retain the loaded world and suggest a safer profile or fixture.
- Requirement parser output is schema-validated. Invalid output falls back to manual structured controls.
- Analysis can be cancelled or rerun when inputs change.

## Testing strategy

Implementation follows test-driven development for deterministic logic and end-to-end verification for the user workflow.

### Unit tests

- Contract validation and defaults.
- Coordinate conversions and asset transforms.
- Route result classification.
- Clearance sampling against tiny synthetic geometry.
- User-facing error mapping.

### Integration tests

- World Labs server routes with recorded, sanitized response fixtures.
- Collider extraction and navigation mesh generation from a small checked-in GLB fixture.
- Requirement parsing with mocked valid and invalid structured responses.

### End-to-end tests

- Load the deterministic demo world.
- Place start and goal through the visible interface.
- Run analysis and verify a visible pass route.
- Change the profile or goal and verify a visible failure with an explanation.
- Check the primary flow at the intended recording viewport and a mobile fallback layout.

### Live smoke tests

- Generate one disposable world through the real World Labs API.
- Confirm returned SPZ and collider assets load and align.
- Confirm a deployed build can call the server integration without exposing the API key.

## Acceptance criteria

The project is ready to submit when all of the following are true:

1. A world created through the World Labs API is visibly used in the product.
2. Its SPZ and collider load in the same viewer and visibly align.
3. A user can configure an avatar and place start and goal without developer tools.
4. Analysis returns within 15 seconds after assets are loaded on the demo machine.
5. At least one passing and one failing scenario are deterministic and visually clear.
6. A failure identifies a useful location or endpoint and explains the violated constraint.
7. The main workflow works in the deployed application.
8. Automated tests, lint, type checks, and production build pass.
9. The public repository contains meaningful code, setup instructions, architecture notes, and sponsor attribution.
10. The final video is no longer than three minutes and shows the actual working project.

## Delivery and cut strategy

The build order protects the risky technical proof first:

1. Validate real Marble asset metadata and render alignment.
2. Prove collider-to-navigation processing on the smallest possible fixture.
3. Complete the full path from viewer selection to visible report.
4. Add live generation and natural-language convenience.
5. Polish the demo, documentation, deployment, and video.
6. Add stretch validation only if the submission path is already stable.

If time becomes constrained, cut in this order:

1. Candidate comparison.
2. Repair prompts.
3. Sightline and reachable-area metrics.
4. Live generation during the demo.
5. Natural-language parsing.

The visual world, collider analysis, path and clearance checks, and evidence overlays are never cut.

## Execution workflow

The implementation session will use a lightweight hybrid workflow:

- Superpowers supplies brainstorming, planning, test-driven development, systematic debugging, and verification gates.
- A Codex goal provides the durable end condition across long-running turns.
- `docs/HACKATHON_STATE.md` records the current milestone, completed evidence, next task, risks, and submission clock.
- Work proceeds as one small testable task at a time in a single-agent loop.
- Each meaningful slice is verified and committed before moving on.
- No large agent swarm or dynamic workflow is used without explicit approval.

The coding goal will not be started until the official hackathon work period begins.

## Primary references

- Ignition Hacks rules: https://docs.google.com/document/d/1jB6DGVmNrc3anVc5DVEreDuFZAtoSpcMWMY72yHJ7Kg/edit
- World Labs API documentation: https://docs.worldlabs.ai/api
- World Labs starter kit: https://worldlabs.notion.site/Starter-Kit-30d8950a1bef806e90a5e030c6382297
- Spark renderer: https://github.com/sparkjsdev/spark
- Recast Navigation for JavaScript: https://github.com/isaac-mason/recast-navigation-js
- Next.js environment variables: https://nextjs.org/docs/app/guides/environment-variables
- Superpowers: https://github.com/obra/superpowers
- Codex goals: https://learn.chatgpt.com/use-cases/follow-goals
