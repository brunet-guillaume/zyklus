import { useEdges, useReactFlow, type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { CodeNode as CodeNodeType } from './types';
import { useTrigger } from '../hooks/useTrigger';
import { useEvents } from '../hooks/useEvents';

export function CodeNode({ id, data, selected }: NodeProps<CodeNodeType>) {
  const { updateNodeData } = useReactFlow();
  const edges = useEdges();
  const { isTriggered: triggered } = useTrigger(id);
  const events = useEvents();

  const outputErrorFn = (index: number) => {
    return !edges.some(
      (e) => e.source === id && e.sourceHandle === `out-${index}`
    );
  };

  return (
    <BaseNode
      type="code"
      nodeId={id}
      events={events}
      label="Code"
      inputs={1}
      outputs={1}
      selected={selected}
      triggered={triggered}
      outputErrorFn={outputErrorFn}
    >
      <textarea
        value={data.code}
        onChange={(e) => updateNodeData(id, { code: e.target.value })}
        className="w-48 h-20 bg-(--background) rounded px-2 py-1 border-b text-xs font-mono focus:outline-none resize-none"
        placeholder='note("c3 e3 g3")'
      />
    </BaseNode>
  );
}
