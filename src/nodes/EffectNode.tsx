import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import type { EffectNode as EffectNodeType, EffectNodeData } from './types';

const EFFECTS: { value: EffectNodeData['effect']; label: string }[] = [
  { value: 'gain', label: 'Gain' },
  { value: 'room', label: 'Reverb' },
  { value: 'delay', label: 'Delay' },
  { value: 'lpf', label: 'Low-pass' },
];

export function EffectNode({ id, data, selected }: NodeProps<EffectNodeType>) {
  const { updateNodeData } = useReactFlow();

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
      <div className="flex gap-2">
        <select
          value={data.effect}
          onChange={(e) =>
            updateNodeData(id, {
              effect: e.target.value as EffectNodeData['effect'],
            })
          }
          className="bg-green-950 border border-green-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-green-400"
        >
          {EFFECTS.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={data.value}
          onChange={(e) =>
            updateNodeData(id, { value: parseFloat(e.target.value) || 0 })
          }
          className="w-16 bg-green-950 border border-green-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-green-400"
          step="0.1"
          min="0"
          max="1"
        />
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-400"
      />
    </div>
  );
}
