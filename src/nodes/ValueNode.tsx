import { useEdges, useReactFlow, type NodeProps } from '@xyflow/react';
import type { ValueNode as ValueNodeType } from './types';
import { BaseNode } from './BaseNode';
import { useTrigger } from '../hooks/useTrigger';

export function ValueNode({ id, data, selected }: NodeProps<ValueNodeType>) {
  const { updateNodeData } = useReactFlow();
  const edges = useEdges();
  const { isTriggered, locations } = useTrigger(id);

  const inputErrorFn = (index: number) => {
    const hasConnection = edges.some(
      (e) => e.target === id && e.targetHandle === `in-${index}`
    );
    return !hasConnection;
  };
  const outputErrorFn = (index: number) => {
    const hasConnection = edges.some(
      (e) => e.source === id && e.sourceHandle === `out-${index}`
    );
    return !hasConnection;
  };

  const hasHighlight = isTriggered && locations && locations.length > 0;

  // Get highlight range - use last location (closest to our Value node content)
  const highlightRange =
    hasHighlight && locations[locations.length - 1]
      ? {
          start: locations[locations.length - 1].start,
          end: locations[locations.length - 1].end,
        }
      : null;

  return (
    <BaseNode
      type="value"
      inputs={0}
      outputs={1}
      selected={selected}
      triggered={!!highlightRange}
      inputErrorFn={inputErrorFn}
      outputErrorFn={outputErrorFn}
    >
      <div className="auto-width-input text-xs">
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
            <mark className="visible bg-(--node-color) px-1 -mx-1 py-0.5  font-bold text-black rounded-sm not-italic">
              {data.value.slice(highlightRange.start, highlightRange.end)}
            </mark>
            {data.value.slice(highlightRange.end)}
          </div>
        )}
      </div>
    </BaseNode>
  );
}
