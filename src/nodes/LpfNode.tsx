import { useEdges, useReactFlow, type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { LpfNode as LpfNodeType } from './types';
import { useTrigger } from '../hooks/useTrigger';

export function LpfNode({ id, data, selected }: NodeProps<LpfNodeType>) {
  const { updateNodeData } = useReactFlow();
  const edges = useEdges();
  const { isTriggered: triggered } = useTrigger(id);

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
      type="lpf"
      label="Low-pass"
      inputs={1}
      outputs={1}
      selected={selected}
      triggered={triggered}
      inputErrorFn={inputErrorFn}
      outputErrorFn={outputErrorFn}
    >
      <div className="auto-width-input">
        <span>{data.value ?? ' '}</span>
        <input
          type="number"
          value={data.value ?? 1000}
          onChange={(e) =>
            updateNodeData(id, { value: parseFloat(e.target.value) || 0 })
          }
          step="100"
          min="20"
          max="20000"
        />
      </div>
    </BaseNode>
  );
}
