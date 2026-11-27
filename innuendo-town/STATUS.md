# Development status — 0.4
Branch: dev/innuendo-town. Draft PR [#7](https://github.com/euclidi/euclidi-games/pull/7).

Committed: local Kenney atlas, native Phaser scene, eight storefront art profiles and nine interior profiles, five job-rule families, navigation, economy, versioned saves, schedule-based resident destinations, witnessed remarks and collisions, persistent contact-based rumor propagation.

Validation: committed game source parsed successfully; 16 grouped checks passed in the authoring JavaScript evaluator (content counts, opening hours, wages, route reachability, rumor propagation/expiry, schedules, and atlas coordinate bounds). This is not visual or runtime validation. A Playwright desktop/mobile smoke test and branch/PR Actions workflow exist, but no completed browser run has been retrieved. The authoring container cannot download Phaser from the CDN because DNS resolution fails. Local artwork is available; engine download remains a runtime dependency outside CI.

Remaining: browser boot and all gameplay paths, visual review of actual tile choices and animation, stronger individualized characters and outfits, more physical interactions, deeper relationship simulation, audio and performance polish. Do not merge or add to public catalog until playtesting and visual QA pass.

## 2026-11-27 corrective audit
GitHub Actions [browser run 46044702302](https://github.com/euclidi/euclidi-games/actions/runs/46044702302): logic step passed; npm installed Phaser and Playwright, but Playwright 1.56.1 rejected Ubuntu 26.04 before browser execution. Pinned workflow to Ubuntu 24.04. [Documentation run 46044702347](https://github.com/euclidi/euclidi-games/actions/runs/46044702347): missing Innuendo Town root README links plus existing issues in unrelated projects. Added project links and required catalog-return anchor; unrelated projects not modified. Retest results pending. No browser screenshots or playable release verified.
