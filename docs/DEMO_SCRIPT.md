# WorldSpec real-time demo

Target final runtime: 2:15 to 2:35. Hard limit: under 3:00.

Every visual in the final edit should come from real-time screen footage. Record the screen without a microphone, then record the narration separately.

## Before recording

1. Use a current Chrome browser with hardware acceleration enabled.
2. Open `https://worldspec.vercel.app` at 100 percent browser zoom.
3. Wait until the source panel says `SPZ Full`, the viewer says `Scene ready`, and the footer says `1 geometry layers`.
4. Hide the bookmarks bar and close any download shelf or browser pop-up.
5. Click the collider control until it reads `Hidden`.
6. Orbit to the overhead greenhouse angle: the doorway should be at the far centre, the cross-shaped path should fill the viewport, and the planters should be visible on both sides.
7. Use macOS `Command + Shift + 5` to record only the browser content. Keep the microphone off.

## Screen recording shot list

Record these as three separate clips. Leave two seconds of stillness at the beginning and end of each clip so they are easy to edit.

### Clip 1: world and integration, 25 to 35 seconds

- Begin at the clear overhead greenhouse angle with the collider hidden.
- Orbit slowly for about eight seconds.
- Toggle the collider on, pause for three seconds, then hide it again.
- Click `Load proof route` and pause with both anchors visible.

### Clip 2: live failure and pass, 65 to 85 seconds

- Change the movement requirement from `0.7 m wide` to `1.4 m wide`.
- Pause until the width field visibly updates to `1.4`.
- Click `Run spatial test` and wait for `Destination is invalid`.
- Hold the failure result for five seconds.
- Change only the width back to `0.7 m wide`.
- Click `Run spatial test` and wait for `Contract verified`.
- Hold the passing result for eight seconds.

### Clip 3: verified result, 15 to 25 seconds

- Keep `Contract verified` and the evidence measurements visible.
- Orbit very slowly around the overhead angle while keeping the measured green corridor in view.
- End with the width rails, height gates, moving scan marker, `6.3 m`, and `2.22 m` all readable.

## Narration script

Record this as one Voice Memos take in a quiet room. Speak naturally and leave about one second between paragraphs. Do not try to match the screen while recording. The edit will handle timing.

> This is a persistent 3D world generated with World Labs Marble. It looks like a finished orbital greenhouse, but a level designer still needs to know whether a player or robot can actually move through it. I built WorldSpec to run that check.
>
> Marble provides two versions of the same world. The full-resolution Gaussian splat is the space the creator sees. The paired collider is the geometry WorldSpec can test. Marble's scale and ground metadata keep both versions aligned in metres.
>
> A creator writes a concrete movement requirement. For this test, a 1.8 metre-tall service robot needs to travel from the entrance to the platform without jumping. I am loading the same two route anchors each time so the comparison is reproducible.
>
> First, I set the robot's width to 1.4 metres. WorldSpec converts that requirement into body, slope, step, and clearance constraints. Recast rebuilds the navigation surface for that body and checks both anchors. The destination is invalid for this larger robot, so the test fails and identifies exactly where it fails.
>
> Now I change only the width to 0.7 metres. The world and route anchors stay the same. This time Recast finds a connected 6.3 metre route. WorldSpec samples the route against the Marble collider and measures 2.22 metres of minimum clearance. The green measurement corridor shows the tested width and height directly in the world, and the contract passes.
>
> The World Labs API key stays on the server. The browser receives fresh SPZ and GLB asset URLs, then Three.js, Spark, Recast, and deterministic ray tests produce the result. I built the full pipeline solo during Ignition Hacks.
>
> WorldSpec gives technical artists and level designers a QA step between generating a world and shipping it. The same check can extend to games, robot simulation, and accessibility-sensitive spatial design.

## Files to send for editing

- The three original screen recordings, without recompression
- One Voice Memos narration file, preferably `.m4a` or lossless audio
- Optional: one alternate narration take if a sentence felt rushed

The final edit will use only moving screen footage, synchronize the narration, trim loading delays, normalize the voice track, add restrained labels, and export a 1080p H.264 video at 30 FPS.
