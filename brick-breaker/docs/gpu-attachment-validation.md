# Stage 1 GPU attachment validation

The graphics probe now allocates a fixed 1280 × 720 BGRA8 render target with point sampling flags. Where the selected backend supports texture blit and CPU readback, it clears the attachment twice to distinct known colors, copies it to a readback texture and compares every pixel against the expected channel values. The last GPU result is saved as a PPM image. Unsupported capabilities are reported distinctly; --smoke returns nonzero for unsupported or mismatched readback.

This validates allocation, dimensions, clears and GPU readback only. It does not validate nearest-neighbor presentation, sprites, lighting, shaders, high-density production artwork or performance. It does not replace testing on the target Windows PC. The code is not yet compiled or executed at the time of this commit. The visible window remains a diagnostics screen, not a game.

No gameplay or material solver implementation advanced. The existing GitHub graphics job had completed configuration and entered compilation before this change; no graphics test result was available yet.
