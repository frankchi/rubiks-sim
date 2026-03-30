import { getNotationGroups } from '../lib/notation';
import { axisRotationType } from '../lib/cubeModel';

const FACE_COLORS = {
  R: 'text-orange-400 border-orange-700',
  L: 'text-orange-300 border-orange-600',
  U: 'text-gray-100  border-gray-500',
  D: 'text-yellow-400 border-yellow-700',
  F: 'text-green-400  border-green-700',
  B: 'text-blue-400   border-blue-700',
};

function getFaceColor(label) {
  // Find the root face letter (strip digits)
  const root = label.replace(/^[0-9]+/, '');
  return FACE_COLORS[root] || 'text-gray-300 border-gray-600';
}

/**
 * A compact bar of clickable notation buttons.
 *
 * props:
 *   Nx, Ny, Nz   — cube dimensions
 *   onMove(move) — called with { axis, layer, dir } when a button is clicked
 *   disabled     — disable all buttons (while animating)
 */
export default function NotationPanel({ Nx, Ny, Nz, onMove, disabled }) {
  const groups = getNotationGroups(Nx, Ny, Nz);

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-gray-900 border-t border-gray-700 justify-center">
      {groups.map((group) => {
        const rotType = axisRotationType(group.axis, Nx, Ny, Nz);
        const colorClass = getFaceColor(group.label);

        return (
          <div key={group.label} className="flex flex-col items-center gap-1">
            <span className={`text-xs font-bold ${colorClass.split(' ')[0]}`}>
              {group.label}
            </span>
            <div className="flex gap-0.5">
              {group.moves.map((move) => {
                // Disable 90° buttons when that axis only supports 180°
                const is90 = move.dir !== 2;
                const btn90Disabled = is90 && rotType === '180';
                const isDisabled = disabled || btn90Disabled;

                // Suffix display: ′ for prime, 2 for half-turn, blank for CW
                const baseName = group.label;
                let suffix = '';
                if (move.name === `${baseName}'`) suffix = '′';
                else if (move.name === `${baseName}2`) suffix = '2';
                else if (move.name.endsWith("'")) suffix = '′';
                else if (move.name.endsWith('2')) suffix = '2';

                return (
                  <button
                    key={move.name}
                    title={move.name}
                    onClick={() => !isDisabled && onMove(move)}
                    disabled={isDisabled}
                    className={`
                      w-8 h-8 text-xs font-mono rounded border
                      ${colorClass}
                      ${isDisabled
                        ? 'opacity-20 cursor-not-allowed bg-transparent'
                        : 'hover:bg-gray-700 active:bg-gray-600 cursor-pointer bg-gray-800'
                      }
                      transition-colors
                    `}
                  >
                    {suffix || '↻'}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
