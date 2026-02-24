import { useEdges, useReactFlow, type NodeProps } from '@xyflow/react';
import { useMemo } from 'react';
import type { ValueNode as ValueNodeType } from './types';
import { BaseNode } from './BaseNode';
import { useTrigger } from '../hooks/useTrigger';
import { useEvents } from '../hooks/useEvents';

// Parse mini-notation to extract elements and their positions
function parseElements(
  value: string
): Array<{ text: string; start: number; end: number }> {
  const elements: Array<{ text: string; start: number; end: number }> = [];
  // Remove outer brackets like < > [ ] { }
  const inner = value.replace(/^[<[{]|[>\]}]$/g, '').trim();

  // Split by spaces
  const regex = /\S+/g;
  let match;
  while ((match = regex.exec(inner)) !== null) {
    // Adjust position for removed opening bracket
    const offset =
      value.startsWith('<') || value.startsWith('[') || value.startsWith('{')
        ? 1
        : 0;
    elements.push({
      text: match[0],
      start: match.index + offset,
      end: match.index + offset + match[0].length,
    });
  }
  return elements;
}

export function ValueNode({ id, data, selected }: NodeProps<ValueNodeType>) {
  const { updateNodeData } = useReactFlow();
  const edges = useEdges();
  const { isTriggered, note, timing } = useTrigger(id);
  const events = useEvents();

  const inputErrorFn = (index: number) => {
    return !edges.some(
      (e) => e.target === id && e.targetHandle === `in-${index}`
    );
  };

  const outputErrorFn = (index: number) => {
    return !edges.some(
      (e) => e.source === id && e.sourceHandle === `out-${index}`
    );
  };

  // Find the position of the triggered element in the value string
  const highlightRange = useMemo(() => {
    if (!isTriggered) return null;
    const value = data.value || '';

    // Check if this value looks like a rhythm/struct pattern (contains x or ~)
    // These patterns use timing-based highlighting, not note matching
    const isRhythmPattern = /[x~]/.test(value);

    // Try to match by note content (but NOT for rhythm patterns)
    if (!isRhythmPattern && note !== null && note !== undefined) {
      const noteStr = String(note);
      const index = value.indexOf(noteStr);
      if (index !== -1) {
        return { start: index, end: index + noteStr.length };
      }
    }

    // For rhythm patterns or if note not found, try to match by timing
    if (timing) {
      const elements = parseElements(value);
      if (elements.length > 0) {
        const isSlow = value.startsWith('<'); // <> = slow sequence (one per cycle)
        const isFast = value.startsWith('['); // [] = fast sequence (all within cycle)

        let elementIndex: number;
        if (isSlow) {
          // Slow sequence: element changes each cycle
          const cycle = Math.floor(timing.start);
          elementIndex = cycle % elements.length;
        } else if (isFast) {
          // Fast sequence: all elements within one cycle
          const pos = timing.start % 1;
          elementIndex = Math.floor(pos * elements.length);
        } else {
          // Default: use position within cycle
          const pos = timing.start % 1;
          elementIndex = Math.floor(pos * elements.length);
        }

        const element = elements[Math.min(elementIndex, elements.length - 1)];
        if (element) {
          return { start: element.start, end: element.end };
        }
      }
    }

    return null;
  }, [isTriggered, note, timing, data.value]);

  return (
    <BaseNode
      type="value"
      events={events}
      inputs={0}
      outputs={1}
      selected={selected}
      triggered={isTriggered}
      inputErrorFn={inputErrorFn}
      outputErrorFn={outputErrorFn}
    >
      <div className="auto-width-input text-xs relative">
        <span>{data.value || ' '}</span>
        <input
          type="text"
          value={data.value}
          onChange={(e) => updateNodeData(id, { value: e.target.value })}
          placeholder="Value"
          className={
            highlightRange
              ? 'text-(--node-color)/20'
              : 'text-(--node-color)/20 focus:text-(--node-color)'
          }
        />
        {highlightRange && (
          <div
            className="absolute inset-0 px-2 py-1 bg-transparent pointer-events-none whitespace-pre text-transparent"
            aria-hidden="true"
          >
            {data.value.slice(0, highlightRange.start)}
            <mark className="visible bg-(--node-color) px-1 -mx-1 py-0.5 font-bold text-black rounded-sm not-italic">
              {data.value.slice(highlightRange.start, highlightRange.end)}
            </mark>
            {data.value.slice(highlightRange.end)}
          </div>
        )}
      </div>
    </BaseNode>
  );
}
