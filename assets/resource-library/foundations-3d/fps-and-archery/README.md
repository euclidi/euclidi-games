# Ragdoll, archery, and first-person game assets

## Male and female full-body rigs

The [Quaternius base folder](../quaternius/base-characters-standard/) has the male and female Standard Godot/UE glTFs with their buffers and textures. Each has 65 skin joints. The existing [Universal Animation Libraries](../quaternius/animation-libraries/) provide locomotion and UAL1 pistol animation clips for engine retargeting.

[quaternius-ragdoll.mjs](quaternius-ragdoll.mjs) binds both bodies to 15 rigid bodies and 14 spherical joints in a Three.js and Rapier project. It starts from the current pose and accepts a positive uniform world scale. Stop animation and disable the character movement collider when entering ragdoll. Pass one loaded character root, an initialized Rapier world, and the Rapier namespace to createQuaterniusRagdoll. Step the shared world once per physics tick and call ragdoll.sync() before drawing. Call ragdoll.dispose() to remove the bodies and joints. To reset, restore the character pose with your animation system. The default collision groups admit level geometry in membership 1 and disable ragdoll self-contact.

This passive game ragdoll uses approximate collision volumes and freely rotating spherical joints. Recovery and per-joint motion limits belong in a game-specific controller. The rig was exercised with Three.js 0.180.0 and Rapier 0.17.3.

## Archery

- [Ranger.glb](kaykit/Characters/gltf/Ranger.glb) is a skinned 23-joint Rig Medium character.
- [Archery props](kaykit/Assets/gltf/) include a bow, a bow with string, two crossbows, loose arrows and bolts, bundles, and a quiver. Keep the glTF, BIN, and shared atlas together.
- [Combat Ranged](kaykit/character-animations-1.1/Animations/gltf/Rig_Medium/Rig_Medium_CombatRanged.glb) contains bow idle, draw, aiming and release, one- and two-handed ranged poses, and magic. [Movement Advanced](kaykit/character-animations-1.1/Animations/gltf/Rig_Medium/Rig_Medium_MovementAdvanced.glb) includes running while holding a bow. [General and Movement Basic](kaykit/Animations/gltf/Rig_Medium/) cover idle and walk cycles. Bind clips by bone name and hierarchy because the GLBs use different skin joint array orders.

Attach props to the Ranger's hand slots, align the model pivots in your engine, and emit the game projectile on the chosen release frame. The bow prop with string is static.

## FPS and projectiles

- [WRAD arms](wrad-arms/) includes a 50-joint skinned GLB, an editable Blender IK rig, and two texture variants. Use the Blender file to pose and bake viewmodel clips. Give the viewmodel its own camera-space rig and lighting.
- [Kenney blasters and foam projectile](../kenney/blaster-kit/) and [Stein firearm art FBXs](../stein-classic-weapons-1024/) are existing game props. Match each viewmodel's pose and prop socket in the target game.
- [arcade-projectile.mjs](arcade-projectile.mjs) tracks a virtual projectile in game coordinates. Supply origin, velocity, optional acceleration and lifetime. Step it on your fixed game tick with a scene query callback returning null for a miss or a hit with a fraction from zero to one. The module returns hit or expiration state and contact position. Put impact effects, sound, and game rules in the caller.

[File hashes and source records](sources.json) · [KayKit Adventurers](https://kaylousberg.itch.io/kaykit-adventurers) · [KayKit Character Animations](https://kaylousberg.itch.io/kaykit-character-animations) · [WRAD arms](https://github.com/wwwriks/wrad-arms)
