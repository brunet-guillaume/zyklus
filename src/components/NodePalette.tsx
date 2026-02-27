import { useState, useEffect, useRef } from 'react';

const NODE_OPTIONS = [
  { type: 'sound', label: 'Sound' },
  { type: 'note', label: 'Note' },
  { type: 'scale', label: 'Scale' },
  { type: 'code', label: 'Code' },
  { type: 'value', label: 'Value' },
  { type: 'irand', label: 'Irand' },
  { type: 'array', label: 'Array' },
  { type: 'pick', label: 'Pick' },
  { type: 'struct', label: 'Struct' },
  { type: 'ribbon', label: 'Ribbon' },
  { type: 'fast', label: 'Fast' },
  { type: 'slow', label: 'Slow' },
  { type: 'rev', label: 'Rev' },
  { type: 'sub', label: 'Sub' },
  { type: 'seg', label: 'Seg' },
  { type: 'supersaw', label: 'Supersaw' },
  { type: 'bank', label: 'Bank' },
  { type: 'slider', label: 'Slider' },
  { type: 'gain', label: 'Gain' },
  { type: 'postgain', label: 'Postgain' },
  { type: 'reverb', label: 'Reverb' },
  { type: 'room', label: 'Room' },
  { type: 'delay', label: 'Delay' },
  { type: 'lpf', label: 'Low-pass' },
  { type: 'lpq', label: 'LP Q' },
  { type: 'lpenv', label: 'LP Env' },
  { type: 'lpa', label: 'LP Attack' },
  { type: 'lps', label: 'LP Sustain' },
  { type: 'lpr', label: 'LP Release' },
  { type: 'attack', label: 'Attack' },
  { type: 'sustain', label: 'Sustain' },
  { type: 'release', label: 'Release' },
  { type: 'pcurve', label: 'Pcurve' },
  { type: 'pdecay', label: 'Pdecay' },
  { type: 'distort', label: 'Distort' },
  { type: 'orbit', label: 'Orbit' },
  { type: 'duckorbit', label: 'Duck' },
  { type: 'duckattack', label: 'Duck Attack' },
  { type: 'duckdepth', label: 'Duck Depth' },
  { type: 'output', label: 'Output' },
  { type: 'cpm', label: 'CPM' },
  { type: 'setVar', label: 'Set Var' },
  { type: 'getVar', label: 'Get Var' },
];

interface NodePaletteProps {
  x: number;
  y: number;
  onSelect: (type: string) => void;
  onClose: () => void;
}

export function NodePalette({ x, y, onSelect, onClose }: NodePaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = NODE_OPTIONS.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

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
      <div
        className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-2 z-50 min-w-48"
        style={{ left: x, top: y }}
      >
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
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
              style={{
                color:
                  index === selectedIndex ? 'white' : `var(--${option.type})`,
              }}
            >
              {option.label}
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
