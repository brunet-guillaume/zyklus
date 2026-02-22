import { useEdges, type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { PickNode as PickNodeType } from './types';

export function PickNode({ id, selected }: NodeProps<PickNodeType>) {
  const edges = useEdges();

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
      type="pick"
      label="Pick"
      inputs={2}
      outputs={1}
      selected={selected}
      inputErrorFn={inputErrorFn}
      outputErrorFn={outputErrorFn}
      inputLabels={['values', 'indices']}
    />
  );
}
