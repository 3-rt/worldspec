# WorldSpec Hackathon State

Updated: August 21, 2026 at 8:30 PM America/Toronto

## Current milestone

Task 2 of 10 is complete. WorldSpec has validated metric domain contracts, a deterministic requirement compiler, and evidence-first result summaries. Task 3 is next: the server-only World Labs API boundary.

## Verified evidence

- Node.js: 24.19.0 LTS through `/opt/homebrew/opt/node@24/bin`
- npm: 11.17.0
- Runtime audit: 0 vulnerabilities
- Unit tests: 3 files passed, 7 tests passed before the Task 2 commit
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

## Current risks

1. Marble SPZ and collider alignment has not yet been validated with a live generated world.
2. Recast navigation has not yet been proven against the topology of a Marble collider.
3. A deterministic pass and fail coordinate pair still needs to be found in the generated demo world.
4. Production hosting and cross-origin asset loading remain unverified.

## Submission guardrails

- Target: Best of World Labs
- Category: Art
- Submission code: `IHacksV7`
- Demo video: three minutes or shorter, regardless of contradictory portal wording
- Required public links: GitHub repository and demo video
- External HackHub submission requires Basil's explicit authorization

## Next action

Write a full sanitized World Labs response fixture and failing normalization tests.
