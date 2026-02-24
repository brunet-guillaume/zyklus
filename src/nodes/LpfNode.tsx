import { useEdges, useReactFlow, type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { LpfNode as LpfNodeType } from './types';
import { useTrigger } from '../hooks/useTrigger';
import { useEvents } from '../hooks/useEvents';

export function LpfNode({ id, data, selected }: NodeProps<LpfNodeType>) {
  const { updateNodeData } = useReactFlow();
  const edges = useEdges();
  const { isTriggered: triggered } = useTrigger(id);
  const events = useEvents();

  const value = data.value ?? 1000;
  const min = data.min ?? 20;
  const max = data.max ?? 20000;
  const step = data.step ?? 100;

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
      nodeId={id}
      events={events}
      label="Low-pass"
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
      isInputMode={data.isInput ?? false}
      onInputModeChange={(isInput) => updateNodeData(id, { isInput })}
      expanded={data.expanded ?? false}
      onExpandedChange={(expanded) => updateNodeData(id, { expanded })}
    />
  );
}
