function DimInput({ label, value, onChange }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <label className="text-xs text-gray-400">{label}</label>
      <input
        type="number" min={1} max={5} value={value}
        onChange={e => onChange(Math.min(5, Math.max(1, Number(e.target.value) || 1)))}
        className="w-14 text-center rounded bg-gray-800 border border-gray-600
                   text-white font-bold text-lg py-1 focus:outline-none focus:border-indigo-500"
      />
    </div>
  );
}

export default function ControlPanel({
  Nx, Ny, Nz, onChangeDims,
  innerScale, onChangeInnerScale,
  onScramble, onSolve,
  moveCount, isSolving, isSolvedFlag,
  axisInfo,
}) {
  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-900 text-white w-64 shrink-0 overflow-y-auto">
      <h1 className="text-2xl font-bold text-center tracking-wide">🧊 Rubik's Sim</h1>

      {/* Dimensions */}
      <div>
        <p className="text-sm text-gray-400 mb-2 text-center">Cube Dimensions (1–5)</p>
        <div className="flex justify-around">
          <DimInput label="X" value={Nx} onChange={v => onChangeDims(v, Ny, Nz)} />
          <span className="self-end pb-2 text-gray-500 font-bold">×</span>
          <DimInput label="Y" value={Ny} onChange={v => onChangeDims(Nx, v, Nz)} />
          <span className="self-end pb-2 text-gray-500 font-bold">×</span>
          <DimInput label="Z" value={Nz} onChange={v => onChangeDims(Nx, Ny, v)} />
        </div>
        {/* Per-axis rotation type */}
        <div className="flex justify-around mt-2">
          {axisInfo.map(({ axis, type }) => (
            <div key={axis} className="flex flex-col items-center">
              <span className="text-xs text-gray-400 uppercase">{axis}</span>
              <span className={`text-xs font-semibold ${type === '90' ? 'text-indigo-400' : 'text-yellow-400'}`}>
                {type === '90' ? '90°' : '180°'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Inner tile scale */}
      <div>
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <label>Inner tile scale</label>
          <span className="text-indigo-400 font-semibold">{innerScale.toFixed(1)}×</span>
        </div>
        <input
          type="range" min={0.5} max={3.0} step={0.1} value={innerScale}
          onChange={e => onChangeInnerScale(Number(e.target.value))}
          className="w-full accent-indigo-500"
        />
        <div className="flex justify-between text-xs text-gray-600 mt-0.5">
          <span>0.5×</span><span>3.0×</span>
        </div>
      </div>

      {/* Move count */}
      <div className="text-center">
        <span className="text-gray-400 text-sm">Moves: </span>
        <span className="text-white font-semibold">{moveCount}</span>
      </div>

      {/* Solved banner */}
      {isSolvedFlag && (
        <div className="text-center text-green-400 font-bold animate-pulse">
          ✅ Solved!
        </div>
      )}

      <button
        onClick={onScramble}
        disabled={isSolving}
        className="w-full py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold
                   disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        🔀 Scramble
      </button>

      <button
        onClick={onSolve}
        disabled={isSolving}
        className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold
                   disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        {isSolving ? '⏳ Solving…' : '✨ Solve'}
      </button>

      <div className="mt-auto text-xs text-gray-500 space-y-1 border-t border-gray-700 pt-3">
        <p>🖱️ <strong>Drag</strong> a sticker to rotate that layer</p>
        <p>🖱️ <strong>Drag</strong> black/empty to orbit camera</p>
        <p><span className="text-indigo-400 font-semibold">90°</span> = square face &nbsp;
           <span className="text-yellow-400 font-semibold">180°</span> = rectangular face</p>
      </div>
    </div>
  );
}
