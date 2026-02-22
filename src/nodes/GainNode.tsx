import { useEdges, useReactFlow, type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { GainNode as GainNodeType } from './types';

export function GainNode({ id, data, selected }: NodeProps<GainNodeType>) {
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
      type="gain"
      label="Gain"
      inputs={1}
      outputs={1}
      selected={selected}
      inputErrorFn={inputErrorFn}
      outputErrorFn={outputErrorFn}
    >
      <div className="auto-width-input">
        <span>{data.value ?? ' '}</span>
        <input
          type="number"
          value={data.value ?? 0.8}
          onChange={(e) =>
            updateNodeData(id, { value: parseFloat(e.target.value) || 0 })
          }
          step="0.1"
          min="0"
          max="1"
        />
      </div>
    </BaseNode>
  );
}
