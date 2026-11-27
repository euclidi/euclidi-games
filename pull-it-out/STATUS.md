# Status — 0.1 development branch

Implemented in source: 3D board with six socketed shapes, hybrid pointer/keyboard/touch/gamepad controls, grip/lift/rotate/rock logic, custom extraction resistance and deformation, Rapier free-body motion and tray scoring, three color/layout-order variants, three claw configurations, challenge timer, persistent best/collection, audio and physics sliders.

Approximations: visual claw articulation and target spring are not physical finger joints; suction/friction are scalar resistance rather than fluid/contact simulation; deformable mesh is not a true soft body; board floor collision is continuous, not cut through by holes. Claw configurations are available immediately, not progression-gated; object collection is the only unlock progression. No licensed third-party art models sourced; custom mesh geometry instead. Gamepad, mobile and render fidelity require real-device testing. No browser test results yet; no screenshot or public catalog listing, no deployment claim.

Unit and browser test scripts included. Browser validation and catalog strict cover audit are required before publication.
Validation attempt 1: extraction math passed in Actions run 46050117535. Browser installation failed because ubuntu-latest selected Ubuntu 26.04 unsupported by Playwright 1.51.1. Pin runner Ubuntu 24.04 and Playwright 1.56.1 for retry.
