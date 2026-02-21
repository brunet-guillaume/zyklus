import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { TransformNode as TransformNodeType } from './types';

export function TransformNode({
  data,
  selected,
}: NodeProps<TransformNodeType>) {
  return (
    <div
      className={`px-4 py-3 rounded-lg bg-blue-900 border-2 ${
        selected ? 'border-blue-400' : 'border-blue-700'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-400"
      />
      <div className="text-xs text-blue-300 mb-1">Transform</div>
      <div className="font-mono text-sm text-white">
        {data.transform}
        {data.value !== undefined && ` (${data.value})`}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-400"
      />
    </div>
  );
}
