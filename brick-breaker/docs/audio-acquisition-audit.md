# Audio candidate acquisition — 2026-11-26

The replacement archive was acquired by GitHub Actions run 45908720201, asset-intake job success, artifact 15158479467. https://github.com/euclidi/euclidi-games/actions/runs/45908720201/artifacts/15158479467

Source: rubberduck, OpenGameArt, 75 CC0 breaking / falling / hit sfx. Publisher lists CC0; the archive contains 75 OGG files and no embedded license. Preserve publisher and attribution in the derived manifest. SHA256 e6ee04d91c5f4d30cfda1260d2c9d1faf96fda36319287215fbd07bcb1a80451.

All 75 files independently decoded with libsndfile in the analysis environment. 48000 Hz stereo throughout; durations 0.109–1.489 s; max absolute sample 0.90046; zero samples >=1; all samples finite, none silent. Groups by filename: rock 13, glass 12, metal 11, wood 9, general hit 13, falling 7, misc 7, breaking 3. No auditory suitability claim: no audition or playback validation has occurred.

New CI job converts exact archive to float32 WAV preserving decoded samples and checks each through the actual miniaudio native decoder. The job is unverified as of this commit. This avoids silently depending on a Vorbis decoder in miniaudio. Conversion is a derived candidate only, not production approval. The industrial sprite pack still fails fidelity review.
