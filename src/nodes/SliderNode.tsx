import { useEffect } from 'react';
import { useEdges, useReactFlow, type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { useTrigger } from '../hooks/useTrigger';
import { useEvents } from '../hooks/useEvents';
import type { SliderNode as SliderNodeType } from './types';

declare global {
  interface Window {
    __zyklusSliders?: Record<string, number>;
  }
}

export function SliderNode({ id, data, selected }: NodeProps<SliderNodeType>) {
  const { updateNodeData } = useReactFlow();
  const edges = useEdges();
  const { isTriggered } = useTrigger(id);
  const events = useEvents();

  const outputErrorFn = (index: number) => {
    return !edges.some(
      (e) => e.source === id && e.sourceHandle === `out-${index}`
    );
  };

  const min = data.min ?? 0;
  const max = data.max ?? 100;
  const step = data.step ?? 1;
  const value = data.value ?? (min + max) / 2;

  // Sync slider value to global variable for real-time Strudel access
  useEffect(() => {
    if (!window.__zyklusSliders) {
      window.__zyklusSliders = {};
    }
    window.__zyklusSliders[id] = value;
  }, [id, value]);

  const handleChange = (v: number) => {
    updateNodeData(id, { value: v });
    if (!window.__zyklusSliders) {
      window.__zyklusSliders = {};
    }
    window.__zyklusSliders[id] = v;
  };

  return (
    <BaseNode
      type="slider"
      nodeId={id}
      label="Slider"
      events={events}
      inputs={0}
      outputs={1}
      selected={selected}
      triggered={isTriggered}
      outputErrorFn={outputErrorFn}
      className="w-46"
      slider={{
        min,
        max,
        step,
        value,
        onChange: handleChange,
        onMinChange: (v) => updateNodeData(id, { min: v }),
        onMaxChange: (v) => updateNodeData(id, { max: v }),
        onStepChange: (v) => updateNodeData(id, { step: v }),
      }}
      isSliderMode={true}
      sliderOnly={true}
      expanded={data.expanded ?? false}
      onExpandedChange={(expanded) => updateNodeData(id, { expanded })}
    />
  );
}
