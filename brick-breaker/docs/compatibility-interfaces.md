# Stage 1 compatibility interfaces

Added 524288-cell, 2 MiB deterministic RGBA8 transport fixture; explicit little-endian field encoding, snapshot hashing and six CPU checks. The native GPU probe uploads two distinct snapshots, copies each on the GPU, reads the data back and compares all bytes with the CPU reference. This tests transport, not a GPU compute kernel, material solver, or frame-budget performance. It requires a real GPU/backend. The GPU code and new tests are unverified at commit time.

Added miniaudio 0.11.26 candidate pin and six native offline WAV decoding/seek assertions on Windows and Linux. Audio test uses a generated known PCM fixture, not a production sound. No playback device or real sound has been validated. The version pin is selected because earlier versions had decoder fixes pending; the build will verify availability.

Preserve the 1280x720 rendering, 120Hz, hybrid architecture, and auto backend. Prior core, physics and Clipper2 tests have passed. Previous graphics compilation failure and original invalid audio URL are documented in compatibility-repair.md. New CI run has not yet completed. Stage 1 remains open pending build, GPU, visual asset and audio review.
