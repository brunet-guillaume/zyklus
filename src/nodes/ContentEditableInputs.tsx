import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useTrigger } from '../hooks/useTrigger';
import type { FieldDefinition } from './nodeDefinitions';

// ContentEditable text input component
export function ContentEditableInput({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef(value);

  useEffect(() => {
    if (ref.current && value !== lastValueRef.current) {
      lastValueRef.current = value;
      if (document.activeElement !== ref.current) {
        ref.current.textContent = value;
      }
    }
  }, [value]);

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInput = useCallback(() => {
    if (ref.current) {
      const text = ref.current.textContent || '';
      lastValueRef.current = text;
      onChange(text);
    }
  }, [onChange]);

  const handleDoubleClick = useCallback(() => {
    if (ref.current) {
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      ref.current?.blur();
    }
  }, []);

  return (
    <div className="auto-width-input text-xs">
      <span>{value || placeholder}</span>
      <div
        ref={ref}
        contentEditable
        onInput={handleInput}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className={`input editable outline-none whitespace-pre ${className}`}
      />
    </div>
  );
}

// ContentEditable code editor component
export function ContentEditableCode({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef(value);

  useEffect(() => {
    if (ref.current && value !== lastValueRef.current) {
      lastValueRef.current = value;
      if (document.activeElement !== ref.current) {
        ref.current.textContent = value;
      }
    }
  }, [value]);

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInput = useCallback(() => {
    if (ref.current) {
      const text = ref.current.textContent || '';
      lastValueRef.current = text;
      onChange(text);
    }
  }, [onChange]);

  const handleDoubleClick = useCallback(() => {
    if (ref.current) {
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      ref.current?.blur();
    }
  }, []);

  return (
    <div
      ref={ref}
      contentEditable
      onInput={handleInput}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      data-placeholder={placeholder}
      className={`w-48 min-h-20 border-b text-xs font-mono whitespace-pre-wrap ${className}`}
    />
  );
}

// ContentEditable with real-time character highlighting (for Value node)
export function HighlightableInput({
  nodeId,
  value,
  onChange,
  placeholder,
  className = '',
}: {
  nodeId: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  const { isTriggered, activeEvents } = useTrigger(nodeId);
  const editableRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef(value);

  // Convert active events to highlight ranges using location data
  const highlightRanges = useMemo(() => {
    if (!isTriggered || activeEvents.length === 0) return [];

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
    const merged: typeof ranges = [];
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
  }, [isTriggered, activeEvents, value]);

  // Build HTML content with highlights
  const htmlContent = useMemo(() => {
    if (highlightRanges.length === 0) return value;

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
  }, [highlightRanges, value]);

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

  // Update content when value changes externally
  useEffect(() => {
    if (editableRef.current && value !== lastValueRef.current) {
      lastValueRef.current = value;
      if (document.activeElement !== editableRef.current) {
        editableRef.current.innerHTML = htmlContent;
      }
    }
  }, [value, htmlContent]);

  const handleInput = useCallback(() => {
    if (editableRef.current) {
      const text = editableRef.current.textContent || '';
      lastValueRef.current = text;
      onChange(text);
    }
  }, [onChange]);

  const handleDoubleClick = useCallback(() => {
    if (editableRef.current) {
      const range = document.createRange();
      range.selectNodeContents(editableRef.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      editableRef.current?.blur();
    }
  }, []);

  return (
    <div className="auto-width-input text-xs">
      <span>{value || placeholder}</span>
      <div
        ref={editableRef}
        contentEditable
        onInput={handleInput}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        className={`input editable outline-none whitespace-pre ${className}`}
      />
    </div>
  );
}

// ContentEditable numeric input component for fields
export function NumericInput({
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
    if (e.key === 'Enter' || e.key === 'Escape') {
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

// Fields renderer for multi-field nodes (like Distort)
export function FieldsRenderer({
  fields,
  data,
  updateData,
}: {
  fields: FieldDefinition[];
  data: Record<string, unknown>;
  updateData: (updates: Record<string, unknown>) => void;
}) {
  return (
    <div className="flex flex-col gap-1 text-xs">
      {fields.map((field) => (
        <div key={field.key} className="flex items-center gap-2">
          <span className="w-12 opacity-60">{field.label}</span>
          {field.type === 'number' && (
            <NumericInput
              value={(data[field.key] as number) ?? field.defaultValue ?? 0}
              onChange={(v) => updateData({ [field.key]: v })}
              min={field.min}
              max={field.max}
            />
          )}
          {field.type === 'select' && (
            <select
              value={(data[field.key] as string) ?? field.defaultOption ?? ''}
              onChange={(e) => updateData({ [field.key]: e.target.value })}
              className="w-20 bg-black/30 rounded px-1 py-0.5"
            >
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}
    </div>
  );
}
