# WorldSpec Demo Script

Target duration: 2:45

## 0:00-0:20 - Problem

"Generated 3D worlds can look finished while still being physically unusable. A route can be disconnected, an entrance can be invalid, or a space can reject the avatar it was designed for. WorldSpec gives technical artists and level designers a spatial QA test before that world ships."

Show the title and the full workspace.

## 0:20-0:45 - World and collider

"This orbital greenhouse was generated with World Labs Marble. WorldSpec resolves its persistent world ID, renders the Gaussian splat, and loads the paired collider as physical evidence."

Orbit the scene. Toggle Collider off, then on.

"The visual world and test geometry stay aligned in metric space."

## 0:45-1:20 - Contract and route

"The requirement is a player 1.8 metres tall and 0.7 metres wide, moving from the entrance to the platform without a jump action. The sentence compiles into explicit height, width, slope, and walking-step constraints."

Click **Load proof route**. Point out the two visible anchors and their coordinates.

"You can place these manually on any collider surface. I am loading a verified pair so this demo is reproducible."

## 1:20-2:05 - Failure

Change the sentence from `0.7 m wide` to `1.4 m wide`. Confirm the width field updates, then run the spatial test.

"Now the intended user is a 1.4 metre rescue bot. WorldSpec rebuilds the navigation surface for that body, projects both anchors, and checks connected reachability."

Pause on the orange evidence state.

"The same destination is no longer valid for this larger agent. This is useful evidence, not a visual guess."

## 2:05-2:30 - Passing result and architecture

Change the sentence back to `0.7 m wide` and run again.

"For the explorer profile, Recast finds a 6.3 metre connected route. WorldSpec then samples the route envelope against the actual Marble collider and draws the verified route in acid lime."

Point out route length, minimum clearance, and compute time.

"The API key remains server-only. The browser receives fresh asset URLs, then Three.js, Spark, Recast, and deterministic ray tests produce the result."

## 2:30-2:45 - Impact and close

"World models should not only create places. They should help us prove those places work for players, robots, and accessibility needs. WorldSpec turns Marble's visual and physical outputs into the QA layer between a beautiful generated world and a usable one."

End on the pass evidence and the WorldSpec wordmark.
