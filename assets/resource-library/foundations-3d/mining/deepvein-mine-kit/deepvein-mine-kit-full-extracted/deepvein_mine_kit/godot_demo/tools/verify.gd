extends SceneTree
## Headless check: godot --headless --path godot_demo --script res://tools/verify.gd
## Loads every model, the moving-part scenes and the demo scenes; checks pivots, collisions and open()/close().
## Prints a report and exits 1 on failure.

func _initialize() -> void:
	var fails := 0
	var info: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://pieces.json"))
	var depth: float = -float(info["_kit"]["depth"]) - 0.01
	var floor_top: float = float(info["_kit"]["floor_top"])   # grass tufts may stick out of a ground tile
	var files := []
	for f in DirAccess.open("res://models").get_files():
		if f.ends_with(".glb"):
			files.append(f)
	files.sort()
	for f in files:
		var ps: PackedScene = load("res://models/" + f)
		if ps == null:
			print("FAIL load ", f); fails += 1; continue
		var n: Node3D = ps.instantiate()
		root.add_child(n)
		var aabb := AABB(); var first := true; var meshes := 0; var bodies := 0; var shapes := 0
		for c in n.find_children("*", "", true, false):
			if c is MeshInstance3D:
				meshes += 1
				var t := Transform3D()
				var p: Node = c
				while p != n:
					t = (p as Node3D).transform * t
					p = p.get_parent()
				var a: AABB = t * c.mesh.get_aabb()
				aabb = a if first else aabb.merge(a); first = false
			elif c is StaticBody3D:
				bodies += 1
			elif c is CollisionShape3D and c.shape != null:
				shapes += 1
		var place: String = info[f.get_basename()]["placement"]
		var ok: bool = meshes == 1 and bodies >= 1 and shapes >= 1
		var low: float = aabb.position.y
		match place:
			"ground":   # props and structure that stand on the floor: bottom at 0 (loose stones may sink 6 cm)
				ok = ok and low <= 0.01 and low >= -0.06
			"floor":    # floor tiles: walkable top at 0 (kerbs, tufts up to floor_top), nothing deeper than the kit depth
				ok = ok and aabb.end.y <= floor_top and low >= depth
			"below":    # walls, wall feet, bridges, gates: start at or below 0, not deeper than the kit depth
				ok = ok and low <= 0.01 and low >= depth
			"decor":    # wall decor uses the wall transform: above the floor
				ok = ok and low >= 0.0
			"ceiling":  # ceiling tiles: placed at height 4, bottom close to 0
				ok = ok and low >= -0.2 and low <= 0.1
			"hanging":  # hangs below its pivot
				ok = ok and aabb.end.y <= 0.03
		print("%s %-34s %-8s meshes=%d bodies=%d shapes=%d min_y=%.3f size=%s" % ["OK  " if ok else "FAIL", f, place, meshes, bodies, shapes, low, str(aabb.size.snapped(Vector3.ONE * 0.01))])
		if not ok: fails += 1
		n.free()
	# moving parts: open, then close, instantly; the Part must move and come back
	for f in DirAccess.open("res://scenes").get_files():
		if not f.ends_with(".tscn"):
			continue
		var m: Node3D = (load("res://scenes/" + f) as PackedScene).instantiate()
		root.add_child(m)
		m._setup()
		var part: Node3D = m.get_node("Part")
		var rest := part.transform
		m._apply(0.5)   # half way: a wheel that turns a full 360 degrees is back at rest when fully open
		var moved := not part.transform.is_equal_approx(rest)
		m.set_open_instant(true)
		m.set_open_instant(false)
		var back := part.transform.is_equal_approx(rest)
		var api := m.has_method("open") and m.has_method("close") and m.has_method("toggle")
		var ok := moved and back and api and m.is_in_group("kit_movers")
		print("%s mover %-28s moved=%s back=%s" % ["OK  " if ok else "FAIL", f, moved, back])
		if not ok: fails += 1
		m.free()
	for s in ["res://demo_mine.tscn", "res://catalog.tscn"]:
		var ps: PackedScene = load(s)
		if ps == null:
			print("FAIL scene ", s); fails += 1; continue
		var inst := ps.instantiate()
		root.add_child(inst)
		var level := inst.get_node_or_null("Level")
		var lights := inst.find_children("*", "OmniLight3D", true, false).size()
		var movers := inst.find_children("*", "", true, false).filter(func(x): return x.has_method("toggle")).size()
		var count := level.get_child_count() if level else inst.get_child_count()
		print("SCENE %s nodes=%d omni_lights=%d movers=%d" % [s, count, lights, movers])
		inst.free()
	print("RESULT fails=%d models=%d" % [fails, files.size()])
	quit(1 if fails else 0)
