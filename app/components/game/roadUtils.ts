import { TileType, GridCell, Direction, GRID_WIDTH, GRID_HEIGHT, ROAD_LANE_SIZE } from "./types";

// ============================================
// CONSTANTS
// ============================================

export { ROAD_LANE_SIZE };

// Direction vectors for movement
export const directionVectors: Record<Direction, { dx: number; dy: number }> = {
  [Direction.Up]: { dx: 0, dy: -1 },
  [Direction.Down]: { dx: 0, dy: 1 },
  [Direction.Left]: { dx: -1, dy: 0 },
  [Direction.Right]: { dx: 1, dy: 0 },
};

// Opposite directions
export const oppositeDirection: Record<Direction, Direction> = {
  [Direction.Up]: Direction.Down,
  [Direction.Down]: Direction.Up,
  [Direction.Left]: Direction.Right,
  [Direction.Right]: Direction.Left,
};

// Right turn: clockwise rotation
export const rightTurnDirection: Record<Direction, Direction> = {
  [Direction.Up]: Direction.Right,
  [Direction.Right]: Direction.Down,
  [Direction.Down]: Direction.Left,
  [Direction.Left]: Direction.Up,
};

// Check if a tile type is a road (any lane type)
export function isRoadTileType(type: TileType): boolean {
  return type === TileType.RoadLane || type === TileType.RoadTurn;
}

// ============================================
// CORE LANE FUNCTIONS
// ============================================

// Get the road lane origin (top-left of 2x2 block) for any grid position
export function getRoadLaneOrigin(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.floor(x / ROAD_LANE_SIZE) * ROAD_LANE_SIZE,
    y: Math.floor(y / ROAD_LANE_SIZE) * ROAD_LANE_SIZE,
  };
}

// Check if placing a road lane at (laneX, laneY) would be valid
export function canPlaceRoadLane(
  grid: GridCell[][],
  laneX: number,
  laneY: number,
  allowOverlap: boolean = false
): { valid: boolean; reason?: string } {
  if (
    laneX < 0 ||
    laneY < 0 ||
    laneX + ROAD_LANE_SIZE > GRID_WIDTH ||
    laneY + ROAD_LANE_SIZE > GRID_HEIGHT
  ) {
    return { valid: false, reason: "out_of_bounds" };
  }

  for (let dy = 0; dy < ROAD_LANE_SIZE; dy++) {
    for (let dx = 0; dx < ROAD_LANE_SIZE; dx++) {
      const px = laneX + dx;
      const py = laneY + dy;
      const cell = grid[py]?.[px];

      if (!cell) continue;

      const canPlace =
        cell.type === TileType.Grass ||
        cell.type === TileType.Asphalt ||
        (allowOverlap && isRoadTileType(cell.type));

      if (!canPlace) {
        return { valid: false, reason: "blocked" };
      }
    }
  }

  return { valid: true };
}

// Check if a 2x2 area contains a road lane at exact position
export function hasRoadLane(
  grid: GridCell[][],
  laneX: number,
  laneY: number
): boolean {
  if (
    laneX < 0 ||
    laneY < 0 ||
    laneX >= GRID_WIDTH ||
    laneY >= GRID_HEIGHT
  ) {
    return false;
  }

  const cell = grid[laneY]?.[laneX];
  return (
    isRoadTileType(cell?.type) &&
    cell?.isOrigin === true &&
    cell?.originX === laneX &&
    cell?.originY === laneY
  );
}

// Get arrow rotation angle for a direction (in degrees, for rendering)
export function getDirectionAngle(direction: Direction): number {
  switch (direction) {
    case Direction.Up: return -90;
    case Direction.Down: return 90;
    case Direction.Left: return 180;
    case Direction.Right: return 0;
  }
}

// Cycle through directions (for R key rotation)
export function cycleDirection(direction: Direction): Direction {
  switch (direction) {
    case Direction.Up: return Direction.Right;
    case Direction.Right: return Direction.Down;
    case Direction.Down: return Direction.Left;
    case Direction.Left: return Direction.Up;
  }
}

// ============================================
// SIMPLE NAVIGATION HELPERS
// ============================================

// Check if a position is walkable (sidewalk or tile)
export function isWalkable(grid: GridCell[][], x: number, y: number): boolean {
  const cell = grid[Math.floor(y)]?.[Math.floor(x)];
  return cell?.type === TileType.Sidewalk || cell?.type === TileType.Tile;
}

// Check if a position is drivable (road lane or asphalt)
export function isDrivable(grid: GridCell[][], x: number, y: number): boolean {
  const cell = grid[Math.floor(y)]?.[Math.floor(x)];
  return isRoadTileType(cell?.type) || cell?.type === TileType.Asphalt;
}
