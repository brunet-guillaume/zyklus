import { useEdges, type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { OutputNode as OutputNodeType } from './types';

export function OutputNode({ id, data, selected }: NodeProps<OutputNodeType>) {
  const edges = useEdges();

  const inputErrorFn = (index: number) => {
    return !edges.some(
      (e) => e.target === id && e.targetHandle === `in-${index}`
    );
  };

  return (
    <BaseNode
      type="output"
      label="Output"
      inputs={1}
      outputs={0}
      selected={selected}
      inputErrorFn={inputErrorFn}
    >
      <div className="bg-(--background) rounded px-2 py-1 border-b text-xs">
        {data.isPlaying ? 'Playing' : 'Stopped'}
      </div>
    </BaseNode>
  );
}
