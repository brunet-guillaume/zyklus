import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import type { PickNode as PickNodeType } from './types';

export function PickNode({ id, data, selected }: NodeProps<PickNodeType>) {
  const { updateNodeData } = useReactFlow();

  return (
    <div
      className={`px-4 py-3 rounded-lg bg-cyan-900 border-2 ${
        selected ? 'border-cyan-400' : 'border-cyan-700'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="array"
        className="w-3 h-3 bg-cyan-400"
      />
      <div className="text-xs text-cyan-300 mb-1">Pick</div>
      <div className="space-y-2">
        <input
          type="text"
          value={data.values}
          onChange={(e) => updateNodeData(id, { values: e.target.value })}
          className="w-full bg-cyan-950 border border-cyan-700 rounded px-2 py-1 text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
          placeholder="c3, e3, g3, c4"
        />
        <input
          type="text"
          value={data.indices}
          onChange={(e) => updateNodeData(id, { indices: e.target.value })}
          className="w-full bg-cyan-950 border border-cyan-700 rounded px-2 py-1 text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
          placeholder="<0 1 2 3>"
        />
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-cyan-400"
      />
    </div>
  );
}
