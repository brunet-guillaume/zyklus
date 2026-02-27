import { useEdges, useReactFlow, type NodeProps } from '@xyflow/react';
import { useRef, useEffect, useCallback } from 'react';
import { BaseNode } from './BaseNode';
import { useTrigger } from '../hooks/useTrigger';
import { useEvents } from '../hooks/useEvents';
import type { DistortNode as DistortNodeType } from './types';

// ContentEditable numeric input component
function NumericInput({
  value,
  onChange,
  min,
  max,
  className = '',
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef(String(value));

  useEffect(() => {
    if (ref.current && String(value) !== lastValueRef.current) {
      lastValueRef.current = String(value);
      if (document.activeElement !== ref.current) {
        ref.current.textContent = String(value);
      }
    }
  }, [value]);

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = String(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInput = useCallback(() => {
    if (ref.current) {
      const text = ref.current.textContent || '';
      lastValueRef.current = text;
      const num = parseFloat(text);
      if (!isNaN(num)) {
        onChange(num);
      }
    }
  }, [onChange]);

  const handleBlur = useCallback(() => {
    if (ref.current) {
      let num = parseFloat(ref.current.textContent || '') || 0;
      if (min !== undefined) num = Math.max(min, num);
      if (max !== undefined) num = Math.min(max, num);
      lastValueRef.current = String(num);
      ref.current.textContent = String(num);
      onChange(num);
    }
  }, [onChange, min, max]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      ref.current?.blur();
    }
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (ref.current) {
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, []);

  return (
    <div
      ref={ref}
      contentEditable
      onInput={handleInput}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onDoubleClick={handleDoubleClick}
      className={className}
    />
  );
}

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
          <span className="w-12 opacity-60">Amount</span>
          <NumericInput
            value={amount}
            onChange={(v) => updateNodeData(id, { amount: v })}
            min={0}
            className="w-16 bg-black/30! px-1! py-0.5!"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-12 opacity-60">Post</span>
          <NumericInput
            value={postgain}
            onChange={(v) => updateNodeData(id, { postgain: v })}
            min={0}
            max={1}
            className="w-16 bg-black/30! px-1! py-0.5!"
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
