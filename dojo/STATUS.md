# Dojo X — Current status

**Snapshot:** 2026-11-27. **Stage 1E — persistent search; Stage 2 gated.**

## Latest changes
- Four additional parameter configurations and 22 trials, including two held-out trials, archived in [batch 01](experiments/stage1e-01.json) and [batch 02](experiments/stage1e-02.json).
- Adaptive elite search ranks settled training trials first, fitness second, and waits for a persistence acknowledgement before evaluating another candidate.
- Archive startup loads the prior seed and both new batches without replacing existing IDs or user ratings.

## Measured results
The baseline score was 23.78 (one of five training disturbances settled). Candidate stage1e-01-1 scored 39.12 (two of five settled; forward50 verified step recovery, heavy-back50 stable). Both held-out tests settled. Forward65, backward65 and forward75 still caused falls. Seven repository candidates and 39 trial replays passed finite-frame format checks. A mocked worker protocol test verified acknowledgement, adaptive candidate selection and completion order. App JavaScript syntax passed. The earlier Chromium archive/replay smoke test applies to the prior revision only: [audit](https://github.com/euclidi/euclidi-games/actions/runs/45913066891).

## Limitations and next work
The larger search exceeded the execution limit; completed smaller batches were saved in Git. This controller is planar, self-collision disabled, and is not approved. No full 3D, fighting or Stage 2 work. Browser persistence, visual quality, live Pages publication and mobile 60 FPS for this revision remain unverified. Next: improve directional recovery using controlled comparisons and review actual replays; preserve all failed candidates.

[Roadmap](ROADMAP.md) · [Specification](SPEC.md)
