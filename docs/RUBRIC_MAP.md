# WorldSpec Rubric Map

Authoritative source: Ignition Hacks Judging Rubric 2026, supplied by the organizers.

## General rubric

| Criterion | 9-10 standard | WorldSpec evidence | Proof in the submission |
| --- | --- | --- | --- |
| Uniqueness | An extremely original idea that clearly stands out | Most world-model projects generate or explore scenes. WorldSpec begins after generation and turns the paired visual and physical exports into a deterministic QA instrument. | Open with: "Most world-model demos stop when the scene looks convincing. WorldSpec asks whether it actually works." Show the same world rejecting one body profile and accepting another. |
| Technical implementation | Multiple advanced features that are well executed | Server-only World API boundary, persistent-world resolution, SPZ Gaussian rendering, collider GLB ingestion, OpenCV-to-Three coordinate conversion, metric alignment, natural-language requirement compilation, avatar-aware Recast navigation, route-envelope ray sampling, stale-run cancellation, and 3D evidence overlays. | Name the pipeline while the live result is visible. Keep the public README concise enough that judges can verify each layer quickly. |
| Presentation and description | Clear, engaging, structured, thorough, and compelling | One continuous before-and-after story: generated world, movement contract, 1.4 m failure, 0.7 m pass, evidence, impact. | Use the timed script in `docs/DEMO_SCRIPT.md`. End before 2:45 and leave the passing evidence on screen. |
| Theme alignment: Art | The theme is thoughtfully incorporated into the core idea and functionality | WorldSpec is quality assurance for generated environment art. Technical artists and level designers need to preserve artistic intent while proving a space is functional for its intended body and movement constraints. The artwork itself is the test subject, not decoration around an unrelated app. | Explicitly say "For generated environment art, beautiful and usable are different requirements." Select Art in HackHub. |
| Impact and usefulness | A meaningful problem, highly effective targeted solution, and clear real-world potential | The first users are technical artists and level designers reviewing generated scenes before engine integration. The same verification pattern extends to games, AR/VR, robot simulation, and accessibility review. | Name the first user in the opening sentence. Show actionable failure evidence instead of claiming abstract impact. |

## Best of World Labs

| Criterion | Target | WorldSpec evidence |
| --- | --- | --- |
| Integration and creativity, 0-5 | 5 | Marble is structurally indispensable. Its Gaussian splat supplies the high-fidelity visual world, its collider supplies testable geometry, and its metric metadata plus persistent world ID keep both representations aligned and refreshable. Removing either representation breaks the product's core promise. WorldSpec uses Marble as the source of truth for a novel post-generation verification workflow, not as a decorative scene. |

## Solo evidence

WorldSpec was designed and built by Basil Liu as one hacker during Ignition Hacks V7. The submission remains focused on Best of World Labs, while the repository and implementation demonstrate the ambition, technical execution, polish, and completion expected of a strong solo build.

## Judge-facing message hierarchy

1. **Problem:** Generated environment art can look complete while being physically unusable.
2. **User:** Technical artists and level designers need a functional QA check before a world ships.
3. **Unique idea:** WorldSpec verifies generated worlds instead of generating or merely viewing them.
4. **World Labs necessity:** The visual splat and physical collider are synchronized inputs to one test.
5. **Technical proof:** A body-specific navmesh and route-envelope sampling produce deterministic evidence.
6. **Visible result:** A 1.4 m profile fails; a 0.7 m profile passes the same 6.3 m route with 2.22 m minimum clearance.
7. **Impact:** The workflow applies to games, XR, robot simulation, and accessibility-sensitive spatial design.

## Remaining risks

- Art alignment can be under-scored if the submission calls this only a developer tool. Always connect it to generated environment art and the technical-artist workflow.
- World Labs integration can look decorative if the video does not explicitly distinguish the splat from the collider. Toggle the collider and state why both exports are required.
- Technical depth can be missed if the video lists libraries without connecting them to the visible result. Explain the data flow in one sentence while showing the verified route.
- The 1.4 m failure is an invalid destination for that body profile, not a generic crash. Pause long enough for judges to read the evidence.
