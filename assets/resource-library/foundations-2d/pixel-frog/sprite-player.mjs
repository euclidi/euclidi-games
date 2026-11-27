/**
 * Play horizontal strips indexed by character-strips.json.
 * The caller loads the selected image and supplies elapsed seconds from its game clock.
 */
export function createSpritePlayer(character, defaultFps = 12) {
  if (!character || !Number.isFinite(defaultFps) || defaultFps <= 0) {
    throw new TypeError("Expected a character entry and a positive frame rate");
  }

  let active;
  let clip;
  let clock = 0;
  let rate = defaultFps;
  let loop = true;

  return {
    play(name, options = {}) {
      const next = Object.hasOwn(character, name) ? character[name] : undefined;
      const fps = options.fps ?? defaultFps;
      const shouldLoop = options.loop ?? true;
      if (!next || !Number.isSafeInteger(next.frame_count) || next.frame_count < 1 ||
          typeof next.path_in_zip !== "string" || !Number.isFinite(fps) || fps <= 0) {
        throw new RangeError("Invalid strip or frame rate: " + name);
      }
      if (active !== name || rate !== fps || loop !== shouldLoop || options.restart) clock = 0;
      active = name;
      clip = next;
      rate = fps;
      loop = shouldLoop;
    },

    advance(elapsedSeconds = 0) {
      if (!clip) throw new Error("Select a clip before advancing");
      if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) {
        throw new RangeError("Elapsed seconds must be finite and nonnegative");
      }
      const duration = clip.frame_count / rate;
      if (!Number.isFinite(duration) || duration <= 0) throw new RangeError("Invalid clip duration");
      if (loop) {
        const remainder = elapsedSeconds % duration;
        clock = (clock + remainder) % duration;
      } else {
        clock = Math.min(clock + elapsedSeconds, duration);
      }
      const frame = Math.min(Math.floor(clock * rate), clip.frame_count - 1);
      return {
        pathInZip: clip.path_in_zip, frame, x: frame * 32, y: 0, width: 32, height: 32,
        ended: !loop && clock >= duration,
      };
    },
  };
}
