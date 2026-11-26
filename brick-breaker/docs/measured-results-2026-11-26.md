# Stage 1 measured results — 2026-11-26

Evidence: https://github.com/euclidi/euclidi-games/actions/runs/45908170816
Commit tested: 9a36c8c317a76020c9d35da30422ede7fd1ef32f

Linux and Windows core and Box2D v3.1.1 jobs passed. Eight foundation assertions and eight native physics assertions passed on each platform. Windows and Linux restitution ratio 0.8; thin-wall collisions at 30, 60, 100, 180 m/s reflected at the same speed. Friction and momentum checks passed.

| Runner | Median ms | p95 ms | Max ms |
|---|---:|---:|---:|
| Ubuntu 24.04 | 0.665883 | 0.8834 | 2.79671 |
| Windows 2022 | 0.6952 | 0.9214 | 2.8767 |

120 Hz, four substeps, 1000 dynamic boxes, 240 steps. No rendering, fracture, materials, or representative gameplay workload. CCD originally checks final position and velocity, not every intermediate step; no claim about all possible configurations.

Asset intake job failed overall but acquired industrial.zip. The downloaded artifact was inspected: 112 separate 18x18 PNG tiles, two 918x515 preview/sample PNGs and two tilemaps. Embedded License.txt explicitly identifies CC0 and Kenney. Archive SHA256 73dadc516252b7ddca0a6413aae856dba2fd8cc2c7d6373578496e427d8f9eb5. Preview shows simple outlined industrial machinery, masonry and props, unsuitable as final high-density 1280-wide artwork without major refinement. Reference only; not integrated. Audio URL returned non-ZIP. New intake logs explicitly report content type, byte count and retries; no claim the upstream URL is fixed.
Artifact: https://github.com/euclidi/euclidi-games/actions/runs/45908170816/artifacts/15158463319

Windows graphics still pending at time of this record. Added independent Clipper2 1.5.4 build and polygon partition tests as a prerequisite for later fracture work. These are geometry tests, not a full fracture solver or gameplay. New tests have not yet run. Target GPU, actual 1280x720 offscreen rendering, full asset selection and material processing remain unverified. Stage 1 remains open.
