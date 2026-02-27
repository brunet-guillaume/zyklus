import { useEdges, useReactFlow, type NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { useTrigger } from '../hooks/useTrigger';
import { useEvents } from '../hooks/useEvents';
import type { DistortNode as DistortNodeType } from './types';

const MODES = [
  '',
  'scurve',
  'soft',
  'hard',
  'cubic',
  'diode',
  'asym',
  'fold',
  'sinefold',
  'chebyshev',
];

export function DistortNode({
  id,
  data,
  selected,
}: NodeProps<DistortNodeType>) {
  const { updateNodeData } = useReactFlow();
  const edges = useEdges();
  const { isTriggered } = useTrigger(id);
  const events = useEvents();

  const inputErrorFn = (index: number) => {
    return !edges.some(
      (e) => e.target === id && e.targetHandle === `in-${index}`
    );
  };

  const outputErrorFn = (index: number) => {
    return !edges.some(
      (e) => e.source === id && e.sourceHandle === `out-${index}`
    );
  };

  const amount = data.amount ?? 2;
  const postgain = data.postgain ?? 0.5;
  const mode = data.mode ?? '';

  return (
    <BaseNode
      type="distort"
      nodeId={id}
      label="Distort"
      events={events}
      inputs={1}
      outputs={1}
      selected={selected}
      triggered={isTriggered}
      inputErrorFn={inputErrorFn}
      outputErrorFn={outputErrorFn}
    >
      <div className="flex flex-col gap-1 text-xs">
        <div className="flex items-center gap-2">
          <label className="w-12 opacity-60">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) =>
              updateNodeData(id, { amount: parseFloat(e.target.value) || 0 })
            }
            className="w-16 bg-black/30 rounded px-1 py-0.5"
            step="0.5"
            min="0"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="w-12 opacity-60">Post</label>
          <input
            type="number"
            value={postgain}
            onChange={(e) =>
              updateNodeData(id, { postgain: parseFloat(e.target.value) || 0 })
            }
            className="w-16 bg-black/30 rounded px-1 py-0.5"
            step="0.1"
            min="0"
            max="1"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="w-12 opacity-60">Mode</label>
          <select
            value={mode}
            onChange={(e) => updateNodeData(id, { mode: e.target.value })}
            className="w-20 bg-black/30 rounded px-1 py-0.5"
          >
            {MODES.map((m) => (
              <option key={m} value={m}>
                {m || 'default'}
              </option>
            ))}
          </select>
        </div>
      </div>
    </BaseNode>
  );
}
