interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAddNode: (type: string) => void;
}

const NODE_OPTIONS = [
  { type: 'sound', label: 'Sound', color: 'text-purple-400' },
  { type: 'note', label: 'Note', color: 'text-pink-400' },
  { type: 'code', label: 'Code', color: 'text-emerald-400' },
  { type: 'value', label: 'Value', color: 'text-amber-400' },
  { type: 'array', label: 'Array', color: 'text-indigo-400' },
  { type: 'pick', label: 'Pick', color: 'text-cyan-400' },
  { type: 'fast', label: 'Fast', color: 'text-blue-400' },
  { type: 'slow', label: 'Slow', color: 'text-blue-400' },
  { type: 'rev', label: 'Rev', color: 'text-blue-400' },
  { type: 'gain', label: 'Gain', color: 'text-green-400' },
  { type: 'reverb', label: 'Reverb', color: 'text-green-400' },
  { type: 'delay', label: 'Delay', color: 'text-green-400' },
  { type: 'lpf', label: 'Low-pass', color: 'text-green-400' },
  { type: 'output', label: 'Output', color: 'text-orange-400' },
];

export function ContextMenu({ x, y, onClose, onAddNode }: ContextMenuProps) {
  return (
    <>
      <div className="fixed inset-0" onClick={onClose} />
      <div
        className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-2 z-50"
        style={{ left: x, top: y }}
      >
        <div className="px-3 py-1 text-xs text-gray-400 uppercase">
          Add Node
        </div>
        {NODE_OPTIONS.map((option) => (
          <button
            key={option.type}
            onClick={() => {
              onAddNode(option.type);
              onClose();
            }}
            className={`w-full px-4 py-2 text-left hover:bg-gray-700 ${option.color}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </>
  );
}
