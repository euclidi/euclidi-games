/**
 * Passive ragdoll for Quaternius Universal Base Characters (Standard, Godot/UE).
 * Accepts a Three.js scene instance and an initialized Rapier world.
 */
const bodyPlan = [
  ["pelvis", null, "spine_01", 0.116],
  ["spine_03", "pelvis", "neck_01", 0.130],
  ["Head", "spine_03", null, 0.091],
];

for (const side of ["l", "r"]) {
  bodyPlan.push(
    ["upperarm_" + side, "spine_03", "lowerarm_" + side, 0.053],
    ["lowerarm_" + side, "upperarm_" + side, "hand_" + side, 0.042],
    ["hand_" + side, "lowerarm_" + side, "middle_01_" + side, 0.036],
    ["thigh_" + side, "pelvis", "calf_" + side, 0.078],
    ["calf_" + side, "thigh_" + side, "foot_" + side, 0.052],
    ["foot_" + side, "calf_" + side, "ball_" + side, 0.043],
  );
}

export function createQuaterniusRagdoll(root, world, RAPIER, options = {}) {
  const bones = new Map();
  root.traverse((object) => {
    if (object.isBone) {
      if (bones.has(object.name)) throw new Error("Use one character instance per ragdoll");
      bones.set(object.name, object);
    }
  });
  root.updateWorldMatrix(true, true);
  const vector = root.position.clone().set(0, 0, 0);
  const quaternion = root.quaternion.clone().identity();
  const positions = new Map();
  const bodyData = bodyPlan.map(([name, parent, tip, radius]) => {
    const bone = bones.get(name);
    if (!bone?.parent || (tip && !bones.has(tip))) throw new Error("Missing rig bone for " + name);
    const position = bone.getWorldPosition(vector.clone());
    const rotation = bone.getWorldQuaternion(quaternion.clone());
    const scale = bone.getWorldScale(vector.clone());
    if (![scale.x, scale.y, scale.z].every((axis) => Math.abs(axis - scale.x) < 0.0001) || scale.x <= 0) {
      throw new Error("Ragdoll bones require positive uniform scale");
    }
    positions.set(name, position);
    const segment = tip
      ? bones.get(tip).getWorldPosition(vector.clone()).sub(position).applyQuaternion(rotation.clone().invert())
      : vector.clone().set(0, radius * scale.x, 0);
    if (segment.lengthSq() < 1e-8) throw new Error("Zero length segment for " + name);
    return { name, parent, bone, position, rotation, segment, radius: radius * scale.x };
  });

  const segments = new Map();
  const groups = options.collisionGroups ?? 0x00020001;
  const localPosition = vector.clone();
  const worldRotation = quaternion.clone();
  const parentRotation = quaternion.clone();
  let disposed = false;
  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const { body } of segments.values()) world.removeRigidBody(body);
    segments.clear();
  }

  try {
    for (const data of bodyData) {
      const { name, parent, position, rotation, segment, radius } = data;
      const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(position.x, position.y, position.z).setRotation(rotation)
        .setLinearDamping(0.4).setAngularDamping(0.9).setCcdEnabled(true));
      segments.set(name, { ...data, body });
      const center = segment.clone().multiplyScalar(0.48);
      const axis = quaternion.clone().setFromUnitVectors(vector.clone().set(0, 1, 0), segment.clone().normalize());
      const halfLength = Math.max(segment.length() * 0.46 - radius, 0);
      const collider = halfLength > 0
        ? RAPIER.ColliderDesc.capsule(halfLength, radius)
        : RAPIER.ColliderDesc.ball(radius);
      world.createCollider(collider.setTranslation(center.x, center.y, center.z).setRotation(axis)
        .setDensity(35).setFriction(0.65).setCollisionGroups(groups), body);
      if (parent) {
        const upstream = segments.get(parent);
        const anchor = positions.get(name).clone().sub(upstream.position)
          .applyQuaternion(upstream.rotation.clone().invert());
        world.createImpulseJoint(RAPIER.JointData.spherical(anchor, vector), upstream.body, body, true);
      }
    }
  } catch (error) {
    dispose();
    throw error;
  }

  return {
    bodies: Object.freeze(Object.fromEntries([...segments].map(([name, entry]) => [name, entry.body]))),
    sync() {
      if (disposed) return;
      for (const { bone, body } of segments.values()) {
        const position = body.translation();
        localPosition.set(position.x, position.y, position.z);
        bone.position.copy(bone.parent.worldToLocal(localPosition));
        const rotation = body.rotation();
        worldRotation.set(rotation.x, rotation.y, rotation.z, rotation.w);
        bone.parent.getWorldQuaternion(parentRotation);
        bone.quaternion.copy(parentRotation.invert().multiply(worldRotation));
        bone.updateWorldMatrix(false, false);
      }
    },
    dispose,
  };
}
