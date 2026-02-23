import { Handle, Position } from '@xyflow/react';
import { useEffect, useState, useRef } from 'react';

interface EventLocation {
  start: number;
  end: number;
  note?: string | number | null;
}

interface BaseNodeProps {
  type: string;
  nodeId?: string; // For listening to triggers
  events?: EventLocation[]; // Event timing locations
  label?: string;
  inputs?: number;
  outputs?: number;
  selected?: boolean;
  triggered?: boolean;
  children?: React.ReactNode;
  inputErrorFn?: (index: number) => boolean;
  outputErrorFn?: (index: number) => boolean;
  inputLabels?: string[];
  inputHandleTypes?: string[];
  outputHandleTypes?: string[];
  borderGradientTypes?: string[]; // Types for radial gradient border
  compactHandlesArea?: boolean; // Use min-height instead of fixed height for handles area
  isGroup?: boolean; // Keep group styling even when type changes
}

export function BaseNode({
  type,
  nodeId,
  events = [],
  label,
  inputs = 0,
  outputs = 0,
  selected = false,
  triggered = false,
  children,
  inputErrorFn,
  outputErrorFn,
  inputLabels,
  inputHandleTypes,
  outputHandleTypes,
  borderGradientTypes,
  compactHandlesArea = false,
  isGroup = false,
}: BaseNodeProps) {
  const handleSpacing = 20;
  const titleOffset = label ? 20 : 4;

  // Track which event squares are triggered
  const [triggeredSquares, setTriggeredSquares] = useState<Set<number>>(
    new Set()
  );
  const timeoutsRef = useRef<Map<number, number>>(new Map());

  // Listen for triggers
  useEffect(() => {
    if (events.length === 0) return;

    const handleTrigger = (event: Event) => {
      const customEvent = event as CustomEvent<{
        nodeId: string;
        timing?: { start: number; end: number };
        note?: string | number | null;
      }>;

      // If nodeId is provided, only listen to that node's triggers
      // Otherwise listen to all triggers
      if (nodeId && customEvent.detail?.nodeId !== nodeId) return;

      const timing = customEvent.detail.timing;
      const triggerNote = customEvent.detail.note;
      const triggerPos = timing ? timing.start % 1 : 0;

      // Find which square(s) should trigger
      events.forEach((ev, idx) => {
        // Match by note if available, otherwise by timing
        const matchByNote =
          ev.note !== undefined &&
          ev.note !== null &&
          triggerNote !== undefined &&
          triggerNote !== null;
        const shouldTrigger = matchByNote
          ? String(ev.note) === String(triggerNote)
          : timing &&
            triggerPos >= ev.start - 0.001 &&
            triggerPos < ev.end + 0.001;

        if (shouldTrigger) {
          // Clear existing timeout for this square
          const existingTimeout = timeoutsRef.current.get(idx);
          if (existingTimeout) clearTimeout(existingTimeout);

          // Add to triggered set
          setTriggeredSquares((prev) => new Set(prev).add(idx));

          // Set timeout to remove
          const timeout = window.setTimeout(() => {
            setTriggeredSquares((prev) => {
              const next = new Set(prev);
              next.delete(idx);
              return next;
            });
            timeoutsRef.current.delete(idx);
          }, 150);
          timeoutsRef.current.set(idx, timeout);
        }
      });
    };

    window.addEventListener('zyklus:trigger', handleTrigger);
    const timeouts = timeoutsRef.current;
    return () => {
      window.removeEventListener('zyklus:trigger', handleTrigger);
      timeouts.forEach((t) => clearTimeout(t));
      timeouts.clear();
    };
  }, [nodeId, events]);

  const maxHandles = Math.max(inputs, outputs);
  const hasLabels = inputLabels && inputLabels.length > 0;

  // Generate radial gradient from border types
  const borderGradient =
    borderGradientTypes && borderGradientTypes.length > 0
      ? `conic-gradient(from 0deg, ${borderGradientTypes
          .map(
            (t, i) => `var(--${t}) ${(i / borderGradientTypes.length) * 100}%`
          )
          .join(', ')}, var(--${borderGradientTypes[0]}) 100%)`
      : undefined;

  return (
    <div
      className={`node relative ${type} ${isGroup ? 'group' : ''} ${selected ? 'selected' : ''} ${triggered ? 'triggered' : ''}`}
      style={
        {
          '--border-gradient': borderGradient,
        } as React.CSSProperties
      }
    >
      {/* Event squares - first */}
      {events.length > 0 && (
        <div className="absolute overflow-hidden top-0 left-0 right-0 h-4 rounded-lg">
          <div
            className="flex -mx-3 -mt-1"
            style={{ width: 'calc(100% + 24px)' }}
          >
            {events.map((_, idx) => {
              const isActive = triggeredSquares.has(idx);
              const color = `var(--${type})`;
              return (
                <div className="relative w-full">
                  <div
                    key={idx}
                    className="flex-1 h-2 transition-all duration-150 first:rounded-tl-sm last:rounded-tr-sm"
                    style={{
                      background: color,
                      opacity: isActive && triggered ? 1 : 0.2,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {label && <div className="title">{label}</div>}

      {/* Handles area with labels */}
      {(maxHandles > 1 || hasLabels) && (
        <div
          className="relative min-w-16"
          style={
            compactHandlesArea ? {} : { minHeight: maxHandles * handleSpacing }
          }
        >
          {inputLabels?.map((lbl, i) => (
            <span
              key={i}
              className="absolute left-0 text-xs opacity-70 -translate-y-1/2 whitespace-nowrap"
              style={{ top: handleSpacing / 2 + i * handleSpacing }}
            >
              {lbl}
            </span>
          ))}
        </div>
      )}

      {children && <div className="content">{children}</div>}

      {/* Input handles */}
      {Array.from({ length: inputs }).map((_, i) => {
        const hasError = inputErrorFn?.(i) ?? false;
        const handleType = inputHandleTypes?.[i];
        const top =
          inputs === 1 && !hasLabels
            ? '50%'
            : titleOffset + handleSpacing / 2 + i * handleSpacing;
        return (
          <Handle
            key={`in-${i}`}
            type="target"
            position={Position.Left}
            id={`in-${i}`}
            className={hasError ? 'error' : ''}
            style={
              {
                top,
                '--node-color': handleType ? `var(--${handleType})` : undefined,
              } as React.CSSProperties
            }
          />
        );
      })}

      {/* Output handles */}
      {Array.from({ length: outputs }).map((_, i) => {
        const hasError = outputErrorFn?.(i) ?? false;
        const handleType = outputHandleTypes?.[i];
        const top =
          outputs === 1
            ? '50%'
            : titleOffset + handleSpacing / 2 + i * handleSpacing;
        return (
          <Handle
            key={`out-${i}`}
            type="source"
            position={Position.Right}
            id={`out-${i}`}
            className={hasError ? 'error' : ''}
            style={
              {
                top,
                '--node-color': handleType ? `var(--${handleType})` : undefined,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
