# WorldSpec Submission Draft

## Recommended selections

- Category: Art
- Primary prize track: Best of World Labs
- Team: Basil Liu, solo
- Repository: https://github.com/3-rt/worldspec
- Live application: https://worldspec.vercel.app
- Demo video: https://github.com/3-rt/worldspec/releases/tag/ignition-hacks-v7-submission

## Project title

WorldSpec

## Tagline

Prove the world works.

## One-sentence description

WorldSpec is spatial QA for generated environment art, using World Labs Marble's visual splat and physical collider to prove whether an intended player, robot, or accessibility profile can actually traverse a world.

## Short description

Generated 3D worlds can look finished while hiding disconnected floors, invalid destinations, or passages that reject their intended user. WorldSpec gives technical artists and level designers a deterministic QA pass: it loads a persistent World Labs Marble world, aligns its Gaussian splat with its collider, compiles a movement requirement into a body profile, builds an avatar-aware navigation surface, and returns visible pass or fail evidence. In the prepared demo, the same route rejects a 1.4 m-wide profile and verifies a 0.7 m-wide explorer with a 6.3 m route and 2.22 m minimum clearance.

## Full project description

Most world-model demos stop when a generated scene looks convincing. WorldSpec starts with the production question that comes next: can the intended user actually move through it?

WorldSpec is a spatial QA instrument for technical artists and level designers working with generated environment art. It resolves a persistent World Labs Marble world, renders the 500k SPZ Gaussian splat, and loads the paired collider GLB as physical evidence. Those two exports are aligned in metric space through Marble's scale and ground metadata plus an explicit OpenCV-to-Three.js coordinate conversion.

The creator writes a movement requirement such as a 1.8 m-tall, 0.7 m-wide player travelling from an entrance to a platform without jumping. WorldSpec compiles that sentence into deterministic height, radius, slope, step, and clearance constraints. It builds a body-specific Recast navigation mesh from the actual Marble collider, projects the selected endpoints, verifies connected reachability, samples the route envelope with paired ray tests, and overlays the result directly on the generated world.

The prepared orbital-greenhouse demonstration makes the result concrete. A 1.4 m-wide profile cannot use the selected destination. Restoring the 0.7 m explorer profile produces a verified 6.3 m route with 2.22 m minimum clearance. The result is useful evidence, not a visual guess.

Marble is indispensable to the solution. Its Gaussian splat supplies the visual world a creator recognizes, its collider supplies the geometry WorldSpec can test, its metadata keeps the representations aligned, and its stable world ID lets a server-only API boundary refresh expiring asset URLs without exposing credentials.

WorldSpec was designed and built solo during Ignition Hacks V7. The same verification layer can support games, AR/VR, robot simulation, and accessibility-sensitive spatial design wherever generated worlds must become usable production environments.

## Problem or challenge

Visual plausibility does not prove spatial usability. Generated environments can contain disconnected walkable regions, invalid entrances or destinations, slopes and steps outside an agent's limits, or passages narrower than the body they were designed for. Teams currently discover many of these failures only after bringing the asset into a downstream engine and testing it manually.

## How the solution works

1. Resolve a prepared Marble world through a server-only World API client.
2. Render its 500k Gaussian splat and collider GLB in one aligned metric scene.
3. Compile natural-language measurements into a deterministic movement contract.
4. Place route endpoints or load the reproducible proof route.
5. Build an avatar-aware Recast navigation surface from the collider.
6. Verify endpoint validity and connected reachability.
7. Sample lateral route clearance against the collider.
8. Present pass or fail evidence in an evidence ledger and 3D overlay.

## Key technologies

- World Labs Marble and World API
- Next.js 16 and React 19
- TypeScript and Zod
- Three.js and Spark for SPZ Gaussian rendering
- Recast Navigation for body-specific reachability
- Deterministic Three.js ray sampling for minimum clearance
- Vitest, Testing Library, and Playwright
- Vercel deployment with server-only credentials

## Notable technical decisions

- The World Labs API key never enters the client bundle.
- Expiring asset URLs are refreshed from a stable world ID instead of stored.
- Both Marble exports are transformed from OpenCV axes into Three.js space.
- The visual splat receives Marble's metric scale and ground alignment metadata, while the collider remains already-metric physical evidence.
- Width controls both Recast agent radius and the required route-envelope clearance.
- Analysis is deterministic and needs no additional language-model service.
- Stale results are invalidated whenever the world, collider, route, or movement requirement changes.
- Production generation is disabled by default so public judging cannot consume quota or destabilize the prepared demo.

## Tracks and category answer

WorldSpec is submitted in the Art category and targets Best of World Labs. It treats generated environment art as a production asset whose artistic intent and spatial function must remain aligned. World Labs is used creatively and essentially through its paired Gaussian splat, collider, metric metadata, persistent-world model, and API.

## Suggested video title

WorldSpec - Prove a World Labs Marble World Actually Works

## Suggested video description

WorldSpec is spatial QA for generated 3D worlds, built solo for Ignition Hacks V7. This demo uses a real World Labs Marble Gaussian splat and collider to test the same route against two body profiles, revealing a functional failure and then verifying a 6.3 m traversable path.

Live app: https://worldspec.vercel.app

Source: https://github.com/3-rt/worldspec
