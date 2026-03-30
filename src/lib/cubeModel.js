/**
 * Rubik's Cuboid state model — supports rectangular Nx×Ny×Nz shapes
 * with variable inner-tile widths.
 *
 * Each cubelet lives at integer grid coords [x, y, z] where:
 *   x ∈ [0, Nx-1], y ∈ [0, Ny-1], z ∈ [0, Nz-1]
 *
 * Face colors are keyed by axis+direction:
 *   px/nx = ±X (right/left), py/ny = ±Y (top/bottom), pz/nz = ±Z (front/back)
 */

export const FACE_COLORS = {
  px: '#ff4500', // right  – orange-red
  nx: '#ff8c00', // left   – orange
  py: '#ffffff', // top    – white
  ny: '#ffff00', // bottom – yellow
  pz: '#00aa00', // front  – green
  nz: '#0000cc', // back   – blue
};

const INSIDE = 'transparent';

// ---------------------------------------------------------------------------
// Layer geometry helpers
// ---------------------------------------------------------------------------

/**
 * Returns an array of widths for each layer along an axis of size N.
 * Edge layers always have width 1; inner layers have width `innerScale`.
 */
export function getLayerWidths(N, innerScale = 1) {
  if (N <= 1) return [1];
  if (N === 2) return [1, 1];
  return [1, ...Array(N - 2).fill(innerScale), 1];
}

/**
 * Given an array of widths, return an array of centered world positions.
 * E.g. widths=[1,2,1] → total=4 → positions=[-1.5, 0, 1.5]
 * A small gap is added between tiles.
 */
export function getLayerPositions(widths, gap = 0.05) {
  const positions = [];
  let cursor = 0;
  for (const w of widths) cursor += w + gap;
  const total = cursor - gap;
  cursor = 0;
  for (const w of widths) {
    positions.push(cursor + w / 2 - total / 2);
    cursor += w + gap;
  }
  return positions;
}

// ---------------------------------------------------------------------------
// Cube state
// ---------------------------------------------------------------------------

/** Build a fresh solved Nx×Ny×Nz cuboid state (array of cubelet objects). */
export function buildCube(Nx, Ny, Nz) {
  const cubelets = [];
  for (let x = 0; x < Nx; x++) {
    for (let y = 0; y < Ny; y++) {
      for (let z = 0; z < Nz; z++) {
        cubelets.push({
          id: `${x}-${y}-${z}`,
          pos: [x, y, z],
          colors: {
            px: x === Nx - 1 ? FACE_COLORS.px : INSIDE,
            nx: x === 0      ? FACE_COLORS.nx : INSIDE,
            py: y === Ny - 1 ? FACE_COLORS.py : INSIDE,
            ny: y === 0      ? FACE_COLORS.ny : INSIDE,
            pz: z === Nz - 1 ? FACE_COLORS.pz : INSIDE,
            nz: z === 0      ? FACE_COLORS.nz : INSIDE,
          },
        });
      }
    }
  }
  return cubelets;
}

// ---------------------------------------------------------------------------
// Move application
// ---------------------------------------------------------------------------

/**
 * Apply a move to the cube state and return a new state array.
 *
 * move: { axis: 'x'|'y'|'z', layer: int, dir: 1 | -1 | 2 }
 *   dir  1 = 90° clockwise
 *   dir -1 = 90° counter-clockwise  (requires square cross-section)
 *   dir  2 = 180°                   (always valid)
 */
export function applyMove(cubelets, move, Nx, Ny, Nz) {
  const { axis, layer, dir } = move;
  const axisIdx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;

  return cubelets.map(c => {
    if (c.pos[axisIdx] !== layer) return c;

    const [x, y, z] = c.pos;
    let nx, ny, nz;

    if (dir === 2) {
      // 180° — always valid; both perpendicular coords are simply flipped
      if (axis === 'x') { nx = x; ny = Ny - 1 - y; nz = Nz - 1 - z; }
      else if (axis === 'y') { nx = Nx - 1 - x; ny = y; nz = Nz - 1 - z; }
      else                   { nx = Nx - 1 - x; ny = Ny - 1 - y; nz = z; }
    } else if (axis === 'x') {
      const M = Ny - 1; // == Nz - 1 (caller ensures Ny === Nz for 90°)
      nx = x;
      ny = dir === 1 ? (M - z) : z;
      nz = dir === 1 ? y       : (M - y);
    } else if (axis === 'y') {
      const M = Nx - 1; // == Nz - 1
      nx = dir === 1 ? z       : (M - z);
      ny = y;
      nz = dir === 1 ? (M - x) : x;
    } else {
      const M = Nx - 1; // == Ny - 1
      nx = dir === 1 ? (M - y) : y;
      ny = dir === 1 ? x       : (M - x);
      nz = z;
    }

    return { ...c, pos: [nx, ny, nz], colors: rotateColors(c.colors, axis, dir) };
  });
}

/**
 * Returns what kind of rotation is available for an axis:
 *   '90'  — 90° (and 180°) turns are valid (square cross-section)
 *   '180' — only 180° turns are valid (rectangular cross-section)
 */
export function axisRotationType(axis, Nx, Ny, Nz) {
  if (axis === 'x') return Ny === Nz ? '90' : '180';
  if (axis === 'y') return Nx === Nz ? '90' : '180';
  return Nx === Ny ? '90' : '180';
}

/** @deprecated use axisRotationType */
export function isValidAxis(axis, Nx, Ny, Nz) {
  return axisRotationType(axis, Nx, Ny, Nz) === '90';
}

/** Remap face-color keys after a quarter- or half-turn. */
function rotateColors(colors, axis, dir) {
  const c = { ...colors };
  if (dir === 2) {
    // 180° swaps opposite faces on the two perpendicular axes
    if (axis === 'x') return { ...c, py: c.ny, ny: c.py, pz: c.nz, nz: c.pz };
    if (axis === 'y') return { ...c, px: c.nx, nx: c.px, pz: c.nz, nz: c.pz };
    return              { ...c, px: c.nx, nx: c.px, py: c.ny, ny: c.py };
  }
  if (axis === 'x') {
    return dir === 1
      ? { ...c, py: c.pz, nz: c.py, ny: c.nz, pz: c.ny }
      : { ...c, py: c.nz, pz: c.py, ny: c.pz, nz: c.ny };
  } else if (axis === 'y') {
    return dir === 1
      ? { ...c, px: c.pz, nz: c.px, nx: c.nz, pz: c.nx }
      : { ...c, pz: c.px, nx: c.pz, nz: c.nx, px: c.nz };
  } else {
    return dir === 1
      ? { ...c, px: c.ny, py: c.px, nx: c.py, ny: c.nx }
      : { ...c, py: c.nx, px: c.py, ny: c.px, nx: c.ny };
  }
}

// ---------------------------------------------------------------------------
// Scramble & solve check
// ---------------------------------------------------------------------------

/** Generate a random scramble using all axes (90° where valid, 180° otherwise). */
export function generateScramble(Nx, Ny, Nz, count) {
  const axes = ['x', 'y', 'z'];
  const layerCounts = { x: Nx, y: Ny, z: Nz };
  const defaultCount = count ?? Math.max(15, (Nx + Ny + Nz) * 3);
  const moves = [];
  let lastAxis = null;

  for (let i = 0; i < defaultCount; i++) {
    let axis;
    do { axis = axes[Math.floor(Math.random() * 3)]; }
    while (axis === lastAxis);
    lastAxis = axis;

    const layer = Math.floor(Math.random() * layerCounts[axis]);
    const can90 = axisRotationType(axis, Nx, Ny, Nz) === '90';
    // For 90° axes pick CW/CCW; for 180°-only axes always use dir:2
    const dir = can90 ? (Math.random() < 0.5 ? 1 : -1) : 2;
    moves.push({ axis, layer, dir });
  }
  return moves;
}

/** Check if the cuboid is in the solved state. */
export function isSolved(cubelets, Nx, Ny, Nz) {
  for (const { pos: [x, y, z], colors } of cubelets) {
    if (x === Nx - 1 && colors.px !== FACE_COLORS.px) return false;
    if (x === 0      && colors.nx !== FACE_COLORS.nx) return false;
    if (y === Ny - 1 && colors.py !== FACE_COLORS.py) return false;
    if (y === 0      && colors.ny !== FACE_COLORS.ny) return false;
    if (z === Nz - 1 && colors.pz !== FACE_COLORS.pz) return false;
    if (z === 0      && colors.nz !== FACE_COLORS.nz) return false;
  }
  return true;
}
