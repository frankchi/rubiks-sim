/**
 * Solver: for NxN > 3 we simply invert the scramble history.
 * For N=3 we also invert scramble history (a true IDA* solver is out of scope).
 * The UI passes in the scramble move list; we reverse + invert dirs to undo.
 */

/** Invert a move sequence (reverse order, flip dir). 180° moves (dir:2) invert to themselves. */
export function invertMoves(moves) {
  return [...moves].reverse().map(m => ({ ...m, dir: m.dir === 2 ? 2 : -m.dir }));
}
