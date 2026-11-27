# Development status — 0.4
Branch: dev/innuendo-town. Draft PR [#7](https://github.com/euclidi/euclidi-games/pull/7).

Committed: local Kenney atlas, native Phaser scene, eight storefront art profiles and nine interior profiles, five job-rule families, navigation, economy, versioned saves, schedule-based resident destinations, witnessed remarks and collisions, persistent contact-based rumor propagation.

Validation: committed game source parsed successfully; 16 grouped checks passed in the authoring JavaScript evaluator (content counts, opening hours, wages, route reachability, rumor propagation/expiry, schedules, and atlas coordinate bounds). This is not visual or runtime validation. A Playwright desktop/mobile smoke test and branch/PR Actions workflow exist, but no completed browser run has been retrieved. The authoring container cannot download Phaser from the CDN because DNS resolution fails. Local artwork is available; engine download remains a runtime dependency outside CI.

Remaining: browser boot and all gameplay paths, visual review of actual tile choices and animation, stronger individualized characters and outfits, more physical interactions, deeper relationship simulation, audio and performance polish. Do not merge or add to public catalog until playtesting and visual QA pass.

## 2026-11-27 corrective audit
GitHub Actions [browser run 46044702302](https://github.com/euclidi/euclidi-games/actions/runs/46044702302): logic step passed; npm installed Phaser and Playwright, but Playwright 1.56.1 rejected Ubuntu 26.04 before browser execution. Pinned workflow to Ubuntu 24.04. [Documentation run 46044702347](https://github.com/euclidi/euclidi-games/actions/runs/46044702347): missing Innuendo Town root README links plus existing issues in unrelated projects. Added project links and required catalog-return anchor; unrelated projects not modified. Retest results pending. No browser screenshots or playable release verified.

## 2026-11-27 browser and art audit — 0.5 development
- [Run 46045024746](https://github.com/euclidi/euclidi-games/actions/runs/46045024746): desktop startup, public-control navigation into Meat Market, completed paid sorting shift, persisted wages across reload, mobile startup, no captured page exceptions. Actual screenshots inspected; failed visual quality due to incorrect tiles and sparse layout.
- Commit a79e99cd: rebuilt continuous asphalt, pavement, storefront walls and roof treatment, furnishings, crosswalks and street detailing. [Run 46045246832](https://github.com/euclidi/euclidi-games/actions/runs/46045246832) completed browser smoke step successfully. [Actual screenshots](https://github.com/euclidi/euclidi-games/actions/runs/46045246832/artifacts/15222065875) inspected. Improved composition, but car sprite fragments, simplistic furniture, and camera framing remain deficient.
- Commit 5b55b771: center interiors and make mobile canvas 480×360 with larger outdoor zoom. Syntax passed; this camera revision has not yet passed browser verification.
- Documentation audit no longer identifies Innuendo Town missing links. Existing failures in unrelated games remain untouched. No cover is approved for catalog use and no public release exists. Remaining full-scope playtest, corrected vehicle atlas extraction, stronger art, interactions, audio and performance checks are mandatory.
