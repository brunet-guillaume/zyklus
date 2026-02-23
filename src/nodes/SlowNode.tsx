import { useReactFlow, useEdges, type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { SlowNode as SlowNodeType } from './types';
import { useTrigger } from '../hooks/useTrigger';
import { useEvents } from '../hooks/useEvents';

export function SlowNode({ id, data, selected }: NodeProps<SlowNodeType>) {
  const { updateNodeData } = useReactFlow();
  const edges = useEdges();
  const { isTriggered: triggered } = useTrigger(id);
  const events = useEvents();

  const value = data.value ?? 2;
  const min = data.min ?? 0.1;
  const max = data.max ?? 16;
  const step = data.step ?? 0.5;

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
      type="slow"
      nodeId={id}
      events={events}
      label="Slow"
      inputs={1}
      outputs={1}
      selected={selected}
      triggered={triggered}
      inputErrorFn={inputErrorFn}
      outputErrorFn={outputErrorFn}
      className="w-46"
      slider={{
        value,
        min,
        max,
        step,
        onChange: (v) => updateNodeData(id, { value: v }),
        onMinChange: (v) => updateNodeData(id, { min: v }),
        onMaxChange: (v) => updateNodeData(id, { max: v }),
        onStepChange: (v) => updateNodeData(id, { step: v }),
      }}
      isSliderMode={data.isSlider ?? false}
      onSliderModeChange={(isSlider) => updateNodeData(id, { isSlider })}
      expanded={data.expanded ?? false}
      onExpandedChange={(expanded) => updateNodeData(id, { expanded })}
    />
  );
}
