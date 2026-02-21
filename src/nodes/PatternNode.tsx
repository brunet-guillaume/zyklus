import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { PatternNode as PatternNodeType } from './types';

export function PatternNode({ data, selected }: NodeProps<PatternNodeType>) {
  return (
    <div
      className={`px-4 py-3 rounded-lg bg-purple-900 border-2 ${
        selected ? 'border-purple-400' : 'border-purple-700'
      }`}
    >
      <div className="text-xs text-purple-300 mb-1">Pattern</div>
      <div className="font-mono text-sm text-white">{data.pattern}</div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-purple-400"
      />
    </div>
  );
}
