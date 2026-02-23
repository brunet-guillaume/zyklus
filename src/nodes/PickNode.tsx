import { useEdges, type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { PickNode as PickNodeType } from './types';
import { useTrigger } from '../hooks/useTrigger';
import { useEvents } from '../hooks/useEvents';

export function PickNode({ id, selected }: NodeProps<PickNodeType>) {
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
      type="pick"
      nodeId={id}
      events={events}
      label="Pick"
      inputs={2}
      outputs={1}
      selected={selected}
      triggered={triggered}
      inputErrorFn={inputErrorFn}
      outputErrorFn={outputErrorFn}
      inputLabels={['Values', 'Indices']}
    />
  );
}
