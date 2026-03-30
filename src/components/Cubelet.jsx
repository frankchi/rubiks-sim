const FACE_NORMALS = [
  { key: 'px', n: [1, 0, 0],  ry:  Math.PI / 2, rx: 0 },
  { key: 'nx', n: [-1, 0, 0], ry: -Math.PI / 2, rx: 0 },
  { key: 'py', n: [0, 1, 0],  ry: 0, rx: -Math.PI / 2 },
  { key: 'ny', n: [0, -1, 0], ry: 0, rx:  Math.PI / 2 },
  { key: 'pz', n: [0, 0, 1],  ry: 0, rx: 0 },
  { key: 'nz', n: [0, 0, -1], ry: Math.PI, rx: 0 },
];

const STICKER_INSET = 0.88; // fraction of face covered by sticker
const BLACK = '#111111';

/**
 * A single cubelet rendered at `worldPos` with physical size `[sx, sy, sz]`.
 *
 * props:
 *   worldPos  – [wx, wy, wz] center in world space
 *   size      – [sx, sy, sz] physical dimensions
 *   colors    – { px, nx, py, ny, pz, nz }
 *   pos       – [gx, gy, gz] grid coords (passed back in pointer callback)
 *   onFacePointerDown(e, pos, normal)
 */
export default function Cubelet({ worldPos, size, colors, pos, onFacePointerDown }) {
  const [sx, sy, sz] = size;

  const stickers = FACE_NORMALS.map(({ key, n, ry, rx }) => {
    const color = colors[key];
    if (!color || color === 'transparent') return null;

    const [nx, ny, nz] = n;

    // Face dimensions (the plane perpendicular to the normal)
    let fw, fh;
    if (nx !== 0) { fw = sy * STICKER_INSET; fh = sz * STICKER_INSET; }   // ±X face: Y×Z
    else if (ny !== 0) { fw = sx * STICKER_INSET; fh = sz * STICKER_INSET; } // ±Y face: X×Z
    else               { fw = sx * STICKER_INSET; fh = sy * STICKER_INSET; } // ±Z face: X×Y

    // Offset sticker just outside the face
    const halfX = sx / 2, halfY = sy / 2, halfZ = sz / 2;
    const ox = nx * (halfX + 0.001);
    const oy = ny * (halfY + 0.001);
    const oz = nz * (halfZ + 0.001);

    return (
      <mesh
        key={key}
        position={[ox, oy, oz]}
        rotation={[rx, ry, 0]}
        onPointerDown={e => {
          e.stopPropagation();
          onFacePointerDown(e, pos, n);
        }}
      >
        <planeGeometry args={[fw, fh]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }).filter(Boolean);

  return (
    <group position={worldPos}>
      <mesh>
        <boxGeometry args={[sx, sy, sz]} />
        <meshStandardMaterial color={BLACK} />
      </mesh>
      {stickers}
    </group>
  );
}
