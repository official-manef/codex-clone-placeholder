export type Point = { x: number; y: number };
export type Direction = "up" | "right" | "down" | "left";
export type SnakeGame = {
  body: Point[];
  food: Point;
  direction: Direction;
  score: number;
  turns: number;
  finished: boolean;
  seed?: string;
  rng_state?: number;
};
export const SNAKE_SEED = "snake-v1";
export const SNAKE_RANDOM_REVISION = "xorshift32-empty-v1";
export const SNAKE_QUESTION_REVISION = "food-direction-v3";
export const SNAKE_MODEL = "laya-rl-agent / INT8";
export const SNAKE_QUESTIONS = {
  food_direction: {
    type: "choice",
    instructions: "Where is the food relative to the snake?",
    criteria: {
      up: "The food is above the snake, to the north.",
      right: "The food is to the right of the snake, to the east.",
      down: "The food is below the snake, to the south.",
      left: "The food is to the left of the snake, to the west.",
    },
  },
};
export const SIZE = 12;
export const DIRECTIONS: Direction[] = ["up", "right", "down", "left"];
const DELTA: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};
const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  right: "left",
  down: "up",
  left: "right",
};
export const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

export function validSeed(seed: string): boolean {
  return /^[A-Za-z0-9_.-]{1,64}$/.test(seed);
}

export function randomSeed(): string {
  const values = new Uint32Array(4);
  globalThis.crypto.getRandomValues(values);
  return [...values].map((value) => value.toString(16).padStart(8, "0")).join("");
}

function seedState(seed: string): number {
  let state = 2166136261;
  for (let i = 0; i < seed.length; i++)
    state = Math.imul(state ^ seed.charCodeAt(i), 16777619) >>> 0;
  return state || 1;
}

function nextFood(body: Point[], state: number): { food: Point; rng_state: number } {
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  const rng_state = state >>> 0;
  const empty: Point[] = [];
  for (let cell = 0; cell < SIZE * SIZE; cell++) {
    const point = { x: cell % SIZE, y: Math.floor(cell / SIZE) };
    if (!body.some((part) => same(part, point))) empty.push(point);
  }
  return { food: empty[Math.floor((rng_state / 0x100000000) * empty.length)], rng_state };
}

export function createGame(seed = SNAKE_SEED): SnakeGame {
  if (!validSeed(seed))
    throw new Error("Use 1–64 letters, numbers, dots, underscores or hyphens for the seed.");
  const game: SnakeGame = {
    body: [
      { x: 4, y: 6 },
      { x: 3, y: 6 },
      { x: 2, y: 6 },
    ],
    food: { x: 8, y: 6 },
    direction: "right",
    score: 0,
    turns: 0,
    finished: false,
  };
  // Preserve historical recordings/harness inputs. New UI rounds use explicit
  // random seeds; their PRNG state travels with every board for exact replay.
  return seed === SNAKE_SEED ? game : { ...game, seed, ...nextFood(game.body, seedState(seed)) };
}

export function destination(game: SnakeGame, direction: Direction): Point {
  const delta = DELTA[direction];
  return { x: game.body[0].x + delta.x, y: game.body[0].y + delta.y };
}

export function isSafe(game: SnakeGame, direction: Direction): boolean {
  if (game.finished || direction === OPPOSITE[game.direction]) return false;
  const point = destination(game, direction);
  if (point.x < 0 || point.x >= SIZE || point.y < 0 || point.y >= SIZE) return false;
  const growing = same(point, game.food);
  // The tail moves away on a non-eating turn, so entering that square is legal.
  const occupied = growing ? game.body : game.body.slice(0, -1);
  return !occupied.some((part) => same(point, part));
}

export function directionToFood(game: SnakeGame): Direction {
  const dx = game.food.x - game.body[0].x;
  const dy = game.food.y - game.body[0].y;
  return Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? "right" : "left") : dy >= 0 ? "down" : "up";
}

export function chooseMove(
  game: SnakeGame,
  perceived: string,
): { direction: Direction | null; overridden: boolean; reason: string } {
  const proposed = DIRECTIONS.includes(perceived as Direction) ? (perceived as Direction) : null;
  if (proposed && isSafe(game, proposed))
    return { direction: proposed, overridden: false, reason: "Food direction is a legal move." };
  const safe = DIRECTIONS.filter((direction) => isSafe(game, direction));
  safe.sort((a, b) => {
    const pointA = destination(game, a),
      pointB = destination(game, b);
    const distance = (point: Point) =>
      Math.abs(point.x - game.food.x) + Math.abs(point.y - game.food.y);
    return distance(pointA) - distance(pointB);
  });
  return {
    direction: safe[0] ?? null,
    overridden: true,
    reason: safe.length
      ? "Safety policy avoided a wall, the body or a reverse turn."
      : "No legal move remains. The round is complete.",
  };
}

export function advance(game: SnakeGame, direction: Direction): SnakeGame {
  if (!isSafe(game, direction)) return { ...game, finished: true };
  const head = destination(game, direction);
  const ate = same(head, game.food);
  const body = [head, ...game.body];
  if (!ate) body.pop();
  const next = { ...game, body, direction, score: game.score + Number(ate), turns: game.turns + 1 };
  if (ate) {
    if (body.length === SIZE * SIZE) return { ...next, finished: true };
    if (game.rng_state !== undefined) return { ...next, ...nextFood(body, game.rng_state) };
    // Repeatable food placement makes a reset the same demo, not a benchmark.
    for (let i = 0; i < SIZE * SIZE; i++) {
      const cell = (game.score * 37 + 21 + i * 29) % (SIZE * SIZE);
      const food = { x: cell % SIZE, y: Math.floor(cell / SIZE) };
      if (!body.some((part) => same(part, food))) return { ...next, food };
    }
  }
  return next;
}

export function describeBoard(game: SnakeGame): string {
  // This is a text-classification demo, not an assertion of spatial reasoning.
  // The browser computes relative location and describes it in plain English.
  const descriptions: Record<Direction, string> = {
    up: "The food is above the snake head.",
    right: "The food is to the right of the snake head.",
    down: "The food is below the snake head.",
    left: "The food is to the left of the snake head.",
  };
  return descriptions[directionToFood(game)];
}

/** Rotate sequential comparison order while preserving one shared input per turn. */
export function comparisonOrder(ids: string[], turn: number): string[] {
  if (!ids.length) return [];
  const offset = ((turn % ids.length) + ids.length) % ids.length;
  return [...ids.slice(offset), ...ids.slice(0, offset)];
}

/** Fast mode deliberately contributes no waiting time to a device measurement. */
export function requestedDelay(pace: "fast" | "readable"): number {
  return pace === "readable" ? 200 : 0;
}
