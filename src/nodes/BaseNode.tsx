import { Handle, Position } from '@xyflow/react';
import { useEffect, useState, useRef } from 'react';

interface EventLocation {
  start: number;
  end: number;
  note?: string | number | null;
}

interface SliderConfig {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  onMinChange?: (min: number) => void;
  onMaxChange?: (max: number) => void;
  onStepChange?: (step: number) => void;
}

interface BaseNodeProps {
  type: string;
  nodeId?: string; // For listening to triggers
  events?: EventLocation[]; // Event timing locations
  label?: string;
  modeOutput?: boolean;
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
  slider?: SliderConfig; // Optional slider control
  isSliderMode?: boolean; // Whether slider mode is active (persisted)
  onSliderModeChange?: (isSlider: boolean) => void; // Callback when slider mode changes
  expanded?: boolean; // Whether tools panel is expanded (persisted)
  onExpandedChange?: (expanded: boolean) => void; // Callback when expanded changes
  className?: string; // Additional CSS classes
}

export function BaseNode({
  type,
  nodeId,
  events = [],
  label,
  modeOutput = false,
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
  slider,
  isSliderMode = false,
  onSliderModeChange,
  expanded: expandedProp = false,
  onExpandedChange,
  className = '',
}: BaseNodeProps) {
  const handleSpacing = 20;
  const titleOffset = 4;
  const [isSlider, setIsSlider] = useState(isSliderMode);

  // Sync local state with prop when it changes
  useEffect(() => {
    setIsSlider(isSliderMode);
  }, [isSliderMode]);

  // Sync slider value to global variable for real-time Strudel access (only in slider mode)
  const sliderValue = slider?.value;
  useEffect(() => {
    if (sliderValue !== undefined && nodeId && isSlider) {
      if (!window.__zyklusSliders) {
        window.__zyklusSliders = {};
      }
      window.__zyklusSliders[nodeId] = sliderValue;
    }
  }, [nodeId, sliderValue, isSlider]);

  // Sync isSlider mode to global variable for compiler access
  useEffect(() => {
    if (nodeId) {
      if (!window.__zyklusSliderModes) {
        window.__zyklusSliderModes = {};
      }
      window.__zyklusSliderModes[nodeId] = isSlider;
    }
  }, [nodeId, isSlider]);

  // Track which event squares are triggered
  const [triggeredSquares, setTriggeredSquares] = useState<Set<number>>(
    new Set()
  );
  const timeoutsRef = useRef<Map<number, number>>(new Map());

  // Track expanded state for CollapseDiv
  const [expanded, setExpanded] = useState(expandedProp);

  // Sync local expanded state with prop when it changes
  useEffect(() => {
    setExpanded(expandedProp);
  }, [expandedProp]);

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
      className={`node relative ${type} ${selected ? 'selected' : ''} ${triggered ? 'triggered' : ''} ${className}`}
      style={
        {
          '--border-gradient': borderGradient,
          minHeight:
            maxHandles > 1
              ? titleOffset + maxHandles * handleSpacing
              : undefined,
        } as React.CSSProperties
      }
      onDoubleClick={
        slider
          ? () => {
              const newExpanded = !expanded;
              setExpanded(newExpanded);
              onExpandedChange?.(newExpanded);
            }
          : undefined
      }
    >
      {/* Event squares - first */}
      {events.length > 0 && (
        <div
          className={`absolute overflow-hidden top-0 left-0 right-0 h-5 rounded-lg`}
        >
          <div
            className={`flex w-full ${modeOutput ? 'h-2 mt-1.5 blur-[3px]' : 'h-0.5 blur-[1px]'}`}
          >
            {events.map((_, idx) => {
              const isActive = triggeredSquares.has(idx);
              const color = `var(--${type})`;
              return (
                <div className="relative w-full h-full" key={idx}>
                  <div
                    key={idx}
                    className="flex-1 h-full transition-all duration-150 scale-150"
                    style={{
                      background: color,
                      opacity: isActive && triggered ? 1 : 0,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {label && <div className="title">{label}</div>}

      {/* Optional slider or input based on isSlider state */}
      {slider && isSlider && (
        <div className="content w-full">
          <input
            type="range"
            min={slider.min}
            max={slider.max}
            step={slider.step ?? 1}
            value={slider.value}
            onChange={(e) => slider.onChange(parseFloat(e.target.value))}
            className="w-full nodrag"
            style={
              {
                '--slider-progress': `${((slider.value - slider.min) / (slider.max - slider.min)) * 100}%`,
              } as React.CSSProperties
            }
          />
          <div className="grid grid-cols-3 w-full text-xs -mt-1">
            <span className="opacity-70">{slider.min}</span>
            <span className="font-medium opacity-100 text-center">
              {slider.value}
            </span>
            <span className="text-right opacity-70">{slider.max}</span>
          </div>
        </div>
      )}
      {slider && !isSlider && (
        <div className="content">
          <input
            className="w-full"
            type="number"
            value={slider.value}
            onChange={(e) => slider.onChange(parseFloat(e.target.value) || 0)}
            onBlur={(e) => {
              const val = parseFloat(e.target.value) || 0;
              const clamped = Math.min(Math.max(val, slider.min), slider.max);
              slider.onChange(clamped);
            }}
            min={slider.min}
            max={slider.max}
          />
        </div>
      )}

      {/* Handles area with labels */}
      {(maxHandles > 1 || hasLabels) && (
        <div
          className="relative min-w-16"
          style={
            compactHandlesArea
              ? {}
              : { minHeight: maxHandles * handleSpacing + 8 }
          }
        >
          {inputLabels?.map((lbl, i) => (
            <span
              key={i}
              className="absolute p-2 px-3 left-0 text-xs opacity-70 -translate-y-1/2 whitespace-nowrap"
              style={{ top: 4 + handleSpacing / 2 + i * handleSpacing }}
            >
              {lbl}
            </span>
          ))}
        </div>
      )}

      {children && <div className="content">{children}</div>}

      {expanded && (
        <div className="tools">
          <div className="flex w-full text-center gap-1 bg-white/3 p-1 rounded-md">
            <div
              className={`flex-1 transition-colors ${isSlider ? 'bg-black/0 hover:bg-black/15' : 'bg-black/50 hover:bg-black/75'} rounded`}
              onClick={() => {
                setIsSlider(false);
                onSliderModeChange?.(false);
              }}
            >
              Value
            </div>
            <div
              className={`flex-1 transition-colors ${!isSlider ? 'bg-black/0 hover:bg-black/15' : 'bg-black/50 hover:bg-black/75'} bg-black/0 rounded`}
              onClick={() => {
                setIsSlider(true);
                onSliderModeChange?.(true);
              }}
            >
              Slider
            </div>
          </div>
          {slider && (
            <div className="flex gap-2 mt-1 text-xs text-center w-full bg-white/3 rounded-md p-1">
              <label className="flex flex-col gap-0.5 flex-1">
                <span className="opacity-50">Min</span>
                <input
                  type="number"
                  value={slider.min}
                  onChange={(e) =>
                    slider.onMinChange?.(parseFloat(e.target.value) || 0)
                  }
                  className="w-full bg-black/30 rounded px-1 py-0.5 text-center"
                />
              </label>
              <label className="flex flex-col gap-0.5 flex-1">
                <span className="opacity-50">Max</span>
                <input
                  type="number"
                  value={slider.max}
                  onChange={(e) =>
                    slider.onMaxChange?.(parseFloat(e.target.value) || 0)
                  }
                  className="w-full bg-black/30 rounded px-1 py-0.5 text-center"
                />
              </label>
              {isSlider && (
                <label className="flex flex-col gap-0.5 flex-1">
                  <span className="opacity-50">Step</span>
                  <input
                    type="number"
                    value={slider.step ?? 1}
                    onChange={(e) =>
                      slider.onStepChange?.(parseFloat(e.target.value) || 1)
                    }
                    className="w-full bg-black/30 rounded px-1 py-0.5 text-center"
                  />
                </label>
              )}
            </div>
          )}
        </div>
      )}

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
