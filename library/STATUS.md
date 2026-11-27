# Status
Initial implementation of v1.1. Source committed with self-hosted Three.js, responsive 3D scene, data-driven inventory and test workflow. Browser execution, published deployment, visual fidelity, native mobile GPU performance and audio quality require verification. No Blender/glTF asset set or Rapier contact solver in this revision; motion is kinematic. Classic View retained.

Revision 1.1.1 source review corrected front sector orientation, transfer belt/lift alignment, ejector direction and returning/re-retrieving a selected game. Added input lock while a delivered game is present; browser audit still pending.

Revision 1.1.2 assigns stable physical sectors to catalog categories, groups All/search results by sector, and returns the delivered box along the transfer path before reindexing. Future additional categories are allocated sectors, but spacing has not been visually validated beyond the current inventory.

V1.2 replaces the occluding drum roof with an open annular frame, adds fitted enamel enclosure parts, service panels, actual 3D cable routing, fasteners, trim, motor detailing and transfer guards; rebalances camera, box inspection scale and operator-console materials. Printed cover graphics remain provisional (except existing artwork). Browser and visual review are not certified.

V1.2.1 adds static geometry batching with the upstream Three.js BufferGeometryUtils (same MIT license), correct roller spin axis, threaded lead screw, box-centred inspection rotation, contact-aligned telescoping ejector and mobile camera tracking of the retrieval mechanism. Actual GPU frame rate and screenshot appearance remain unverified.

V1.3 replaces the scrolling desktop/mobile split with a viewport-locked operator console. Categories are a compact native selector; search, details and settings are dialogs; portrait inspection replaces the machine viewport in place. Stage, LCD, title strip, selection and actions stay in the same screen; landscape and desktop use side-by-side inspection. Tests now assert both horizontal and vertical fit and control bounds at nine sizes, without scrollIntoView. Browser verification remains pending.

V1.3.1 extends portrait single-screen operation to tablets, adds more compact short-screen layout rules and fits inspection to the actual preview aspect ratio. The prior revision's Chromium desktop/mobile interactions passed; Firefox runner lacked WebGL2. The audit now attempts software-rendered headed Firefox with Xvfb and explicitly reports unsupported WebGL2 as fallback-only, not a mechanical pass. Latest viewport tests still require results.
