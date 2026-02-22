import { useEdges, type NodeProps } from '@xyflow/react';
import type { NoteNode as NoteNodeType } from './types';
import { BaseNode } from './BaseNode';
import { useTrigger } from '../hooks/useTrigger';

export function NoteNode({ id, selected }: NodeProps<NoteNodeType>) {
  const edges = useEdges();
  const { isTriggered: triggered } = useTrigger(id);

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

  return (
    <BaseNode
      type="note"
      label="Note"
      inputs={1}
      outputs={1}
      selected={selected}
      triggered={triggered}
      inputErrorFn={inputErrorFn}
      outputErrorFn={outputErrorFn}
    />
  );
}
