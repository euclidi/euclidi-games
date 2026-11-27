/** A cosmetic game projectile with a swept hit query supplied by the caller. */
export function createArcadeProjectile({ origin, velocity, acceleration = [0, 0, 0], lifetime = 3 }) {
  const vectors = [origin, velocity, acceleration];
  if (vectors.some((vector) => !Array.isArray(vector) || vector.length !== 3 ||
      ![0, 1, 2].every((axis) => Number.isFinite(vector[axis]))) ||
      !Number.isFinite(lifetime) || lifetime <= 0) {
    throw new TypeError("Expected three finite game-space vectors and a positive lifetime");
  }

  let point = origin.slice();
  let speed = velocity.slice();
  const force = acceleration.slice();
  let remaining = lifetime;
  let status = "flying";

  return {
    get position() {
      return point.slice();
    },

    step(seconds, traceSegment) {
      if (!Number.isFinite(seconds) || seconds < 0 || typeof traceSegment !== "function") {
        throw new TypeError("Expected elapsed seconds and a segment query");
      }
      if (status !== "flying" || seconds === 0) return { status, position: point.slice() };

      const elapsed = Math.min(seconds, remaining);
      const next = point.map((value, i) => value + elapsed * (speed[i] + 0.5 * elapsed * force[i]));
      if (!next.every(Number.isFinite)) throw new RangeError("Projectile left finite game space");
      const hit = traceSegment(point.slice(), next.slice());
      if (hit != null) {
        if (!Number.isFinite(hit.fraction) || hit.fraction < 0 || hit.fraction > 1) {
          throw new RangeError("Hit fraction must be between zero and one");
        }
        point = point.map((value, i) => value + (next[i] - value) * hit.fraction);
        status = "hit";
        return { status, position: point.slice(), hit };
      }

      point = next;
      speed = speed.map((value, i) => value + elapsed * force[i]);
      remaining -= elapsed;
      if (remaining === 0) status = "expired";
      return { status, position: point.slice() };
    },
  };
}
