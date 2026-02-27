import { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { getNodeCategories } from '../nodes';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAddNode: (type: string) => void;
}

// Generated from nodeDefinitions
const NODE_CATEGORIES = getNodeCategories();

// Estimated submenu width for calculations
const SUBMENU_WIDTH = 140;

// Adjust menu position to stay within viewport
function adjustPosition(
  menuEl: HTMLElement | null,
  x: number,
  y: number
): { x: number; y: number } {
  if (!menuEl) return { x, y };

  const rect = menuEl.getBoundingClientRect();
  let newX = x;
  let newY = y;

  if (x + rect.width > window.innerWidth) {
    newX = Math.max(0, x - rect.width);
  }
  if (y + rect.height > window.innerHeight) {
    newY = Math.max(0, window.innerHeight - rect.height - 8);
  }

  return { x: newX, y: newY };
}

export function ContextMenu({ x, y, onClose, onAddNode }: ContextMenuProps) {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef({ x, y });

  // Adjust position synchronously before paint
  useLayoutEffect(() => {
    positionRef.current = adjustPosition(menuRef.current, x, y);
    if (menuRef.current) {
      menuRef.current.style.left = `${positionRef.current.x}px`;
      menuRef.current.style.top = `${positionRef.current.y}px`;
    }
  }, [x, y]);

  const handleSelect = useCallback(
    (type: string) => {
      onAddNode(type);
      onClose();
    },
    [onAddNode, onClose]
  );

  return (
    <>
      <div className="fixed inset-0" onClick={onClose} />
      <div
        ref={menuRef}
        className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 z-50 min-w-40"
        style={{ left: x, top: y }}
      >
        {NODE_CATEGORIES.map((category) => (
          <CategoryItem
            key={category.label}
            category={category}
            isOpen={openCategory === category.label}
            onHover={() => setOpenCategory(category.label)}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </>
  );
}

interface CategoryItemProps {
  category: {
    label: string;
    nodes: NodeOption[];
    subcategories: { label: string; nodes: NodeOption[] }[];
  };
  isOpen: boolean;
  onHover: () => void;
  onSelect: (type: string) => void;
}

function CategoryItem({
  category,
  isOpen,
  onHover,
  onSelect,
}: CategoryItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const [submenuStyle, setSubmenuStyle] = useState<React.CSSProperties>({});
  const [openLeft, setOpenLeft] = useState(false);

  useLayoutEffect(() => {
    if (isOpen && itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      const submenuHeight = estimateSubmenuHeight(
        category.nodes.length,
        category.subcategories.length
      );

      // Check if should open left based on actual position
      const shouldOpenLeft = rect.right + SUBMENU_WIDTH > window.innerWidth;
      setOpenLeft(shouldOpenLeft);

      const style: React.CSSProperties = {
        [shouldOpenLeft ? 'paddingRight' : 'paddingLeft']: 4,
      };

      // Vertical adjustment
      if (rect.top + submenuHeight > window.innerHeight) {
        style.bottom = 0;
        style.top = 'auto';
      } else {
        style.top = 0;
      }

      setSubmenuStyle(style);
    }
  }, [isOpen, category.nodes.length, category.subcategories.length]);

  return (
    <div ref={itemRef} className="relative" onMouseEnter={onHover}>
      <button
        className={`w-full px-3 py-1.5 text-left text-sm text-gray-200 flex justify-between items-center ${
          isOpen ? 'bg-gray-700' : 'hover:bg-gray-700'
        }`}
      >
        {category.label}
        <span className="text-gray-500 ml-4">›</span>
      </button>

      {isOpen && (
        <div
          className={`absolute z-10 ${openLeft ? 'right-full' : 'left-full'}`}
          style={submenuStyle}
        >
          <CategorySubmenu
            nodes={category.nodes}
            subcategories={category.subcategories}
            onSelect={onSelect}
          />
        </div>
      )}
    </div>
  );
}

// Estimate submenu height based on item count
function estimateSubmenuHeight(
  nodeCount: number,
  subcategoryCount: number
): number {
  const itemHeight = 32;
  const padding = 8;
  const separatorHeight = nodeCount > 0 && subcategoryCount > 0 ? 9 : 0;
  return (
    (nodeCount + subcategoryCount) * itemHeight + padding + separatorHeight
  );
}

interface NodeOption {
  type: string;
  label: string;
  shortcut?: string;
  description?: string;
}

interface Subcategory {
  label: string;
  nodes: NodeOption[];
}

interface CategorySubmenuProps {
  nodes: NodeOption[];
  subcategories: Subcategory[];
  onSelect: (type: string) => void;
}

function CategorySubmenu({
  nodes,
  subcategories,
  onSelect,
}: CategorySubmenuProps) {
  const [openSub, setOpenSub] = useState<string | null>(null);

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 min-w-32">
      {/* Direct nodes */}
      {nodes.map((node) => (
        <NodeButton key={node.type} node={node} onSelect={onSelect} />
      ))}

      {/* Separator if both exist */}
      {nodes.length > 0 && subcategories.length > 0 && (
        <div className="border-t border-gray-700 my-1" />
      )}

      {/* Subcategories */}
      {subcategories.map((sub) => (
        <SubcategoryItem
          key={sub.label}
          subcategory={sub}
          isOpen={openSub === sub.label}
          onHover={() => setOpenSub(sub.label)}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

interface SubcategoryItemProps {
  subcategory: Subcategory;
  isOpen: boolean;
  onHover: () => void;
  onSelect: (type: string) => void;
}

function SubcategoryItem({
  subcategory,
  isOpen,
  onHover,
  onSelect,
}: SubcategoryItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const [submenuStyle, setSubmenuStyle] = useState<React.CSSProperties>({});
  const [openLeft, setOpenLeft] = useState(false);

  useLayoutEffect(() => {
    if (isOpen && itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      const submenuHeight = subcategory.nodes.length * 32 + 8;

      // Check if should open left based on actual position
      const shouldOpenLeft = rect.right + SUBMENU_WIDTH > window.innerWidth;
      setOpenLeft(shouldOpenLeft);

      const style: React.CSSProperties = {
        [shouldOpenLeft ? 'paddingRight' : 'paddingLeft']: 4,
      };

      // Vertical adjustment
      if (rect.top + submenuHeight > window.innerHeight) {
        style.bottom = 0;
        style.top = 'auto';
      } else {
        style.top = 0;
      }

      setSubmenuStyle(style);
    }
  }, [isOpen, subcategory.nodes.length]);

  return (
    <div ref={itemRef} className="relative" onMouseEnter={onHover}>
      <button
        className={`w-full px-3 py-1.5 text-left text-sm text-gray-400 flex justify-between items-center ${
          isOpen ? 'bg-gray-700' : 'hover:bg-gray-700'
        }`}
      >
        {subcategory.label}
        <span className="text-gray-500 ml-4">›</span>
      </button>

      {isOpen && (
        <div
          className={`absolute z-20 ${openLeft ? 'right-full' : 'left-full'}`}
          style={submenuStyle}
        >
          <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 min-w-32">
            {subcategory.nodes.map((node) => (
              <NodeButton key={node.type} node={node} onSelect={onSelect} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface NodeButtonProps {
  node: NodeOption;
  onSelect: (type: string) => void;
}

function NodeButton({ node, onSelect }: NodeButtonProps) {
  return (
    <button
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
  );
}
