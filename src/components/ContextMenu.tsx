import { useState } from 'react';
import { getNodeCategories } from '../nodes';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAddNode: (type: string) => void;
}

// Generated from nodeDefinitions
const NODE_CATEGORIES = getNodeCategories();

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
  nodes: {
    type: string;
    label: string;
    shortcut?: string;
    description?: string;
  }[];
  onSelect: (type: string) => void;
}

function Submenu({ nodes, onSelect }: SubmenuProps) {
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 min-w-32">
      {nodes.map((node) => (
        <button
          key={node.type}
          onClick={() => onSelect(node.type)}
          title={node.description}
          className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-700 flex justify-between items-center"
          style={{ color: `var(--${node.type})` }}
        >
          <span>{node.label}</span>
          {node.shortcut && (
            <span className="text-xs ml-2 px-1 rounded bg-gray-700 text-gray-400">
              {node.shortcut}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
