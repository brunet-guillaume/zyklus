import { Handle, Position } from '@xyflow/react';

interface BaseNodeProps {
  type: string;
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
      className={`node ${type} ${isGroup ? 'group' : ''} ${selected ? 'selected' : ''} ${triggered ? 'triggered' : ''}`}
      style={
        {
          '--border-gradient': borderGradient,
        } as React.CSSProperties
      }
    >
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
