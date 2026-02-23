import { useEdges, type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { OutputNode as OutputNodeType } from './types';
import { useTrigger } from '../hooks/useTrigger';
import { useEvents } from '../hooks/useEvents';

export function OutputNode({ id, data, selected }: NodeProps<OutputNodeType>) {
  const edges = useEdges();
  const { isTriggered: triggered } = useTrigger(id);
  const events = useEvents();

  const inputErrorFn = (index: number) => {
    return !edges.some(
      (e) => e.target === id && e.targetHandle === `in-${index}`
    );
  };

  return (
    <BaseNode
      type="output"
      nodeId={id}
      events={events}
      label="Output"
      inputs={1}
      outputs={0}
      selected={selected}
      triggered={data.isPlaying && triggered}
      inputErrorFn={inputErrorFn}
    >
      <div className="bg-black/30 rounded px-2 py-1 border-b text-xs">
        {data.isPlaying ? 'Playing' : 'Stopped'}
      </div>
    </BaseNode>
  );
}
