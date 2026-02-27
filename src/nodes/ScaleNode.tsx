import { useEdges, useReactFlow, type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { useTrigger } from '../hooks/useTrigger';
import { useEvents } from '../hooks/useEvents';
import type { ScaleNode as ScaleNodeType } from './types';

export function ScaleNode({ id, data, selected }: NodeProps<ScaleNodeType>) {
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
      type="scale"
      nodeId={id}
      label="Scale"
      events={events}
      inputs={1}
      outputs={1}
      selected={selected}
      triggered={isTriggered}
      modeOutput
      inputErrorFn={inputErrorFn}
      outputErrorFn={outputErrorFn}
    >
      <input
        type="text"
        value={data.scale || ''}
        onChange={(e) => updateNodeData(id, { scale: e.target.value })}
        placeholder="c:minor"
        className="w-full text-xs"
      />
    </BaseNode>
  );
}
