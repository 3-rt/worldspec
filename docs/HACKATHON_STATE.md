# WorldSpec Hackathon State

Updated: August 22, 2026 at 1:07 AM America/Toronto

## Current milestone

The submission build is merged, deployed, and ready for HackHub. WorldSpec provides the complete setup, inspect, analyze, and evidence workflow, resolves the prepared Marble world by stable ID, renders its real splat and collider, and loads a verified proof route with visible anchors. Its 3D evidence draws the tested body as a measured width-and-height corridor and marks an invalid destination with a red beacon. Signed-out production testing has verified the 1.4 metre failure and 0.7 metre pass on desktop and mobile. The public package now includes the application, repository, rubric-aligned copy, production screenshots, and a 2:23 narrated judging video.

## Verified evidence

- Node.js: 24.19.0 LTS through `/opt/homebrew/opt/node@24/bin`
- npm: 11.17.0
- Runtime audit: 0 vulnerabilities
- Unit, component, and route tests: 18 files passed, 68 tests passed
- ESLint: passed
- TypeScript: passed with no emit
- Production build: passed with static `/` route
- Real-browser desktop workflow: 1.4 metre profile fails; 0.7 metre profile verifies a 6.3 metre route with 2.22 metre minimum clearance
- Real-browser mobile workflow: verified at 390 x 844 with no persistent horizontal overflow
- End-to-end Chromium suite: 3 tests passed, including the full fail-to-pass journey, mobile controls, and evidence contrast
- Submission screenshots: inspected from the optimized production build in both failure and passing states
- Accessibility audit: named visible controls, visible keyboard focus, 44 px touch targets, AA evidence-label contrast, and reduced-motion support
- Production runtime: no console errors, page errors, failed requests, or HTTP errors during the verified journey
- Public production URL: https://worldspec.vercel.app
- Public repository: https://github.com/3-rt/worldspec
- Public video: https://github.com/3-rt/worldspec/releases/tag/ignition-hacks-v7-submission
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

1. HackHub requires Basil's authenticated account and final submission action.
2. Spark 2.1.0 emits one upstream Three.js `Clock` deprecation warning. Spark 2.1.0 is the current release and declares compatibility with the installed Three.js version; no application console error occurs.

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

## Judging rubric

- General scoring: uniqueness, technical implementation, presentation and description, theme alignment, and impact and usefulness.
- Best Solo Hack: technical execution, ambition for a solo effort, and polish and completion, each scored from 0 to 5.
- Sponsor tracks: integration and creativity, scored from 0 to 5.
- Demo priority: show how WorldSpec uses both World Labs exports, name technical artists and level designers as the first user, and make the 1.4 metre failure to 0.7 metre pass contrast visible.

## Next action

Sign in to HackHub, paste the prepared answers from `docs/SUBMISSION_DRAFT.md`, attach the three verified public links, and submit.
