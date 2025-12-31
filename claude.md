# Project Guidelines for Claude

## Notifications

Play a system ping sound (`afplay /System/Library/Sounds/Ping.aiff`) when:
- Finishing a long-running task
- Needing user input or asking a question
- Encountering an error that blocks progress

## Tech Stack

- **Framework:** Next.js 16 with React 19, TypeScript 5, App Router
- **Game Engine:** Phaser 3.90 (loaded dynamically, no SSR)
- **Styling:** Tailwind CSS 4 + custom RCT1-themed CSS
- **GIF Support:** gifuct-js for character animations

## Commands

```bash
npm run dev     # Development server (localhost:3000)
npm run build   # Production build
npm run lint    # ESLint
```

## Project Structure

```
/app
  /components
    /game
      /phaser           # Phaser game engine code
        MainScene.ts      # Core scene: rendering, input, entity management
        TrafficManager.ts # Car spawning, movement, collision detection
        PhaserGame.tsx    # React wrapper with imperative handle
      GameBoard.tsx     # Main React component, grid state
      types.ts          # Enums: TileType, ToolType, Direction
      roadUtils.ts      # Road lane helpers, direction vectors
    /ui               # React UI components (ToolWindow, Modal, etc.)
  /data
    buildings.ts      # Building registry (single source of truth)
  /utils
    sounds.ts         # Audio effects
/public
  /Building           # Building sprites by category
  /Tiles              # Ground tiles (grass, road, asphalt, snow)
  /Characters         # Walking GIF animations (4 directions)
  /cars               # Vehicle sprites (4 directions)
```

## Architecture

**React-Phaser Communication:**
- React manages: grid state (128x128), UI, tool selection
- Phaser manages: rendering, characters, cars, animations
- React → Phaser: via ref methods (`spawnCharacter()`, `shakeScreen()`)
- Phaser → React: via callbacks (`onTileClick`, `onTilesDrag`)

**Manager Pattern:**
Game logic is organized into focused manager classes for extensibility and performance:
- `TrafficManager` - Car spawning, track-based movement, collision detection, player car
- Future: `CitizenManager` - Character spawning, pathfinding, destinations
- Future: `BuildingManager` - Building state, upgrades, effects
- Future: `SimulationManager` - Orchestrates all managers, handles simulation tick

Managers are data-oriented (arrays of plain objects, not class instances) for cache-friendly iteration over large cities. MainScene owns manager instances and delegates entity updates to them.

**Traffic System:**
Cars use track-based movement like trains on rails:
- Cars locked to 2x2 road lane centers (ROAD_LANE_SIZE = 2)
- Movement follows lane direction automatically
- Same-lane collision detection queues cars behind each other
- Dead ends: cars stop at lane center, don't loop

**Isometric System:**
- Tile size: 44x22 pixels (SUBTILE_WIDTH/HEIGHT)
- Roads snap to 2x2 lane segments
- Depth sorting: `depth = (x + y) * DEPTH_Y_MULT`

## Key Files to Modify

| Task | File |
|------|------|
| Add new buildings | `app/data/buildings.ts` |
| Game logic/rendering | `app/components/game/phaser/MainScene.ts` |
| Car/traffic behavior | `app/components/game/phaser/TrafficManager.ts` |
| UI/grid state | `app/components/game/GameBoard.tsx` |
| Types/enums | `app/components/game/types.ts` |
| Road lane helpers | `app/components/game/roadUtils.ts` |

## Adding Buildings

Buildings are defined in `app/data/buildings.ts`. Structure:

```typescript
"building-id": {
  id: "building-id",
  name: "Display Name",
  category: "residential" | "commercial" | "civic" | "landmark" | "props" | "christmas",
  footprint: { south: [width, height], east: [width, height], ... },
  sprites: {
    south: "/Building/category/WxHname_south.png",
    east: "/Building/category/WxHname_east.png",
    // ... other orientations
  },
  icon: "/Building/category/WxHname_south.png",
  canRotate: true | false
}
```

**Sprite naming convention:** `{width}x{height}{name}_{direction}.png`

## Phaser Resources

When troubleshooting Phaser issues, check these resources first:

- **Official Examples:** https://phaser.io/examples/v3.85.0 (searchable, covers most use cases)
- **API Docs:** https://newdocs.phaser.io/docs/3.90.0
- **Community Forum:** https://phaser.discourse.group

Common solutions exist for: camera zoom/pan, input handling, tilemaps, physics, animations.

## Code Conventions

- Components: PascalCase
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Building IDs: kebab-case
- Enums: PascalCase values

## Grid Cell Structure

```typescript
{
  type: TileType,
  x, y: number,
  isOrigin?: boolean,        // Top-left of multi-cell building
  originX?, originY?: number,
  buildingId?: string,
  buildingOrientation?: Direction,
  underlyingTileType?: TileType  // For props preserving ground
}
```

## Save/Load

Saves to localStorage as JSON with: grid, character count, car count, zoom level, visual settings, timestamp.

## Performance

**Current optimizations:**
- Canvas sized to viewport (not full world) - renders ~2M pixels instead of 18M
- Grid uses direct mutation with `markTilesDirty()` pattern - O(1) updates instead of O(n²) copies
- Reusable arrays for car lists (`getAllCars()`) - avoids GC pressure from spreading every frame
- FPS syncs with monitor refresh rate via requestAnimationFrame

**Why repetition is good:**
WebGL batches draw calls by texture. 100 unique sprites × 10,000 uses ≈ 100 draw calls. Same building placed 50 times = 1 draw call for all 50. This is the ideal pattern for city builders.

**Future optimization opportunities (when needed):**
- **Ground tiles:** Currently 16K individual sprites. Could use Phaser Tilemap for 1 draw call. Worth doing once tile designs stabilize.
- **Blitter:** For many identical sprites (trees, props), Blitter batches into single draw call without tilemap refactor.
- **LOD:** At far zoom, could swap detailed buildings for simpler sprites.
- **Chunked rendering:** Only render visible chunks of the map.

**Watch out for:**
- Depth sorting gets expensive with 1000+ buildings (sorts every frame)
- Pathfinding/collision scales with entity count (characters, cars)
- Creating new arrays/objects in update loop causes GC stutters
- Each unique texture = potential new draw call batch
