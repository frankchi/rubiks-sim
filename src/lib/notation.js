/**
 * Standard Rubik's cube notation → { axis, layer, dir } move.
 *
 * Suffix conventions:
 *  (none)  = 90° clockwise  (dir: 1 or -1 depending on face)
 *  '       = 90° counter-clockwise
 *  2       = 180°
 *
 * Face directions follow the standard: R/U/F are CW when looking at that face.
 */

/**
 * Returns all notation groups to display for the given cuboid dimensions.
 * Each group: { label, moves: [{ name, axis, layer, dir }] }
 */
export function getNotationGroups(Nx, Ny, Nz) {
  const groups = [];

  // Outer face moves
  const faces = [
    { label: 'R', axis: 'x', layer: Nx - 1, cwDir: -1 },
    { label: 'L', axis: 'x', layer: 0,       cwDir:  1 },
    { label: 'U', axis: 'y', layer: Ny - 1, cwDir: -1 },
    { label: 'D', axis: 'y', layer: 0,       cwDir:  1 },
    { label: 'F', axis: 'z', layer: Nz - 1, cwDir: -1 },
    { label: 'B', axis: 'z', layer: 0,       cwDir:  1 },
  ];

  for (const { label, axis, layer, cwDir } of faces) {
    groups.push({
      label,
      axis,
      moves: [
        { name: label,        axis, layer, dir: cwDir  },
        { name: `${label}'`,  axis, layer, dir: -cwDir },
        { name: `${label}2`,  axis, layer, dir: 2      },
      ],
    });
  }

  // Inner slice moves — one per axis for each inner layer
  // Named: 2R, 3R … for X; 2U, 3U … for Y; 2F, 3F … for Z
  const innerDefs = [
    { label: 'R', axis: 'x', outerLayer: Nx - 1, cwDir: -1, count: Nx },
    { label: 'U', axis: 'y', outerLayer: Ny - 1, cwDir: -1, count: Ny },
    { label: 'F', axis: 'z', outerLayer: Nz - 1, cwDir: -1, count: Nz },
  ];

  for (const { label, axis, outerLayer, cwDir, count } of innerDefs) {
    // Inner layers: 1 .. count-2  (skip the two outer faces)
    for (let layer = count - 2; layer >= 1; layer--) {
      const num = outerLayer - layer + 1; // distance from outer face: 2, 3, …
      const n = `${num}${label}`;
      groups.push({
        label: n,
        axis,
        moves: [
          { name: n,        axis, layer, dir: cwDir  },
          { name: `${n}'`,  axis, layer, dir: -cwDir },
          { name: `${n}2`,  axis, layer, dir: 2      },
        ],
      });
    }
  }

  return groups;
}

/** Parse a single notation string into a move, or null if unrecognised. */
export function parseNotation(str, Nx, Ny, Nz) {
  const groups = getNotationGroups(Nx, Ny, Nz);
  for (const g of groups) {
    for (const m of g.moves) {
      if (m.name === str) return { axis: m.axis, layer: m.layer, dir: m.dir };
    }
  }
  return null;
}
