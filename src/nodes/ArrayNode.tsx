import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import type { ArrayNode as ArrayNodeType } from './types';

export function ArrayNode({ id, data, selected }: NodeProps<ArrayNodeType>) {
  const { updateNodeData } = useReactFlow();
  const inputCount = data.inputCount || 2;

  const addInput = () => {
    updateNodeData(id, { inputCount: inputCount + 1 });
  };

  const removeInput = () => {
    if (inputCount > 2) {
      updateNodeData(id, { inputCount: inputCount - 1 });
    }
  };

  return (
    <div
      className={`relative px-4 py-3 rounded-lg bg-indigo-900 border-2 ${
        selected ? 'border-indigo-400' : 'border-indigo-700'
      }`}
    >
      {/* Input handles - positioned absolutely */}
      {Array.from({ length: inputCount }).map((_, i) => (
        <Handle
          key={i}
          type="target"
          position={Position.Left}
          id={`input-${i}`}
          className="w-3 h-3 bg-indigo-400"
          style={{ top: `${32 + i * 24}px` }}
        />
      ))}

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-indigo-400"
        style={{ top: '50%' }}
      />

      <div className="text-xs text-indigo-300 mb-2">Array</div>

      {/* Input labels */}
      <div className="flex flex-col gap-1 min-w-[60px]">
        {Array.from({ length: inputCount }).map((_, i) => (
          <div key={i} className="h-5 flex items-center">
            <span className="text-xs text-indigo-400 ml-1">[{i}]</span>
          </div>
        ))}
      </div>

      {/* Add/Remove buttons */}
      <div className="flex gap-1 mt-2">
        <button
          onClick={addInput}
          className="px-2 py-0.5 text-xs bg-indigo-700 hover:bg-indigo-600 rounded"
        >
          +
        </button>
        <button
          onClick={removeInput}
          disabled={inputCount <= 2}
          className="px-2 py-0.5 text-xs bg-indigo-700 hover:bg-indigo-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          -
        </button>
      </div>
    </div>
  );
}
