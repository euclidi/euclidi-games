@tool
class_name FootIKLite
extends SkeletonModifier3D
## Foot IK Grounder Lite: keeps both feet of an animated humanoid on the ground.
##
## One ray per foot, a simple two-bone leg IK and a hips drop so the lower
## foot can reach. Add it as a child of your Skeleton3D, after anything else
## that poses the skeleton.
##
## The full Foot IK Grounder adds foot rotation to the slope, whole-foot
## clearance from the skinned mesh (no toes in step edges), swing look-ahead,
## per-part smoothing, a debug view, a live tuning panel and 82 tests:
## https://dangalg.itch.io/foot-ik-grounder-godot

## Physics layers of your floor and level geometry.
@export_flags_3d_physics var ground_mask: int = 1
## Extra ray length below the foot (m).
@export var ankle_height: float = 0.08
## How far down (m) below the animated foot a ray looks for ground.
@export var max_reach_down: float = 0.45
## Most the hips may go down (m) so the lower foot reaches.
@export var max_hips_drop: float = 0.35
## Follow speed of feet and hips (1/s). Higher is snappier.
@export var follow_speed: float = 14.0
## Bone names. Leave empty to auto-detect (Rigify/Quaternius, Mixamo, Godot humanoid).
@export var hips_bone: String = ""
@export var left_leg: PackedStringArray = PackedStringArray()   # thigh, shin, foot
@export var right_leg: PackedStringArray = PackedStringArray()  # thigh, shin, foot

const _AUTO := {
	"hips": ["DEF-hips", "mixamorig:Hips", "Hips", "hips", "pelvis"],
	"l": [["DEF-thigh.L", "DEF-shin.L", "DEF-foot.L"], ["mixamorig:LeftUpLeg", "mixamorig:LeftLeg", "mixamorig:LeftFoot"], ["LeftUpperLeg", "LeftLowerLeg", "LeftFoot"]],
	"r": [["DEF-thigh.R", "DEF-shin.R", "DEF-foot.R"], ["mixamorig:RightUpLeg", "mixamorig:RightLeg", "mixamorig:RightFoot"], ["RightUpperLeg", "RightLowerLeg", "RightFoot"]],
}

var _hips: int = -1
var _legs: Array = []  # [[thigh, shin, foot], [..]]
var _offset: Array[float] = [0.0, 0.0]  # smoothed foot offsets (m, along world up)
var _hips_off: float = 0.0
var _ready_ok: bool = false
## World positions of the left and right ankle after the last solve (for footsteps, tests).
var last_feet: PackedVector3Array = PackedVector3Array([Vector3.ZERO, Vector3.ZERO])


## True once the hips and both legs were found.
func is_set_up() -> bool:
	return _ready_ok


func _find(skel: Skeleton3D) -> bool:
	_hips = skel.find_bone(hips_bone) if hips_bone != "" else -1
	if _hips < 0:
		for n: String in _AUTO["hips"]:
			_hips = skel.find_bone(n)
			if _hips >= 0:
				break
	_legs.clear()
	for side: String in ["l", "r"]:
		var given: PackedStringArray = left_leg if side == "l" else right_leg
		var options: Array = [given] if given.size() == 3 else _AUTO[side]
		var leg: Array = []
		for names: Variant in options:
			leg = [skel.find_bone(names[0]), skel.find_bone(names[1]), skel.find_bone(names[2])]
			if leg.min() >= 0:
				break
		if leg.is_empty() or leg.min() < 0:
			push_warning("FootIKLite: could not find the %s leg bones; set them by name." % side)
			return false
		_legs.append(leg)
	return _hips >= 0


func _process_modification() -> void:
	var skel: Skeleton3D = get_skeleton()
	if skel == null:
		return
	if not _ready_ok:
		_ready_ok = _find(skel)
		if not _ready_ok:
			return
	var world: Transform3D = skel.global_transform
	var inv: Transform3D = world.affine_inverse()
	var space := skel.get_world_3d().direct_space_state if skel.is_inside_tree() else null
	if space == null:
		return
	var dt: float = 1.0 / maxf(Engine.physics_ticks_per_second, 1)
	var w: float = 1.0 - exp(-follow_speed * dt)
	var up_w := Vector3.UP
	var excl: Array[RID] = []
	var p: Node = skel.get_parent()
	while p != null:
		if p is CollisionObject3D:
			excl.append((p as CollisionObject3D).get_rid())
			break
		p = p.get_parent()

	# 1. Where should each foot be? One ray per foot.
	var targets: Array[float] = [0.0, 0.0]
	for i: int in 2:
		var foot_w: Vector3 = world * skel.get_bone_global_pose(_legs[i][2]).origin
		var q := PhysicsRayQueryParameters3D.create(foot_w + up_w * 0.5, foot_w - up_w * (max_reach_down + ankle_height))
		q.collision_mask = ground_mask
		q.exclude = excl
		var hit: Dictionary = space.intersect_ray(q)
		if hit.is_empty():
			targets[i] = 0.0
		else:
			# Ground height relative to the character's root (where the animation assumes the floor is).
			targets[i] = clampf((hit.position as Vector3).y - world.origin.y, -max_reach_down, 0.5)
		_offset[i] = lerpf(_offset[i], targets[i], w)

	# 2. Hips go down by the lower foot's need.
	var need: float = clampf(minf(minf(_offset[0], _offset[1]), 0.0), -max_hips_drop, 0.0)
	_hips_off = lerpf(_hips_off, need, w)
	var hips_g: Transform3D = skel.get_bone_global_pose(_hips)
	hips_g.origin += inv.basis * (up_w * _hips_off)
	skel.set_bone_global_pose(_hips, hips_g)

	# 3. Two-bone IK puts each ankle at its target.
	for i: int in 2:
		var leg: Array = _legs[i]
		var foot_g: Transform3D = skel.get_bone_global_pose(leg[2])
		var foot_world: Vector3 = world * foot_g.origin
		var target: Vector3 = inv * (foot_world + up_w * (_offset[i] - _hips_off))
		_solve(skel, leg, target, foot_g.basis)
		last_feet[i] = world * skel.get_bone_global_pose(leg[2]).origin


func _solve(skel: Skeleton3D, leg: Array, target: Vector3, foot_basis: Basis) -> void:
	var tg: Transform3D = skel.get_bone_global_pose(leg[0])
	var sg: Transform3D = skel.get_bone_global_pose(leg[1])
	var fg: Transform3D = skel.get_bone_global_pose(leg[2])
	var a: Vector3 = tg.origin
	var b: Vector3 = sg.origin
	var c: Vector3 = fg.origin
	var l1: float = a.distance_to(b)
	var l2: float = b.distance_to(c)
	if l1 < 1e-4 or l2 < 1e-4:
		return
	var to_t: Vector3 = target - a
	var d: float = clampf(to_t.length(), absf(l1 - l2) + 1e-3, (l1 + l2) * 0.999)
	var dir: Vector3 = to_t.normalized()
	var n: Vector3 = (c - a).cross(b - a)
	if n.length_squared() < 1e-8:
		n = tg.basis.x  # straight leg: bend around the thigh's side axis
	n = n.normalized()
	var alpha: float = acos(clampf((l1 * l1 + d * d - l2 * l2) / (2.0 * l1 * d), -1.0, 1.0))
	var knee: Vector3 = a + dir.rotated(n, alpha) * l1
	var ankle: Vector3 = a + dir * d
	# Thigh
	var r1: Basis = _arc(b - a, knee - a)
	var tg2 := Transform3D(r1 * tg.basis, a)
	skel.set_bone_global_pose(leg[0], tg2)
	# Shin (its child offset follows the thigh)
	var sg_now: Transform3D = skel.get_bone_global_pose(leg[1])
	var c_now: Vector3 = skel.get_bone_global_pose(leg[2]).origin
	var r2: Basis = _arc(c_now - sg_now.origin, ankle - sg_now.origin)
	skel.set_bone_global_pose(leg[1], Transform3D(r2 * sg_now.basis, sg_now.origin))
	# Foot keeps its animated orientation.
	var f_now: Transform3D = skel.get_bone_global_pose(leg[2])
	skel.set_bone_global_pose(leg[2], Transform3D(foot_basis, f_now.origin))


static func _arc(from: Vector3, to: Vector3) -> Basis:
	var f: Vector3 = from.normalized()
	var t: Vector3 = to.normalized()
	var axis: Vector3 = f.cross(t)
	var s: float = axis.length()
	if s < 1e-6:
		return Basis()
	return Basis(axis / s, atan2(s, f.dot(t)))
