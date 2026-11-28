extends Camera3D
## Free camera: hold right mouse button to look, WASD to move, Q/E down/up, Shift = fast.
## F opens / closes every moving part of the scene (doors, gates, covers, wheels, levers).

@export var speed := 6.0
var _look := false

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_RIGHT:
		_look = event.pressed
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED if _look else Input.MOUSE_MODE_VISIBLE
	elif event is InputEventMouseMotion and _look:
		rotation.y -= event.relative.x * 0.003
		rotation.x = clamp(rotation.x - event.relative.y * 0.003, -1.5, 1.5)
	elif event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_F:
		get_tree().call_group("kit_movers", "toggle")

func _process(delta: float) -> void:
	var d := Vector3.ZERO
	if Input.is_key_pressed(KEY_W): d -= transform.basis.z
	if Input.is_key_pressed(KEY_S): d += transform.basis.z
	if Input.is_key_pressed(KEY_A): d -= transform.basis.x
	if Input.is_key_pressed(KEY_D): d += transform.basis.x
	if Input.is_key_pressed(KEY_E): d += Vector3.UP
	if Input.is_key_pressed(KEY_Q): d -= Vector3.UP
	var s := speed * (3.0 if Input.is_key_pressed(KEY_SHIFT) else 1.0)
	position += d.normalized() * s * delta
