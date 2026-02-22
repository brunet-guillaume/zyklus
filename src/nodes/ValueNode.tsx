import { useEdges, useReactFlow, type NodeProps } from '@xyflow/react';
import type { ValueNode as ValueNodeType } from './types';
import { BaseNode } from './BaseNode';

export function ValueNode({ id, data, selected }: NodeProps<ValueNodeType>) {
  const { updateNodeData } = useReactFlow();
  const edges = useEdges();

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
      type="value"
      label="Value"
      inputs={0}
      outputs={1}
      selected={selected}
      inputErrorFn={inputErrorFn}
      outputErrorFn={outputErrorFn}
    >
      <div className="auto-width-input">
        <span>{data.value || ' '}</span>
        <input
          type="text"
          value={data.value}
          onChange={(e) => updateNodeData(id, { value: e.target.value })}
          placeholder="Value"
        />
      </div>
    </BaseNode>
  );
}
