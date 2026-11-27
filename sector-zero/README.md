# Sector Zero

Observe, possess and intervene in a living dystopian city whose citizens, transport and institutions continue autonomously.

**Status:** Active — city simulation.

[Open browser build](https://euclidi.github.io/euclidi-games/sector-zero/) · [Game catalog](https://euclidi.github.io/euclidi-games/)

## Documentation

- [Development specification](SPEC.md) — scope, architecture and acceptance criteria.
- [Roadmap](ROADMAP.md) — outstanding work in priority order.
- [Current status](STATUS.md) — implementation and actual validation evidence.

## Controls

Drag to pan; Q/E rotate; scroll to zoom. Use on-screen Observe, Possess, Intervene, speed and camera controls. Controller is opt-in.

## Runtime

Target: Three.js/WebGL2, TypeScript/Vite, Rapier, bitECS, Recast, workers and IndexedDB. Shipped: bundled WebGL city runtime and urban-transit.js. Full original source tree is not recovered.

Serve the repository with a local HTTP server from its root (for example `python3 -m http.server 8000`) and open `http://localhost:8000/sector-zero/`. Use the hosted build for normal play. CDN-dependent builds need network access; 3D builds need a supported graphics context. Do not open module-based games via file://.

## Supporting records

- [Environmental integration notes](../sector-zero-patches/README.md)
- [Transit source](assets/urban-transit.js)

## Limitations

The current source implements six bus routes, 18 buses, 32 architecture variants, road-dependent vehicle speeds and one-transfer journeys. Browser validation is pending. Irregular streets, rail, deeper social systems, interior fidelity, full Recast integration, environmental integration and measured population performance require validation or development. The patch directory is not a playable release.

### Street infrastructure and underground transit

The city includes street-name and speed signs, all-way-stop junctions, crossing posts, utility distribution poles with sagging conductors, transformers and cabinets, streetlights, hydrants, benches, cycle racks, bins, storm drainage, manholes, bus shelters and arterial bus pullouts. The Transit Control panel includes infrastructure inventory, vehicle wait reasons, two metro corridors, nine entrances, four trains, train positions, rider counts and interchange journeys. Metro trips are simulated underground; an explorable underground scene is not yet implemented.

### Urban mobility development branch
This branch introduces dimensioned vehicle classes, acceleration and stopping-distance control, distance-based fuel consumption, class-based service destinations and personal travel modes. Fuel is replenished abstractly at trip completion; there is no physical filling station visit yet. Collector cycle lanes and bicycle routing are provisional. See STATUS for validation limits.
