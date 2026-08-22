# WorldSpec Hackathon State

Updated: August 21, 2026 at 8:36 PM America/Toronto

## Current milestone

Task 3 of 10 is complete. WorldSpec has a tested server-only World Labs client, safe response normalization, request validation, generation and polling routes, and verified live API authentication. Task 4 is next: Marble coordinate transforms and the 3D scene foundation.

## Verified evidence

- Node.js: 24.19.0 LTS through `/opt/homebrew/opt/node@24/bin`
- npm: 11.17.0
- Runtime audit: 0 vulnerabilities
- Unit and route tests: 6 files passed, 19 tests passed before the Task 3 commit
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

Write failing tests for metric coordinate transforms and viewer lifecycle ownership.
