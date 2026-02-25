import { useEdges, useReactFlow, type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { useTrigger } from '../hooks/useTrigger';
import { useEvents } from '../hooks/useEvents';
import type { BankNode as BankNodeType } from './types';

export function BankNode({ id, data, selected }: NodeProps<BankNodeType>) {
  const { updateNodeData } = useReactFlow();
  const edges = useEdges();
  const { isTriggered } = useTrigger(id);
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
      type="bank"
      nodeId={id}
      label="Bank"
      events={events}
      inputs={1}
      outputs={1}
      selected={selected}
      triggered={isTriggered}
      inputErrorFn={inputErrorFn}
      outputErrorFn={outputErrorFn}
    >
      <input
        type="text"
        value={data.bank || ''}
        onChange={(e) => updateNodeData(id, { bank: e.target.value })}
        placeholder="RolandTR808"
        className="w-full text-xs"
      />
    </BaseNode>
  );
}
