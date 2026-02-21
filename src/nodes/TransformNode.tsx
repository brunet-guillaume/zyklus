import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import type { TransformNode as TransformNodeType, TransformNodeData } from './types';

const TRANSFORMS: TransformNodeData['transform'][] = ['fast', 'slow', 'rev'];

export function TransformNode({
  id,
  data,
  selected,
}: NodeProps<TransformNodeType>) {
  const { updateNodeData } = useReactFlow();
  const hasValue = data.transform !== 'rev' && data.transform !== 'stack';

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
      <div className="flex gap-2">
        <select
          value={data.transform}
          onChange={(e) =>
            updateNodeData(id, {
              transform: e.target.value as TransformNodeData['transform'],
            })
          }
          className="bg-blue-950 border border-blue-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-400"
        >
          {TRANSFORMS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {hasValue && (
          <input
            type="number"
            value={data.value ?? 1}
            onChange={(e) =>
              updateNodeData(id, { value: parseFloat(e.target.value) || 1 })
            }
            className="w-16 bg-blue-950 border border-blue-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-400"
            step="0.5"
            min="0.1"
          />
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-400"
      />
    </div>
  );
}
