extends SceneTree
## Windowed capture: godot --path godot_demo --script res://tools/screenshot.gd -- <scene> <out.png> [px py pz rx ry] [open]
## Optional camera position / rotation (radians); "open" toggles every moving part and waits for them.
var _frames := 0
var _out := ""
var _wait := 30

func _initialize() -> void:
	var a := OS.get_cmdline_user_args()
	var inst: Node = load(a[0]).instantiate()
	_out = a[1]
	root.add_child(inst)
	if a.size() >= 7:
		if inst.has_node("Ceiling"):
			inst.get_node("Ceiling").visible = true
		var cam: Camera3D = inst.get_node("FlyCamera")
		cam.position = Vector3(float(a[2]), float(a[3]), float(a[4]))
		cam.rotation = Vector3(float(a[5]), float(a[6]), 0)
	if a.has("open"):
		_wait = 200

func _process(_d: float) -> bool:
	_frames += 1
	if _frames == 10 and _wait > 30:
		root.get_tree().call_group("kit_movers", "toggle")
	if _frames == _wait:
		root.get_texture().get_image().save_png(_out)
		print("saved ", _out)
		return true
	return false
