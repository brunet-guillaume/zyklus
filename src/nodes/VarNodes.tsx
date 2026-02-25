import { useEdges, useReactFlow, type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { useTrigger } from '../hooks/useTrigger';
import type {
  SetVarNode as SetVarNodeType,
  GetVarNode as GetVarNodeType,
} from './types';

export function SetVarNode({ id, data, selected }: NodeProps<SetVarNodeType>) {
  const { updateNodeData } = useReactFlow();
  const edges = useEdges();
  const { isTriggered } = useTrigger(id);

  const inputErrorFn = (index: number) => {
    return !edges.some(
      (e) => e.target === id && e.targetHandle === `in-${index}`
    );
  };

  return (
    <BaseNode
      type="setVar"
      nodeId={id}
      label="Set"
      inputs={1}
      outputs={0}
      selected={selected}
      triggered={isTriggered}
      inputErrorFn={inputErrorFn}
    >
      <input
        type="text"
        value={data.name || ''}
        onChange={(e) => updateNodeData(id, { name: e.target.value })}
        placeholder="var name"
        className="w-full text-xs"
      />
    </BaseNode>
  );
}

export function GetVarNode({ id, data, selected }: NodeProps<GetVarNodeType>) {
  const { updateNodeData } = useReactFlow();
  const edges = useEdges();
  const { isTriggered } = useTrigger(id);

  const outputErrorFn = (index: number) => {
    return !edges.some(
      (e) => e.source === id && e.sourceHandle === `out-${index}`
    );
  };

  return (
    <BaseNode
      type="getVar"
      nodeId={id}
      label="Get"
      inputs={0}
      outputs={1}
      selected={selected}
      triggered={isTriggered}
      outputErrorFn={outputErrorFn}
    >
      <input
        type="text"
        value={data.name || ''}
        onChange={(e) => updateNodeData(id, { name: e.target.value })}
        placeholder="var name"
        className="w-full text-xs"
      />
    </BaseNode>
  );
}
