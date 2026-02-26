import { useEdges, useReactFlow, type NodeProps } from '@xyflow/react';
import { useMemo, useRef, useEffect } from 'react';
import type { ValueNode as ValueNodeType } from './types';
import { BaseNode } from './BaseNode';
import { useTrigger } from '../hooks/useTrigger';
import { useEvents } from '../hooks/useEvents';

export function ValueNode({ id, data, selected }: NodeProps<ValueNodeType>) {
  const { updateNodeData } = useReactFlow();
  const edges = useEdges();
  const { isTriggered, activeEvents } = useTrigger(id);
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

  // Convert active events to highlight ranges using location data
  const highlightRanges = useMemo(() => {
    if (!isTriggered || activeEvents.length === 0) return [];

    const value = data.value || '';
    const ranges: Array<{
      start: number;
      end: number;
      duration: number;
      triggeredAt: number;
    }> = [];

    for (const event of activeEvents) {
      if (!event.location) continue;

      const { start, end } = event.location;
      // Validate bounds
      if (start >= 0 && end <= value.length && start < end) {
        ranges.push({
          start,
          end,
          duration: event.duration,
          triggeredAt: event.triggeredAt,
        });
      }
    }

    // Sort by start position and merge overlapping ranges
    ranges.sort((a, b) => a.start - b.start);
    const merged: Array<{
      start: number;
      end: number;
      duration: number;
      triggeredAt: number;
    }> = [];
    for (const range of ranges) {
      const last = merged[merged.length - 1];
      if (last && range.start <= last.end) {
        last.end = Math.max(last.end, range.end);
        last.duration = Math.max(last.duration, range.duration);
        last.triggeredAt = Math.max(last.triggeredAt, range.triggeredAt);
      } else {
        merged.push({ ...range });
      }
    }

    return merged;
  }, [isTriggered, activeEvents, data.value]);

  // Build HTML content with highlights and duration for animation
  const htmlContent = useMemo(() => {
    const value = data.value || '';
    if (highlightRanges.length === 0) {
      return value;
    }

    let result = '';
    let pos = 0;

    for (const range of highlightRanges) {
      if (range.start > pos) {
        result += value.slice(pos, range.start);
      }
      result += `<mark data-key="${range.triggeredAt}" style="--duration: ${range.duration}ms">${value.slice(range.start, range.end)}</mark>`;
      pos = range.end;
    }

    if (pos < value.length) {
      result += value.slice(pos);
    }

    return result;
  }, [highlightRanges, data.value]);

  const editableRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef(data.value);

  // Initialize content on mount
  useEffect(() => {
    if (editableRef.current) {
      editableRef.current.innerHTML = htmlContent;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update content when highlights change (but not when user is typing)
  useEffect(() => {
    if (editableRef.current && document.activeElement !== editableRef.current) {
      editableRef.current.innerHTML = htmlContent;
    }
  }, [htmlContent]);

  // Update content when data.value changes externally
  useEffect(() => {
    if (editableRef.current && data.value !== lastValueRef.current) {
      lastValueRef.current = data.value;
      if (document.activeElement !== editableRef.current) {
        editableRef.current.innerHTML = htmlContent;
      }
    }
  }, [data.value, htmlContent]);

  const handleInput = () => {
    if (editableRef.current) {
      const text = editableRef.current.textContent || '';
      lastValueRef.current = text;
      updateNodeData(id, { value: text });
    }
  };

  return (
    <BaseNode
      type="value"
      label="Value"
      nodeId={id}
      events={events}
      inputs={0}
      outputs={1}
      selected={selected}
      triggered={isTriggered}
      inputErrorFn={inputErrorFn}
      outputErrorFn={outputErrorFn}
    >
      <div className="auto-width-input text-xs">
        <span>{data.value || ' '}</span>
        <div
          ref={editableRef}
          contentEditable
          onInput={handleInput}
          className="input editable outline-none whitespace-pre"
        />
      </div>
    </BaseNode>
  );
}
