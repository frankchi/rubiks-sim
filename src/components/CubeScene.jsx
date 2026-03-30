import { useRef, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Cubelet from './Cubelet';
import { applyMove, axisRotationType, getLayerWidths, getLayerPositions } from '../lib/cubeModel';

const ANIM_DURATION = 0.18;

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * Build lookup tables for world positions and sizes given dims + innerScale.
 * Returns: { xPos[], yPos[], zPos[], xW[], yW[], zW[] }
 */
function buildGeometry(Nx, Ny, Nz, innerScale) {
  const xW = getLayerWidths(Nx, innerScale);
  const yW = getLayerWidths(Ny, innerScale);
  const zW = getLayerWidths(Nz, innerScale);
  return {
    xW, yW, zW,
    xPos: getLayerPositions(xW),
    yPos: getLayerPositions(yW),
    zPos: getLayerPositions(zW),
  };
}

/**
 * Map a drag gesture on a face to a move.
 * Uses 90° turns when cross-section is square, 180° turns otherwise.
 */
function dragToMove({ pos, normal }, dx, dy, Nx, Ny, Nz) {
  const [nx, ny] = normal;
  let axis, layer;

  if (nx !== 0) {
    if (Math.abs(dy) > Math.abs(dx)) { axis = 'z'; layer = pos[2]; }
    else                              { axis = 'y'; layer = pos[1]; }
  } else if (ny !== 0) {
    if (Math.abs(dy) > Math.abs(dx)) { axis = 'x'; layer = pos[0]; }
    else                              { axis = 'z'; layer = pos[2]; }
  } else {
    if (Math.abs(dy) > Math.abs(dx)) { axis = 'x'; layer = pos[0]; }
    else                              { axis = 'y'; layer = pos[1]; }
  }

  const type = axisRotationType(axis, Nx, Ny, Nz);
  if (type === '90') {
    const dominant = (axis === 'y' || (axis === 'z' && nx !== 0)) ? dx : dy;
    return { axis, layer, dir: dominant > 0 ? 1 : -1 };
  }
  // 180° — direction doesn't matter, always rotate positively
  return { axis, layer, dir: 2 };
}

function layerIndex(axis) {
  return axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
}

function CubeInner({ initialCubelets, Nx, Ny, Nz, innerScale, animQueue, setAnimQueue, onMoveAnimated, onUserMove }) {
  const orbitRef = useRef();
  const rotGroupRef = useRef();

  const stateRef = useRef(initialCubelets);
  const [staticCubelets, setStaticCubelets] = useState(initialCubelets);
  const [rotatingCubelets, setRotatingCubelets] = useState([]);
  const animRef = useRef(null);
  const dragState = useRef(null);

  // Recompute geometry when dims or innerScale change
  const geo = useMemo(
    () => buildGeometry(Nx, Ny, Nz, innerScale),
    [Nx, Ny, Nz, innerScale]
  );

  const getCubeletProps = useCallback((c) => {
    const [gx, gy, gz] = c.pos;
    return {
      worldPos: [geo.xPos[gx], geo.yPos[gy], geo.zPos[gz]],
      size: [geo.xW[gx], geo.yW[gy], geo.zW[gz]],
    };
  }, [geo]);

  const handleFacePointerDown = useCallback((e, pos, normal) => {
    if (animRef.current || animQueue.length > 0) return;
    dragState.current = { pos, normal, startX: e.clientX, startY: e.clientY };
    if (orbitRef.current) orbitRef.current.enabled = false;
  }, [animQueue.length]);

  const handlePointerUp = useCallback((e) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    if (Math.sqrt(dx * dx + dy * dy) > 8) {
      const move = dragToMove(dragState.current, dx, dy, Nx, Ny, Nz);
      if (move) {
        onUserMove(move);
        setAnimQueue(prev => [...prev, move]);
      }
    }
    dragState.current = null;
    if (orbitRef.current) orbitRef.current.enabled = true;
  }, [Nx, Ny, Nz, onUserMove, setAnimQueue]);

  useFrame((_, delta) => {
    if (!animRef.current) {
      if (animQueue.length === 0) return;
      const [nextMove, ...rest] = animQueue;
      setAnimQueue(rest);

      const idx = layerIndex(nextMove.axis);
      const rotating = stateRef.current.filter(c => c.pos[idx] === nextMove.layer);
      const statics  = stateRef.current.filter(c => c.pos[idx] !== nextMove.layer);
      setStaticCubelets(statics);
      setRotatingCubelets(rotating);
      animRef.current = { ...nextMove, progress: 0 };
      return;
    }

    const anim = animRef.current;
    anim.progress = Math.min(1, anim.progress + delta / ANIM_DURATION);
    const targetAngle = anim.dir === 2 ? Math.PI : (Math.PI / 2) * anim.dir;
    const angle = targetAngle * easeInOut(anim.progress);

    if (rotGroupRef.current) {
      rotGroupRef.current.rotation.set(
        anim.axis === 'x' ? angle : 0,
        anim.axis === 'y' ? angle : 0,
        anim.axis === 'z' ? angle : 0,
      );
    }

    if (anim.progress >= 1) {
      const newState = applyMove(stateRef.current, anim, Nx, Ny, Nz);
      stateRef.current = newState;
      setStaticCubelets(newState);
      setRotatingCubelets([]);
      if (rotGroupRef.current) rotGroupRef.current.rotation.set(0, 0, 0);
      animRef.current = null;
      onMoveAnimated(newState, Nx, Ny, Nz);
    }
  });

  return (
    <>
      <OrbitControls ref={orbitRef} makeDefault />
      <group onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
        {staticCubelets.map(c => {
          const { worldPos, size } = getCubeletProps(c);
          return (
            <Cubelet key={c.id} worldPos={worldPos} size={size}
              colors={c.colors} pos={c.pos}
              onFacePointerDown={handleFacePointerDown} />
          );
        })}
        <group ref={rotGroupRef}>
          {rotatingCubelets.map(c => {
            const { worldPos, size } = getCubeletProps(c);
            return (
              <Cubelet key={c.id} worldPos={worldPos} size={size}
                colors={c.colors} pos={c.pos}
                onFacePointerDown={handleFacePointerDown} />
            );
          })}
        </group>
      </group>
    </>
  );
}

export default function CubeScene({ initialCubelets, Nx, Ny, Nz, innerScale, animQueue, setAnimQueue, onMoveAnimated, onUserMove }) {
  const span = Math.max(Nx, Ny, Nz) * (innerScale > 1 ? innerScale + 0.5 : 1.5);
  const camDist = span * 2.8;

  return (
    <Canvas
      camera={{ position: [camDist, camDist, camDist], fov: 45 }}
      style={{ background: '#1a1a2e' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 10]} intensity={0.8} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />
      <CubeInner
        initialCubelets={initialCubelets}
        Nx={Nx} Ny={Ny} Nz={Nz}
        innerScale={innerScale}
        animQueue={animQueue}
        setAnimQueue={setAnimQueue}
        onMoveAnimated={onMoveAnimated}
        onUserMove={onUserMove}
      />
    </Canvas>
  );
}
