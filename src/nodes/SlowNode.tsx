import { useReactFlow, useEdges, type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { SlowNode as SlowNodeType } from './types';
import { useTrigger } from '../hooks/useTrigger';
import { useEvents } from '../hooks/useEvents';

export function SlowNode({ id, data, selected }: NodeProps<SlowNodeType>) {
  const { updateNodeData } = useReactFlow();
  const edges = useEdges();
  const { isTriggered: triggered } = useTrigger(id);
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

  return (
    <BaseNode
      type="slow"
      nodeId={id}
      events={events}
      label="Slow"
      inputs={1}
      outputs={1}
      selected={selected}
      triggered={triggered}
      inputErrorFn={inputErrorFn}
      outputErrorFn={outputErrorFn}
    >
      <input
        type="number"
        value={data.value ?? 2}
        onChange={(e) =>
          updateNodeData(id, { value: parseFloat(e.target.value) || 2 })
        }
        className="w-16 bg-transparent border-b border-current/50 px-1 py-0.5 text-sm font-mono text-center focus:outline-none focus:border-current"
        step="0.5"
        min="0.1"
      />
    </BaseNode>
  );
}
