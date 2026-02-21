import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import type { PatternNode as PatternNodeType } from './types';

export function PatternNode({ id, data, selected }: NodeProps<PatternNodeType>) {
  const { updateNodeData } = useReactFlow();

  return (
    <div
      className={`px-4 py-3 rounded-lg bg-purple-900 border-2 ${
        selected ? 'border-purple-400' : 'border-purple-700'
      }`}
    >
      <div className="text-xs text-purple-300 mb-1">Pattern</div>
      <input
        type="text"
        value={data.pattern}
        onChange={(e) => updateNodeData(id, { pattern: e.target.value })}
        className="w-full bg-purple-950 border border-purple-700 rounded px-2 py-1 text-sm font-mono text-white focus:outline-none focus:border-purple-400"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-purple-400"
      />
    </div>
  );
}
