import { useState, useEffect, useRef } from 'react';
import { getNodeOptions } from '../nodes';

// Generated from nodeDefinitions
const NODE_OPTIONS = getNodeOptions();

interface NodePaletteProps {
  x: number;
  y: number;
  onSelect: (type: string) => void;
  onClose: () => void;
}

export function NodePalette({ onSelect, onClose }: NodePaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = NODE_OPTIONS.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => a.label.localeCompare(b.label));

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setSelectedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        onSelect(filtered[selectedIndex].type);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0" onClick={onClose} />
      <div className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-2 z-50 w-1/2 left-1/4 top-1/2">
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search node..."
          className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400 mb-2"
        />
        <div className="max-h-64 overflow-y-auto">
          {filtered.map((option, index) => (
            <button
              key={option.type}
              onClick={() => onSelect(option.type)}
              className={`w-full px-3 py-1.5 text-left text-sm rounded ${
                index === selectedIndex
                  ? 'bg-purple-600 text-white'
                  : 'hover:bg-gray-700'
              }`}
            >
              <div className="flex justify-between items-center">
                <span
                  style={{
                    color:
                      index === selectedIndex
                        ? 'white'
                        : `var(--${option.type})`,
                  }}
                >
                  {option.label}
                </span>
                {option.shortcut && (
                  <span
                    className={`text-xs ml-2 px-1 rounded ${
                      index === selectedIndex
                        ? 'bg-purple-500 text-purple-100'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {option.shortcut}
                  </span>
                )}
              </div>
              {option.description && (
                <div
                  className={`text-xs mt-0.5 ${
                    index === selectedIndex
                      ? 'text-purple-200'
                      : 'text-gray-500'
                  }`}
                >
                  {option.description}
                </div>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">No results</div>
          )}
        </div>
      </div>
    </>
  );
}
