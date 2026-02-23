import { useEdges, type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { ArrayNode as ArrayNodeType } from './types';
import { useTrigger } from '../hooks/useTrigger';
import { useEvents } from '../hooks/useEvents';

export function ArrayNode({ id, selected }: NodeProps<ArrayNodeType>) {
  const edges = useEdges();
  const { isTriggered: triggered } = useTrigger(id);
  const events = useEvents();

  // Find the highest connected input index
  const connectedInputs = edges
    .filter((e) => e.target === id && e.targetHandle?.startsWith('in-'))
    .map((e) => parseInt(e.targetHandle?.split('-')[1] || '0'));

  const highestConnectedIndex =
    connectedInputs.length > 0 ? Math.max(...connectedInputs) : -1;

  // Always have one more input than the highest connected index (minimum 1)
  const inputCount = Math.max(1, highestConnectedIndex + 2);

  const inputErrorFn = (index: number) => {
    // Only show error on connected inputs, not the empty slot
    if (index > highestConnectedIndex) return false;
    return !edges.some(
      (e) => e.target === id && e.targetHandle === `in-${index}`
    );
  };

  const outputErrorFn = (index: number) => {
    return !edges.some(
      (e) => e.source === id && e.sourceHandle === `out-${index}`
    );
  };

  const inputLabels = Array.from({ length: inputCount }, (_, i) => `[${i}]`);

  return (
    <BaseNode
      type="array"
      nodeId={id}
      events={events}
      inputs={inputCount}
      outputs={1}
      selected={selected}
      triggered={triggered}
      inputErrorFn={inputErrorFn}
      outputErrorFn={outputErrorFn}
      inputLabels={inputLabels}
    />
  );
}
