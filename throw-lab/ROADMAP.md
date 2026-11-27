# Development priorities
The complete existing scope remains active; these are engineering priorities, not approval gates.

1. Integrate the cumulative implementation, audit input/collision/rendering defects and publish as an explicitly unverified preview.
2. Run real WebGL desktop/mobile playtests and capture real gameplay cover. Profile net and can physics at 240 Hz and improve stability.
3. Asset-first visual upgrade: evaluate licensed PBR gym/ball textures and detailed sports-equipment meshes with verified geometry scale and material compatibility. Keep the coherent monochrome gym and preserve recognizable fictional balls. Do not bulk replace assets before validating a representative asset.
4. Calibrate release, aerodynamic lift, spin decay, restitution and mass/inertia; compare measured trajectories and rebound heights; improve 3D contact and rim rolling. Evaluate Rapier for rigid can/wall bodies against the existing specialized cloth solver rather than replacing both blindly.
5. Refine first-person articulated jump-shot hands, gather/release/follow-through and bank aiming; tune touch gesture sampling and add accessible keyboard/controller options where useful.
6. Complete regression tests, browser playtests, persistent GitHub checkpoints and deployment verification.

V12 retains Three.js and the specialized solver because an engine migration would risk the approved net and ball interactions. A new physics backend or external asset pack must be tested before adoption.
