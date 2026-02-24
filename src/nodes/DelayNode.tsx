import { useEdges, useReactFlow, type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { DelayNode as DelayNodeType } from './types';
import { useTrigger } from '../hooks/useTrigger';
import { useEvents } from '../hooks/useEvents';

export function DelayNode({ id, data, selected }: NodeProps<DelayNodeType>) {
  const { updateNodeData } = useReactFlow();
  const edges = useEdges();
  const { isTriggered: triggered } = useTrigger(id);
  const events = useEvents();

  const value = data.value ?? 0.5;
  const min = data.min ?? 0;
  const max = data.max ?? 1;
  const step = data.step ?? 0.1;

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
      type="delay"
      nodeId={id}
      events={events}
      label="Delay"
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
      isSliderMode={data.isSlider ?? true}
      onSliderModeChange={(isSlider) => updateNodeData(id, { isSlider })}
      isInputMode={data.isInput ?? false}
      onInputModeChange={(isInput) => updateNodeData(id, { isInput })}
      expanded={data.expanded ?? false}
      onExpandedChange={(expanded) => updateNodeData(id, { expanded })}
    />
  );
}
