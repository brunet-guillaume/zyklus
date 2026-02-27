import { useEdges, useReactFlow } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { useTrigger } from '../hooks/useTrigger';
import { useEvents } from '../hooks/useEvents';
import {
  nodeDefinitions,
  type NodeType,
  type NodeDefinition,
} from './nodeDefinitions';
import type { SliderNodeData } from './types';

interface GenericNodeData {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  isSlider?: boolean;
  isInput?: boolean;
  expanded?: boolean;
  isPlaying?: boolean;
}

export function createNode(type: NodeType) {
  const def: NodeDefinition = nodeDefinitions[type];

  function GeneratedNode({
    id,
    data,
    selected,
  }: {
    id: string;
    data: GenericNodeData;
    selected?: boolean;
  }) {
    const { updateNodeData } = useReactFlow();
    const edges = useEdges();
    const { isTriggered: triggered } = useTrigger(id);
    const events = useEvents();

    // Error checking functions
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

    // Build slider config if the node has slider support
    const sliderConfig = def.slider
      ? (() => {
          const sliderData = data as SliderNodeData;
          const value = sliderData.value ?? def.slider.value;
          const min = sliderData.min ?? def.slider.min;
          const max = sliderData.max ?? def.slider.max;
          const step = sliderData.step ?? def.slider.step;

          return {
            slider: {
              value,
              min,
              max,
              step,
              onChange: (v: number) => updateNodeData(id, { value: v }),
              onMinChange: (v: number) => updateNodeData(id, { min: v }),
              onMaxChange: (v: number) => updateNodeData(id, { max: v }),
              onStepChange: (v: number) => updateNodeData(id, { step: v }),
            },
            isSliderMode:
              sliderData.isSlider ?? def.slider.defaultMode === 'slider',
            onSliderModeChange: (isSlider: boolean) =>
              updateNodeData(id, { isSlider }),
            isInputMode: sliderData.isInput ?? false,
            onInputModeChange: (isInput: boolean) =>
              updateNodeData(id, { isInput }),
            expanded: sliderData.expanded ?? false,
            onExpandedChange: (expanded: boolean) =>
              updateNodeData(id, { expanded }),
          };
        })()
      : {};

    // Special case for output node: triggered depends on isPlaying
    const isTriggered =
      type === 'output' ? data.isPlaying && triggered : triggered;

    return (
      <BaseNode
        type={type}
        nodeId={id}
        events={events}
        label={def.label}
        inputs={def.inputs}
        outputs={def.outputs}
        selected={selected}
        triggered={isTriggered}
        modeOutput={def.modeOutput}
        className={def.className}
        inputLabels={def.inputLabels}
        inputErrorFn={def.inputs > 0 ? inputErrorFn : undefined}
        outputErrorFn={def.outputs > 0 ? outputErrorFn : undefined}
        {...sliderConfig}
      />
    );
  }

  GeneratedNode.displayName = `${type.charAt(0).toUpperCase() + type.slice(1)}Node`;

  return GeneratedNode;
}

// Generate all node components from definitions
export const generatedNodes = Object.fromEntries(
  Object.keys(nodeDefinitions).map((type) => [
    type,
    createNode(type as NodeType),
  ])
) as Record<NodeType, ReturnType<typeof createNode>>;
