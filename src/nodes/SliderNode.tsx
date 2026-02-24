import { useEffect } from 'react';
import { useEdges, useReactFlow, type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { SliderNode as SliderNodeType } from './types';

// Extend window type for slider values and modes
declare global {
  interface Window {
    __zyklusSliders?: Record<string, number>;
    __zyklusSliderModes?: Record<string, boolean>;
    __zyklusInputModes?: Record<string, boolean>;
  }
}

export function SliderNode({ id, data, selected }: NodeProps<SliderNodeType>) {
  const { updateNodeData } = useReactFlow();
  const edges = useEdges();

  const outputErrorFn = (index: number) => {
    return !edges.some(
      (e) => e.source === id && e.sourceHandle === `out-${index}`
    );
  };

  const min = data.min ?? 0;
  const max = data.max ?? 1000;
  const value = data.value ?? (min + max) / 2;

  // Sync slider value to global variable for real-time Strudel access
  useEffect(() => {
    if (!window.__zyklusSliders) {
      window.__zyklusSliders = {};
    }
    window.__zyklusSliders[id] = value;
  }, [id, value]);

  const handleChange = (v: number) => {
    // Update both React state and global variable
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
      inputs={0}
      outputs={1}
      selected={selected}
      outputErrorFn={outputErrorFn}
      slider={{
        min,
        max,
        value,
        step: data.step ?? 1,
        onChange: handleChange,
      }}
    />
  );
}
