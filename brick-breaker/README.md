# Brick Breaker — Stage 1 foundation (0.1.0)

**Status: partial implementation, acceptance gate BLOCKED. Not a playable game or Windows release.**

Approved settings: 1280×720 internal resolution (16:9 inferred), 120 Hz fixed simulation, automatic graphics backend, hybrid CPU-authoritative material processing. Stage 1 only. No progression, destruction solver, gameplay, production artwork or material solver implemented.

## Core checks
Requires CMake 3.24+ and a C++23 compiler.
    cmake -S . -B build-core -DBB_NATIVE=OFF
    cmake --build build-core --config Release
    ctest --test-dir build-core -C Release --output-on-failure

Eight foundation assertions passed in the original Linux environment. Native configuration failed during Box2D retrieval (DNS). Native diagnostics remain uncompiled and untested.

## Native Windows validation
Run build-windows.ps1 from this directory with Git, CMake, Visual Studio 2022 C++ tools and a Windows SDK installed. Run stage1-bin/runtime_probe.exe --smoke on target hardware to verify actual graphics backend and compute support. Run stage1-bin/physics_bench.exe for physics results. No compiled executable is included.

Pinned dependencies: Box2D v3.1.1, SDL release-3.2.28, bgfx.cmake v1.171.9651-619. Clipper2, miniaudio and material solver reuse are pending. Do not substitute weaker libraries silently.

## Acceptance
Do not advance beyond Stage 1 before Windows build, target GPU probe, physics benchmarks and asset acquisition and inspection pass. See docs/acceptance.md and assets/README.md. 
