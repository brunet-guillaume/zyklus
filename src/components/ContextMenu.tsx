import { useState } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAddNode: (type: string) => void;
}

const NODE_CATEGORIES = [
  {
    label: 'Sources',
    nodes: [
      { type: 'value', label: 'Value' },
      { type: 'slider', label: 'Slider' },
      { type: 'code', label: 'Code' },
    ],
  },
  {
    label: 'Generators',
    nodes: [
      { type: 'sound', label: 'Sound' },
      { type: 'note', label: 'Note' },
      { type: 'supersaw', label: 'Supersaw' },
    ],
  },
  {
    label: 'Collections',
    nodes: [
      { type: 'array', label: 'Array' },
      { type: 'pick', label: 'Pick' },
      { type: 'struct', label: 'Struct' },
    ],
  },
  {
    label: 'Transform',
    nodes: [
      { type: 'fast', label: 'Fast' },
      { type: 'slow', label: 'Slow' },
      { type: 'rev', label: 'Rev' },
    ],
  },
  {
    label: 'Effects',
    nodes: [
      { type: 'gain', label: 'Gain' },
      { type: 'reverb', label: 'Reverb' },
      { type: 'delay', label: 'Delay' },
      { type: 'lpf', label: 'Low-pass' },
      { type: 'lpenv', label: 'LP Env' },
      { type: 'room', label: 'Room' },
      { type: 'attack', label: 'Attack' },
      { type: 'sustain', label: 'Sustain' },
      { type: 'release', label: 'Release' },
      { type: 'postgain', label: 'Postgain' },
      { type: 'pcurve', label: 'Pcurve' },
      { type: 'pdecay', label: 'Pdecay' },
    ],
  },
  {
    label: 'Output',
    nodes: [{ type: 'output', label: 'Output' }],
  },
];

// Estimated menu dimensions for initial positioning
const MENU_WIDTH = 160;
const MENU_HEIGHT = 200;

function adjustPosition(x: number, y: number): { x: number; y: number } {
  const newX = x + MENU_WIDTH > window.innerWidth ? x - MENU_WIDTH : x;
  const newY = y + MENU_HEIGHT > window.innerHeight ? y - MENU_HEIGHT : y;
  return { x: Math.max(0, newX), y: Math.max(0, newY) };
}

export function ContextMenu({ x, y, onClose, onAddNode }: ContextMenuProps) {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  // Compute position once on render (no effect needed)
  const position = adjustPosition(x, y);

  return (
    <>
      <div className="fixed inset-0" onClick={onClose} />
      <div
        className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 z-50 min-w-40"
        style={{ left: position.x, top: position.y }}
      >
        {NODE_CATEGORIES.map((category) => (
          <div
            key={category.label}
            className="relative"
            onMouseEnter={() => setOpenCategory(category.label)}
          >
            <button
              className={`w-full px-3 py-1.5 text-left text-sm text-gray-200 flex justify-between items-center ${
                openCategory === category.label
                  ? 'bg-gray-700'
                  : 'hover:bg-gray-700'
              }`}
            >
              {category.label}
              <span className="text-gray-500 ml-4">›</span>
            </button>

            {/* Submenu with hover bridge */}
            {openCategory === category.label && (
              <div
                className="absolute top-0 left-full"
                style={{ paddingLeft: 4 }}
              >
                <Submenu
                  nodes={category.nodes}
                  onSelect={(type) => {
                    onAddNode(type);
                    onClose();
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

interface SubmenuProps {
  nodes: { type: string; label: string }[];
  onSelect: (type: string) => void;
}

function Submenu({ nodes, onSelect }: SubmenuProps) {
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 min-w-32">
      {nodes.map((node) => (
        <button
          key={node.type}
          onClick={() => onSelect(node.type)}
          className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-700"
          style={{ color: `var(--${node.type})` }}
        >
          {node.label}
        </button>
      ))}
    </div>
  );
}
