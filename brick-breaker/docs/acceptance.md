# Stage 1 acceptance record

| Check | Result | Evidence |
|---|---|---|
| C++23 compilation | PASS | GNU 14.2.0; Release build on Linux |
| Fixed 120 Hz clock | PASS | 120 ticks over exact 1 s; irregular frame timings |
| Long frame handling | PASS | 250 ms catch-up cap; discarded time tracked |
| Viewport and settings | PASS | Aspect ratio, portrait, minimized, approved dimensions |
| Box2D retrieval | BLOCKED | DNS resolution failure, three Git attempts |
| Native library integration | NOT RUN | FetchContent failed before library compilation |
| CCD, restitution, friction, momentum | NOT RUN | Actual Box2D test source supplied |
| 1,000-body throughput | NOT RUN | Test reports median, p95, maximum; 8.333 ms p95 provisional budget |
| Windows executable | NOT BUILT | Linux environment, no MSVC or Windows cross-compiler |
| Real graphics API / compute | NOT RUN | Needs native build and target GPU |
| Pixel rendering | NOT RUN | 1280×720 is configured, offscreen framebuffer and pixel-art rendering not implemented |
| Hybrid materials | NOT IMPLEMENTED | Architecture setting only; intentionally outside this gate |
| Asset downloads and inspection | BLOCKED | No asset archive retrieved; candidate licenses recorded only |

The test executable ran eight assertions; these are foundation tests, not physical simulation benchmarks. No FPS or physics throughput result is claimed. The 1000-body test is a single-world baseline, not a representative gameplay workload; the 8.333 ms budget does not reserve time for rendering or material processing. Later comparative profiling should separate body counts, active contacts, scheduler overhead, CPU/GPU costs and real game frame timings. Fracture is not present; no physics substitution used.

Design defaults selected during this implementation: 16:9 internal aspect ratio, four Box2D substeps per 120 Hz step, 250 ms max catch-up duration, and backend preference D3D11 → D3D12 → OpenGL → Vulkan → engine auto. All must be validated with target hardware. The real renderer must use a 1280×720 render target with nearest sampling; diagnostic text does not establish that.
