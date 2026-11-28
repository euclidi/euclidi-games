extends Node3D
## Opens and closes a moving part of the kit (door, gate, cover, wheel, lever).
## The model is the child node named "Part"; its pivot is on the hinge or slide axis.
## Call open(), close() or toggle() from your own code (a trigger, a lever, a key...).

signal opened
signal closed

enum Motion { ROTATE, SLIDE }

@export var motion: Motion = Motion.ROTATE
## Axis in this node's space: the hinge axis (ROTATE) or the slide direction (SLIDE).
@export var axis := Vector3.UP
## Degrees (ROTATE) or metres (SLIDE) when fully open.
@export var open_amount := 90.0
## Seconds for a full open or close.
@export var duration := 1.0
@export var start_open := false

var is_open := false
var _t := 0.0
var _rest := Transform3D()
var _tween: Tween
var _part: Node3D

func _ready() -> void:
	_setup()
	if start_open:
		set_open_instant(true)

func _setup() -> void:
	if _part == null:
		_part = $Part
		_rest = _part.transform
		add_to_group("kit_movers")

func open() -> void:
	_go(true)

func close() -> void:
	_go(false)

func toggle() -> void:
	_go(not is_open)

## Jumps to the open or closed pose without animation.
func set_open_instant(value: bool) -> void:
	if _tween:
		_tween.kill()
	is_open = value
	_apply(1.0 if value else 0.0)

func _go(value: bool) -> void:
	if value == is_open and not (_tween and _tween.is_running()):
		return
	is_open = value
	if _tween:
		_tween.kill()
	var target := 1.0 if value else 0.0
	_tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	_tween.tween_method(_apply, _t, target, max(0.05, duration * abs(target - _t)))
	_tween.finished.connect(func(): (opened if value else closed).emit())

func _apply(t: float) -> void:
	_setup()
	_t = t
	if motion == Motion.ROTATE:
		_part.transform = Transform3D(Basis(axis.normalized(), deg_to_rad(open_amount * t)) * _rest.basis, _rest.origin)
	else:
		_part.transform = Transform3D(_rest.basis, _rest.origin + axis.normalized() * open_amount * t)
