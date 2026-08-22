# WorldSpec Hackathon State

Updated: August 21, 2026 at 9:22 PM America/Toronto

## Current milestone

Task 7 is complete and Task 8 is in progress. WorldSpec now provides the complete setup, inspect, analyze, and evidence workflow, resolves a prepared Marble world by stable ID, keeps the prepared demo active during optional generation, and can load a verified proof route with visible anchors. Live generation produced the orbital greenhouse and its real collider now builds a valid navigation surface. Visual alignment verification remains before Task 8 can close.

## Verified evidence

- Node.js: 24.19.0 LTS through `/opt/homebrew/opt/node@24/bin`
- npm: 11.17.0
- Runtime audit: 0 vulnerabilities
- Unit, component, and route tests: 15 files passed, 52 tests passed
- ESLint: passed
- TypeScript: passed with no emit
- Production build: passed with static `/` route
- API credential files: ignored by Git

## Decisions made during execution

- Use Node 24 LTS. The previously linked Node 23 runtime is outside current Vitest and jsdom support, and its npm 10 resolver crashes on Vitest's optional peer graph.
- Keep ESLint 9.39.5 because Next 16.3.2's bundled plugins do not yet accept ESLint 10, despite the top-level configuration's broader peer range.
- Pin reviewed dependency install scripts for `unrs-resolver` and both installed `fsevents` versions.
- Continue in the requested dedicated repository on a feature branch instead of creating a nested worktree.
- Treat the stated avatar width as both the minimum passage clearance and twice the navigation radius.
- Support metre and centimetre spellings deterministically so the demo's natural-language interaction never depends on another AI service.
- Normalize World Labs responses at the server boundary and return only safe application fields to the browser.
- Refresh asset URLs by world ID rather than persisting expiring CDN URLs.
- Use real `Response` objects and injected fetch functions in API tests, keeping schema parsing and request formation real.
- Represent Marble's transform in two explicit stages: metric ground alignment, then OpenCV-to-Three axis conversion.
- Use positive object Y translation when composing the transform directly on a rotated Three.js splat. This is mathematically equivalent to subtracting ground offset before the X-axis rotation.
- Keep renderer, camera, controls, asynchronous asset loads, overlays, and disposal inside one scene controller rather than React state.
- Convert metric avatar dimensions into Recast voxel counts conservatively instead of passing metres into voxel-valued configuration fields.
- Reject Detour partial paths whose last point remains more than two navigation cells from the projected goal.
- Measure corridor width with paired horizontal rays at avatar mid-height so floors and ceilings cannot masquerade as lateral clearance.
- Use the first contract violation for spatial explanation while retaining the global minimum measurement for the report.
- Accept both the current direct `world_id` response and the older wrapped `id` response at the World Labs boundary.
- Convert both the Marble splat and collider from OpenCV to Three.js axes. Only the splat receives semantic scale and ground offset because the collider export is already metric.
- Interpret "without jumping" as no jump traversal links while retaining normal 0.3 metre walking step tolerance. A literal zero climb produces no Recast polygons on generated floor noise.
- Keep the current prepared world visible while optional live generation polls, then fetch the completed world again by ID for fresh metadata and asset URLs.

## Current risks

1. Marble SPZ and collider alignment still needs visual verification in a WebGL browser.
2. Production hosting remains unverified.
3. The in-app browser is not connected, so desktop and mobile visual QA remains blocked on that surface.

## Live World Labs evidence

- Read-only list endpoint: HTTP 200
- Worlds currently present: 1
- Generated world ID: `90307e9c-afa8-47f9-9182-68ff5846378f`
- Generated collider: 71,184 vertices across one mesh, with 65 sampled walkable points
- Verified standard route: approximately 6.3 metres with 2.222 metres measured minimum clearance
- CDN checks: SPZ HTTP 200, GLB HTTP 200, and both allow cross-origin reads
- No asset URL, request header, or credential was printed during live verification.

## Submission guardrails

- Target: Best of World Labs
- Category: Art
- Submission code: `IHacksV7`
- Demo video: three minutes or shorter, regardless of contradictory portal wording
- Required public links: GitHub repository and demo video
- External HackHub submission requires Basil's explicit authorization

## Next action

Complete real-browser alignment and responsive QA, then add the end-to-end journey and deploy the verified branch.
