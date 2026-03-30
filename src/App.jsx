import { useState, useCallback, useRef } from 'react';
import CubeScene from './components/CubeScene';
import ControlPanel from './components/ControlPanel';
import NotationPanel from './components/NotationPanel';
import { buildCube, generateScramble, isSolved, axisRotationType } from './lib/cubeModel';
import { invertMoves } from './lib/solver';

const DEFAULT = { Nx: 3, Ny: 3, Nz: 3 };
const DEFAULT_INNER_SCALE = 1.0;

function getAxisInfo(Nx, Ny, Nz) {
  return ['x', 'y', 'z'].map(a => ({ axis: a, type: axisRotationType(a, Nx, Ny, Nz) }));
}

export default function App() {
  const [dims, setDims] = useState(DEFAULT);
  const [innerScale, setInnerScale] = useState(DEFAULT_INNER_SCALE);
  const [animQueue, setAnimQueue] = useState([]);
  const [moveCount, setMoveCount] = useState(0);
  const [isSolving, setIsSolving] = useState(false);
  const [solved, setSolved] = useState(false);

  const scrambleHistoryRef = useRef([]);
  const userMoveHistoryRef = useRef([]);
  const solveMovesRemaining = useRef(0);

  const { Nx, Ny, Nz } = dims;
  const axisInfo = getAxisInfo(Nx, Ny, Nz);

  const resetState = useCallback(() => {
    setAnimQueue([]);
    setMoveCount(0);
    setIsSolving(false);
    setSolved(false);
    scrambleHistoryRef.current = [];
    userMoveHistoryRef.current = [];
    solveMovesRemaining.current = 0;
  }, []);

  const handleChangeDims = useCallback((newNx, newNy, newNz) => {
    setDims({ Nx: newNx, Ny: newNy, Nz: newNz });
    resetState();
  }, [resetState]);

  const handleChangeInnerScale = useCallback((val) => {
    setInnerScale(val);
    // innerScale is purely visual — no state reset needed
  }, []);

  const handleMoveAnimated = useCallback((newCubelets, cNx, cNy, cNz) => {
    setMoveCount(c => c + 1);
    if (solveMovesRemaining.current > 0) {
      solveMovesRemaining.current -= 1;
      if (solveMovesRemaining.current === 0) {
        setIsSolving(false);
        setSolved(true);
        scrambleHistoryRef.current = [];
        userMoveHistoryRef.current = [];
      }
    } else {
      if (isSolved(newCubelets, cNx, cNy, cNz)) setSolved(true);
    }
  }, []);

  const handleUserMove = useCallback((move) => {
    userMoveHistoryRef.current.push(move);
    setSolved(false);
  }, []);

  const handleScramble = useCallback(() => {
    if (isSolving || animQueue.length > 0) return;
    const moves = generateScramble(Nx, Ny, Nz);
    scrambleHistoryRef.current = moves;
    userMoveHistoryRef.current = [];
    setSolved(false);
    setAnimQueue(prev => [...prev, ...moves]);
    setMoveCount(c => c + moves.length);
  }, [Nx, Ny, Nz, isSolving, animQueue.length]);

  const handleSolve = useCallback(() => {
    if (isSolving || animQueue.length > 0) return;
    const allHistory = [...scrambleHistoryRef.current, ...userMoveHistoryRef.current];
    if (allHistory.length === 0) return;
    const solution = invertMoves(allHistory);
    setIsSolving(true);
    setSolved(false);
    solveMovesRemaining.current = solution.length;
    setAnimQueue(prev => [...prev, ...solution]);
    setMoveCount(c => c + solution.length);
  }, [isSolving, animQueue.length]);

  const handleNotationMove = useCallback((move) => {
    if (isSolving) return;
    handleUserMove(move);
    setAnimQueue(prev => [...prev, move]);
  }, [isSolving, handleUserMove]);

  const isAnimating = isSolving;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-950">
      <ControlPanel
        Nx={Nx} Ny={Ny} Nz={Nz}
        onChangeDims={handleChangeDims}
        innerScale={innerScale}
        onChangeInnerScale={handleChangeInnerScale}
        onScramble={handleScramble}
        onSolve={handleSolve}
        moveCount={moveCount}
        isSolving={isSolving}
        isSolvedFlag={solved}
        axisInfo={axisInfo}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1">
          <CubeScene
            key={`${Nx}-${Ny}-${Nz}`}
            initialCubelets={buildCube(Nx, Ny, Nz)}
            Nx={Nx} Ny={Ny} Nz={Nz}
            innerScale={innerScale}
            animQueue={animQueue}
            setAnimQueue={setAnimQueue}
            onMoveAnimated={handleMoveAnimated}
            onUserMove={handleUserMove}
          />
        </div>
        <NotationPanel
          Nx={Nx} Ny={Ny} Nz={Nz}
          onMove={handleNotationMove}
          disabled={isAnimating}
        />
      </div>
    </div>
  );
}
