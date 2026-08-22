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

## HackHub field answers

### Inspiration

World-model demos usually end when the scene looks convincing. Technical artists and level designers still have to check whether a player or robot can actually use it. A generated space can look finished and have a disconnected floor, an invalid destination, or a passage the intended body cannot fit through. I built WorldSpec to run that check directly on a generated world.

### What it does

WorldSpec loads a persistent World Labs Marble world and renders the SPZ Gaussian splat with its paired collider GLB. A creator writes a movement requirement, such as a 1.8 metre-tall, 0.7 metre-wide player travelling from an entrance to a platform without jumping. WorldSpec turns those measurements into a body profile, builds a Recast navigation mesh from the collider, checks the two route anchors, and samples clearance along the path. It returns a visible pass or fail with the route and measurements overlaid in 3D. In the demo, a 1.4 metre-wide service robot fails at the destination. Changing the width to 0.7 metres produces a 6.3 metre route with 2.22 metres of minimum clearance.

### How we built it

I built the app with Next.js 16, React 19, TypeScript, and Zod. The server keeps the World Labs API key private, resolves a stable Marble world ID, and refreshes expiring SPZ and GLB URLs. Three.js and Spark render the Gaussian splat. The collider goes through an explicit OpenCV-to-Three.js axis conversion, with Marble's scale and ground metadata applied to keep both views in the same metric space. Recast Navigation builds a mesh for the current body dimensions, and paired Three.js ray tests measure clearance. I used Vitest, Testing Library, and Playwright for 59 tests, then deployed it on Vercel.

### Challenges we ran into

Getting the splat and collider into the same metric coordinate system was the hardest part. Marble's exports use OpenCV axes, the splat needs semantic scale and a ground offset, and the collider is already metric. Applying one transform to both would produce the wrong geometry, so I split the conversion into explicit stages. Recast was another challenge because its agent settings use voxel counts rather than metres. A literal zero-climb setting also produced no polygons on generated floor noise, so `without jumping` had to mean no jump links while preserving a 0.3 metre walking step. I also had to handle expiring asset URLs, API rate limits, stale analysis, and browser performance.

### Accomplishments we're proud of

Marble supplies both inputs to WorldSpec's analysis: the visual splat a creator recognizes and the collider Recast can test. The same world and route anchors produce a different result when the body width changes. The 1.4 metre service robot fails at the destination, while the 0.7 metre explorer passes with measured route and clearance evidence. I built the server boundary, renderer, navigation analysis, test suite, interface, and deployment solo.

### What we learned

I had not built with Gaussian splats or Recast before this hackathon. I learned how Marble's visual output, collider export, metric metadata, and stable world IDs fit together. The biggest technical lesson was coordinate frames: a scene can look right while its physical analysis is wrong. I also learned how Recast settings change with agent size and how to keep a browser demo deterministic when generated assets use expiring URLs.

### What's next for WorldSpec

I would add batch route suites and compare several player or robot profiles in one run instead of changing the requirement one at a time. A clearance heatmap could show tight parts of the world even when a route passes. I would also save reports between world versions and add Unity, Unreal, and robotics pipeline hooks so teams could run the same checks whenever a generated world changes. Larger collider jobs would move to a background worker.

### Tools and integrations

World Labs Marble, World Labs World API, Next.js 16, React 19, TypeScript, Zod, Three.js, Spark, Recast Navigation, Vitest, Testing Library, Playwright, Vercel, GitHub

### Media

- Required screenshot: `docs/assets/worldspec-pass.png`
- Additional screenshot: `docs/assets/worldspec-failure.png`
- Video demo: https://github.com/3-rt/worldspec/releases/tag/ignition-hacks-v7-submission

## One-sentence description

WorldSpec is spatial QA for generated environment art, using World Labs Marble's visual splat and physical collider to prove whether an intended player, robot, or accessibility profile can actually traverse a world.

## Short description

Generated 3D worlds can look finished while hiding disconnected floors, invalid destinations, or passages that reject their intended user. WorldSpec lets technical artists and level designers test those failures against the actual Marble collider. It loads a persistent Marble world, aligns its Gaussian splat with its collider, turns a movement requirement into a body profile, builds an avatar-aware navigation surface, and returns a visible pass or fail. In the prepared demo, the same route rejects a 1.4 m-wide profile and verifies a 0.7 m-wide explorer with a 6.3 m route and 2.22 m minimum clearance.

## Full project description

Most world-model demos stop when a generated scene looks convincing. WorldSpec starts with the production question that comes next: can the intended user actually move through it?

WorldSpec is a spatial QA instrument for technical artists and level designers working with generated environment art. It resolves a persistent World Labs Marble world, renders the 500k SPZ Gaussian splat, and loads the paired collider GLB as physical evidence. Those two exports are aligned in metric space through Marble's scale and ground metadata plus an explicit OpenCV-to-Three.js coordinate conversion.

The creator writes a movement requirement such as a 1.8 m-tall, 0.7 m-wide player travelling from an entrance to a platform without jumping. WorldSpec compiles that sentence into deterministic height, radius, slope, step, and clearance constraints. It builds a body-specific Recast navigation mesh from the actual Marble collider, projects the selected endpoints, verifies connected reachability, samples the route envelope with paired ray tests, and overlays the result directly on the generated world.

In the prepared orbital-greenhouse demo, a 1.4 m-wide profile cannot use the selected destination. Restoring the 0.7 m explorer profile produces a 6.3 m route with 2.22 m minimum clearance. The evidence panel identifies the failed destination or reports the measured route and clearance.

WorldSpec uses four parts of Marble. The Gaussian splat supplies the visual world a creator recognizes. The collider supplies geometry that Recast can test. The metadata keeps both representations aligned, and the stable world ID lets a server-only API boundary refresh expiring asset URLs without exposing credentials.

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

WorldSpec is submitted in the Art category and targets Best of World Labs. The generated environment is the test subject. WorldSpec uses Marble's Gaussian splat, collider, metric metadata, persistent world ID, and API to check whether the space still works for its intended user.

## Suggested video title

WorldSpec - Prove a World Labs Marble World Actually Works

## Suggested video description

WorldSpec is spatial QA for generated 3D worlds, built solo for Ignition Hacks V7. This demo uses a real World Labs Marble Gaussian splat and collider to test the same route against two body profiles, revealing a functional failure and then verifying a 6.3 m traversable path.

Live app: https://worldspec.vercel.app

Source: https://github.com/3-rt/worldspec
