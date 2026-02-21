import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import type { ValueNode as ValueNodeType } from './types';

export function ValueNode({ id, data, selected }: NodeProps<ValueNodeType>) {
  const { updateNodeData } = useReactFlow();

  return (
    <div
      className={`px-3 py-2 rounded-lg bg-amber-900 border-2 ${
        selected ? 'border-amber-400' : 'border-amber-700'
      }`}
    >
      <div className="text-xs text-amber-300 mb-1">Value</div>
      <input
        type="text"
        value={data.value}
        onChange={(e) => updateNodeData(id, { value: e.target.value })}
        className="w-20 bg-amber-950 border border-amber-700 rounded px-2 py-1 text-sm font-mono text-white focus:outline-none focus:border-amber-400 text-center"
        placeholder="c3"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-amber-400"
      />
    </div>
  );
}
