# WorldSpec

**Prove the world works.**

WorldSpec is spatial QA for generated 3D worlds. It turns a movement requirement into a testable avatar profile, builds a navigation surface from the generated collider, and shows exactly whether a route is usable.

Built solo for Ignition Hacks V7, targeting **Best of World Labs** in the **Art** category.

## The problem

Generative world models can produce a scene that looks convincing while hiding functional failures: a disconnected platform, an unusable entrance, a passage too narrow for the player, or a floor a robot cannot traverse. Visual quality alone does not answer the production question: can the intended user actually move through this space?

WorldSpec adds that missing verification layer.

The first target user is a technical artist or level designer reviewing an AI-generated space before it reaches a game, simulation, robot, or accessibility workflow.

## What it does

1. Loads a persistent world generated with World Labs Marble.
2. Renders the 500k Gaussian splat and its collider in one aligned Three.js scene.
3. Compiles natural-language dimensions into a deterministic movement contract.
4. Lets the user place an entrance and destination, or load a verified proof route.
5. Builds an avatar-aware Recast navigation mesh from the real Marble collider.
6. Samples the route envelope against collider geometry.
7. Returns pass or fail evidence in the interface and directly in 3D.

The prepared orbital-greenhouse demo includes a verified 6.3 metre route. A standard 0.7 metre explorer profile passes; a 1.4 metre rescue-bot profile demonstrates how the same destination can become invalid for a larger agent.

## Why World Labs is essential

Marble is not a decorative asset source here. WorldSpec depends on its paired representations of the same generated space:

- SPZ Gaussian splats provide the high-fidelity visual world.
- Collider GLB geometry provides the physical evidence.
- Semantic scale and ground metadata align the splat with metric analysis.
- Stable world IDs let the server refresh expiring asset URLs safely.

Both exports use Marble's OpenCV coordinate frame. WorldSpec converts them to Three.js axes, applies metric metadata to the splat, and keeps the already-metric collider suitable for physics and navigation.

## Architecture

```text
Marble world ID
    |
    +-- server-only World API client -- fresh SPZ + collider URLs
    |
    +-- Three.js + Spark ------------ visual world and point selection
    |
    +-- Recast ---------------------- avatar-aware connected route
    |
    +-- paired ray sampling --------- minimum route clearance
    |
    +-- evidence ledger ------------ pass/fail explanation and 3D overlay
```

The World Labs API key never enters the browser bundle. Next.js route handlers own generation, polling, and world resolution. Analysis is deterministic and runs without an additional AI service.

## Local setup

Requirements:

- Node.js 24 LTS
- npm 11+
- A World Labs API key with Marble access

```bash
git clone https://github.com/3-rt/worldspec.git
cd worldspec
npm install
cp .env.example .env.local
npm run dev
```

Configure `.env.local`:

```dotenv
WORLDLABS_API_KEY=your_private_key
WORLDLABS_API_BASE_URL=https://api.worldlabs.ai
WORLDLABS_MODEL=marble-1.1
DEMO_WORLD_ID=your_prepared_world_id
```

Open `http://localhost:3000` in a current desktop Chromium browser with WebGL2.

## Quality commands

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

The current unit and component gate covers requirement parsing, evidence copy, World API schemas and errors, API routes, coordinate transforms, viewer lifecycle, real Recast navigation, clearance sampling, prepared-world resolution, bounded generation polling, deterministic demo scenarios, and the complete workspace flow.

## Limitations

- Collider meshes are intentionally coarse and may omit visual detail.
- Navigation quality depends on the topology of the generated collider.
- Large collider analysis currently runs in the browser and can take a few seconds.
- The interactive 3D experience targets desktop Chromium with WebGL2. Smaller screens receive a responsive inspection layout, but desktop is recommended.
- Marble world generation usually takes several minutes, so the prepared demo remains available during generation.

## Sponsor attribution

WorldSpec uses [World Labs Marble](https://www.worldlabs.ai/) and its World API to generate, retrieve, render, and verify persistent 3D worlds.
