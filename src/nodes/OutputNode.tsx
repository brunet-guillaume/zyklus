import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { OutputNode as OutputNodeType } from './types';

export function OutputNode({ data, selected }: NodeProps<OutputNodeType>) {
  return (
    <div
      className={`px-4 py-3 rounded-lg bg-orange-900 border-2 ${
        selected ? 'border-orange-400' : 'border-orange-700'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-orange-400"
      />
      <div className="text-xs text-orange-300 mb-1">Output</div>
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            data.isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
          }`}
        />
        <span className="text-sm text-white">
          {data.isPlaying ? 'Playing' : 'Stopped'}
        </span>
      </div>
    </div>
  );
}
