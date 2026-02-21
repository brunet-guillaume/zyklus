import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import type { NoteNode as NoteNodeType } from './types';

export function NoteNode({ id, data, selected }: NodeProps<NoteNodeType>) {
  const { updateNodeData } = useReactFlow();

  return (
    <div
      className={`px-4 py-3 rounded-lg bg-pink-900 border-2 ${
        selected ? 'border-pink-400' : 'border-pink-700'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-pink-400"
      />
      <div className="text-xs text-pink-300 mb-1">Note</div>
      <input
        type="text"
        value={data.notes}
        onChange={(e) => updateNodeData(id, { notes: e.target.value })}
        className="w-full bg-pink-950 border border-pink-700 rounded px-2 py-1 text-sm font-mono text-white focus:outline-none focus:border-pink-400"
        placeholder="c3 e3 g3"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-pink-400"
      />
    </div>
  );
}
