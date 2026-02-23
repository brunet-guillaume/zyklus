import { useEdges, type NodeProps } from '@xyflow/react';
import type { NoteNode as NoteNodeType } from './types';
import { BaseNode } from './BaseNode';
import { useTrigger } from '../hooks/useTrigger';
import { useEvents } from '../hooks/useEvents';

export function NoteNode({ id, selected }: NodeProps<NoteNodeType>) {
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
      type="note"
      modeOutput
      className="w-20"
      nodeId={id}
      events={events}
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
