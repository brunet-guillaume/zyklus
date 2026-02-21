interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAddNode: (type: string) => void;
}

const NODE_OPTIONS = [
  { type: 'pattern', label: 'Pattern', color: 'text-purple-400' },
  { type: 'note', label: 'Note', color: 'text-pink-400' },
  { type: 'transform', label: 'Transform', color: 'text-blue-400' },
  { type: 'effect', label: 'Effect', color: 'text-green-400' },
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
