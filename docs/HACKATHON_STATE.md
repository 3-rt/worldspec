# WorldSpec Hackathon State

Updated: August 21, 2026 at 8:49 PM America/Toronto

## Current milestone

Task 6 of 10 is complete. WorldSpec now samples routes against real Three.js collider geometry, measures paired obstacle distances around the avatar, distinguishes unbounded space, records the first clearance violation, and preserves the route for an orange spatial failure overlay. Task 7 is next: the complete interactive workspace.

## Verified evidence

- Node.js: 24.19.0 LTS through `/opt/homebrew/opt/node@24/bin`
- npm: 11.17.0
- Runtime audit: 0 vulnerabilities
- Unit, component, and route tests: 11 files passed, 35 tests passed before the Task 6 commit
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

## Current risks

1. Marble SPZ and collider alignment has not yet been validated with a live generated world.
2. Recast navigation has not yet been proven against the topology of a Marble collider.
3. A deterministic pass and fail coordinate pair still needs to be found in the generated demo world.
4. Production hosting and cross-origin asset loading remain unverified.

## Live World Labs evidence

- Read-only list endpoint: HTTP 200
- Worlds currently present: 0
- No response body, asset URL, header, or credential was printed during the smoke test.

## Submission guardrails

- Target: Best of World Labs
- Category: Art
- Submission code: `IHacksV7`
- Demo video: three minutes or shorter, regardless of contradictory portal wording
- Required public links: GitHub repository and demo video
- External HackHub submission requires Basil's explicit authorization

## Next action

Write failing user-workflow component tests, then replace the temporary landing shell with the complete inspection workspace.
