import { useReactFlow, useEdges, type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { FastNode as FastNodeType } from './types';

export function FastNode({ id, data, selected }: NodeProps<FastNodeType>) {
  const { updateNodeData } = useReactFlow();
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
      type="fast"
      label="Fast"
      inputs={1}
      outputs={1}
      selected={selected}
      inputErrorFn={inputErrorFn}
      outputErrorFn={outputErrorFn}
    >
      <div className="auto-width-input">
        <span>{data.value || ' '}</span>
        <input
          type="number"
          value={data.value ?? 2}
          onChange={(e) =>
            updateNodeData(id, { value: parseFloat(e.target.value) || 2 })
          }
          step="0.5"
          min="0.1"
        />
      </div>
    </BaseNode>
  );
}
