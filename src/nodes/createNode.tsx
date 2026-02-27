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
import {
  ContentEditableInput,
  ContentEditableCode,
  HighlightableInput,
  FieldsRenderer,
} from './ContentEditableInputs';

interface GenericNodeData {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  isSlider?: boolean;
  isInput?: boolean;
  expanded?: boolean;
  isPlaying?: boolean;
  // Text input data
  name?: string;
  bank?: string;
  scale?: string;
  // Code editor data
  code?: string;
  // Dynamic generic data access
  [key: string]: unknown;
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

    // Calculate dynamic inputs if enabled
    let inputCount = def.inputs;
    let dynamicInputLabels: string[] | undefined;

    if (def.dynamicInputs) {
      // Find the highest connected input index
      const connectedInputs = edges
        .filter((e) => e.target === id && e.targetHandle?.startsWith('in-'))
        .map((e) => parseInt(e.targetHandle?.split('-')[1] || '0'));

      const highestConnectedIndex =
        connectedInputs.length > 0 ? Math.max(...connectedInputs) : -1;

      // Always have one more input than the highest connected index (minimum 1)
      inputCount = Math.max(1, highestConnectedIndex + 2);
      dynamicInputLabels = Array.from(
        { length: inputCount },
        (_, i) => `[${i}]`
      );
    }

    // Error checking functions
    const inputErrorFn = (index: number) => {
      // For dynamic inputs, only show error on connected inputs, not the empty slot
      if (def.dynamicInputs) {
        const connectedInputs = edges
          .filter((e) => e.target === id && e.targetHandle?.startsWith('in-'))
          .map((e) => parseInt(e.targetHandle?.split('-')[1] || '0'));
        const highestConnectedIndex =
          connectedInputs.length > 0 ? Math.max(...connectedInputs) : -1;
        if (index > highestConnectedIndex) return false;
      }
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

    // Build text input element if defined
    const textInputElement = def.textInput ? (
      <ContentEditableInput
        value={(data[def.textInput.dataKey] as string) || ''}
        onChange={(text) =>
          updateNodeData(id, { [def.textInput!.dataKey]: text })
        }
        placeholder={def.textInput.placeholder}
      />
    ) : null;

    // Build code editor element if defined
    const codeEditorElement = def.codeEditor ? (
      <ContentEditableCode
        value={data.code || ''}
        onChange={(text) => updateNodeData(id, { code: text })}
        placeholder={def.codeEditor.placeholder}
      />
    ) : null;

    // Build highlightable input element if defined (for Value node)
    const highlightableElement = def.highlightable ? (
      <HighlightableInput
        nodeId={id}
        value={(data[def.highlightable.dataKey] as string) || ''}
        onChange={(text) =>
          updateNodeData(id, { [def.highlightable!.dataKey]: text })
        }
        placeholder={def.highlightable.placeholder}
      />
    ) : null;

    // Build fields element if defined (for Distort node)
    const fieldsElement = def.fields ? (
      <FieldsRenderer
        fields={def.fields}
        data={data}
        updateData={(updates) => updateNodeData(id, updates)}
      />
    ) : null;

    return (
      <BaseNode
        type={type}
        nodeId={id}
        events={events}
        label={def.label}
        inputs={inputCount}
        outputs={def.outputs}
        selected={selected}
        triggered={isTriggered}
        modeOutput={def.modeOutput}
        className={def.className}
        inputLabels={dynamicInputLabels || def.inputLabels}
        inputErrorFn={inputCount > 0 ? inputErrorFn : undefined}
        outputErrorFn={def.outputs > 0 ? outputErrorFn : undefined}
        sliderOnly={def.sliderOnly}
        {...sliderConfig}
      >
        {textInputElement}
        {codeEditorElement}
        {highlightableElement}
        {fieldsElement}
      </BaseNode>
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
