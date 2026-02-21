import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { EffectNode as EffectNodeType } from './types';

export function EffectNode({ data, selected }: NodeProps<EffectNodeType>) {
  return (
    <div
      className={`px-4 py-3 rounded-lg bg-green-900 border-2 ${
        selected ? 'border-green-400' : 'border-green-700'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-green-400"
      />
      <div className="text-xs text-green-300 mb-1">Effect</div>
      <div className="font-mono text-sm text-white">
        {data.effect}: {data.value}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-400"
      />
    </div>
  );
}
