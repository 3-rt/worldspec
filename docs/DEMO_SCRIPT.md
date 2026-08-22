# WorldSpec Demo Script

Final cut: 2:22.83. Section headings retain pre-edit recording timestamps.

## 0:00-0:18 - Problem and uniqueness

"Most world-model demos stop when a scene looks convincing. Production starts one step later: can the intended user actually use it? For generated environment art, beautiful and usable are different requirements. WorldSpec gives technical artists and level designers that missing spatial QA test."

Show the title and the full workspace.

## 0:18-0:42 - World Labs as the source of truth

"This orbital greenhouse was generated with World Labs Marble. Marble provides two synchronized representations: the Gaussian splat is the visual world, and the paired collider is physical evidence. WorldSpec needs both. Remove either one and the product cannot verify the world."

Orbit the scene. Toggle Collider off, then on.

"Marble's metric metadata keeps the artwork and test geometry aligned."

## 0:42-1:12 - Contract and proof route

"A creator writes the functional requirement in plain language. This player is 1.8 metres tall and 0.7 metres wide, travelling from the entrance to the platform without jumping. WorldSpec compiles the sentence into explicit body, slope, step, and clearance constraints."

Click **Load proof route**. Point out the two visible anchors and their coordinates.

"You can place these manually on any collider surface. I am loading a verified pair so this demo is reproducible."

## 1:12-1:50 - Visible failure

Replace the sentence with a `1.4 m wide` service-robot requirement. Confirm the width field updates, then run the spatial test.

"Now the intended user is a 1.4 metre-wide service robot. WorldSpec rebuilds the Recast navigation surface for that body, projects both anchors, and checks connected reachability."

Pause on the orange evidence state.

"The same destination is no longer valid for this larger agent. That is actionable production evidence, not a visual guess."

## 1:50-2:25 - Passing result and technical proof

Restore the `0.7 m wide` explorer requirement and run again.

"For the explorer profile, Recast finds a 6.3 metre connected route. WorldSpec then samples the route envelope against the actual Marble collider and draws the verified path in acid lime. Minimum clearance is 2.22 metres."

Point out route length, minimum clearance, and compute time.

"The API key stays server-only. The browser receives fresh asset URLs, then Three.js, Spark, Recast, and deterministic ray tests produce the evidence you see here."

## 2:25-2:38 - Impact and close

"World models should not only create places. They should help us prove those places work for players, robots, and accessibility needs. WorldSpec turns Marble's visual and physical outputs into the QA layer between beautiful generated art and a usable world."

End on the pass evidence and the WorldSpec wordmark.
