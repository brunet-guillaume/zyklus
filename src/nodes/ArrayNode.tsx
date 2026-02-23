import { useEdges, useReactFlow, type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { ArrayNode as ArrayNodeType } from './types';
import { useTrigger } from '../hooks/useTrigger';
import { useEvents } from '../hooks/useEvents';

export function ArrayNode({ id, data, selected }: NodeProps<ArrayNodeType>) {
  const { updateNodeData } = useReactFlow();
  const edges = useEdges();
  const { isTriggered: triggered } = useTrigger(id);
  const events = useEvents();
  const inputCount = data.inputCount || 2;

  const addInput = () => {
    updateNodeData(id, { inputCount: inputCount + 1 });
  };

  const removeInput = () => {
    if (inputCount > 2) {
      updateNodeData(id, { inputCount: inputCount - 1 });
    }
  };

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

  const inputLabels = Array.from({ length: inputCount }, (_, i) => `[${i}]`);

  return (
    <BaseNode
      type="array"
      nodeId={id}
      events={events}
      inputs={inputCount}
      outputs={1}
      selected={selected}
      triggered={triggered}
      inputErrorFn={inputErrorFn}
      outputErrorFn={outputErrorFn}
      inputLabels={inputLabels}
    >
      {/* Add/Remove buttons */}
      <div className="grid grid-cols-2 gap-1 mt-2">
        <button
          onClick={addInput}
          className="px-2 py-0.5 w-full text-xs bg-black/30 hover:opacity-80 rounded border-b"
        >
          +
        </button>
        <button
          onClick={removeInput}
          disabled={inputCount <= 2}
          className="px-2 py-0.5 w-full text-xs bg-black/30 hover:opacity-80 rounded border-b disabled:opacity-50 disabled:cursor-not-allowed"
        >
          -
        </button>
      </div>
    </BaseNode>
  );
}
