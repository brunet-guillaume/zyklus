import { useState, useEffect, useMemo, useRef } from 'react';

interface Location {
  start: number;
  end: number;
}

interface TriggerDetail {
  hap?: {
    context?: {
      locations?: Location[];
    };
  };
}

// Colors for different location levels
const LOCATION_COLORS = [
  'rgba(255, 100, 100, 0.6)', // locations[0] - red
  'rgba(100, 255, 100, 0.6)', // locations[1] - green
  'rgba(100, 100, 255, 0.6)', // locations[2] - blue
  'rgba(255, 255, 100, 0.6)', // locations[3] - yellow
];

let triggerId = 0;

export function DebugCodeView() {
  const [code, setCode] = useState('');
  const [activeLocations, setActiveLocations] = useState<
    Map<number, Location[]>
  >(new Map());
  const timeoutsRef = useRef<Map<number, number>>(new Map());

  // Update code when it changes
  useEffect(() => {
    const checkCode = () => {
      const compiledCode = window.__zyklusCompiledCode;
      if (compiledCode && compiledCode !== code) {
        setCode(compiledCode);
      }
    };

    // Check immediately and set up interval
    checkCode();
    const interval = setInterval(checkCode, 500);
    return () => clearInterval(interval);
  }, [code]);

  // Listen for trigger events
  useEffect(() => {
    const timeouts = timeoutsRef.current;

    const handleTrigger = (event: Event) => {
      const customEvent = event as CustomEvent<TriggerDetail>;
      const locations = customEvent.detail?.hap?.context?.locations || [];

      if (locations.length > 0) {
        const id = triggerId++;

        // Add these locations to active set
        setActiveLocations((prev) => {
          const next = new Map(prev);
          next.set(id, locations);
          return next;
        });

        // Set timeout to remove
        const timeout = window.setTimeout(() => {
          setActiveLocations((prev) => {
            const next = new Map(prev);
            next.delete(id);
            return next;
          });
          timeouts.delete(id);
        }, 200);

        timeouts.set(id, timeout);
      }
    };

    window.addEventListener('zyklus:trigger', handleTrigger);
    return () => {
      window.removeEventListener('zyklus:trigger', handleTrigger);
      timeouts.forEach((t) => clearTimeout(t));
      timeouts.clear();
    };
  }, []);

  // Build highlighted HTML
  const htmlContent = useMemo(() => {
    if (!code) return '';

    // Collect all highlight ranges with their level
    const highlights: Array<{ start: number; end: number; level: number }> = [];

    for (const locs of activeLocations.values()) {
      locs.forEach((loc, level) => {
        if (loc.start >= 0 && loc.end <= code.length && loc.start < loc.end) {
          highlights.push({ start: loc.start, end: loc.end, level });
        }
      });
    }

    if (highlights.length === 0) {
      return escapeHtml(code);
    }

    // Sort by start position
    highlights.sort((a, b) => a.start - b.start);

    // Build HTML with highlights
    let result = '';
    let pos = 0;

    for (const hl of highlights) {
      // Skip overlapping highlights
      if (hl.start < pos) continue;

      if (hl.start > pos) {
        result += escapeHtml(code.slice(pos, hl.start));
      }

      const color = LOCATION_COLORS[hl.level % LOCATION_COLORS.length];
      result += `<mark style="background: ${color}; border-radius: 2px;">${escapeHtml(code.slice(hl.start, hl.end))}</mark>`;
      pos = hl.end;
    }

    if (pos < code.length) {
      result += escapeHtml(code.slice(pos));
    }

    return result;
  }, [code, activeLocations]);

  if (!code) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-gray-700 p-2 max-h-32 overflow-auto z-50">
      <div className="flex gap-2 mb-1 text-xs text-gray-500">
        <span>Debug Code View</span>
        <span className="flex gap-2">
          {LOCATION_COLORS.map((color, i) => (
            <span
              key={i}
              style={{ background: color, padding: '0 4px', borderRadius: 2 }}
            >
              loc[{i}]
            </span>
          ))}
        </span>
      </div>
      <pre
        className="text-xs font-mono whitespace-pre-wrap break-all"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
