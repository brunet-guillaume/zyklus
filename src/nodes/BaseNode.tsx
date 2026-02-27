import { Handle, Position } from '@xyflow/react';
import { useEffect, useState, useRef, useCallback, Children } from 'react';

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
  isInputMode?: boolean; // Whether input mode is active (value from connected node)
  onInputModeChange?: (isInput: boolean) => void; // Callback when input mode changes
  expanded?: boolean; // Whether tools panel is expanded (persisted)
  onExpandedChange?: (expanded: boolean) => void; // Callback when expanded changes
  sliderOnly?: boolean; // Hide mode switcher, show only slider options
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
  isInputMode = false,
  onInputModeChange,
  expanded: expandedProp = false,
  onExpandedChange,
  sliderOnly = false,
  className = '',
}: BaseNodeProps) {
  const handleSpacing = 20;
  const titleOffset = 4;
  const [isSlider, setIsSlider] = useState(isSliderMode);
  const [isInput, setIsInput] = useState(isInputMode);

  // Sync local state with prop when it changes
  useEffect(() => {
    setIsSlider(isSliderMode);
  }, [isSliderMode]);

  useEffect(() => {
    setIsInput(isInputMode);
  }, [isInputMode]);

  // Sync slider value to global variable for real-time Strudel access (only in slider mode)
  const sliderValue = slider?.value;
  useEffect(() => {
    if (
      nodeId &&
      isSlider &&
      sliderValue !== undefined &&
      Number.isFinite(sliderValue)
    ) {
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

  // Sync isInput mode to global variable for compiler access
  useEffect(() => {
    if (nodeId) {
      if (!window.__zyklusInputModes) {
        window.__zyklusInputModes = {};
      }
      window.__zyklusInputModes[nodeId] = isInput;
    }
  }, [nodeId, isInput]);

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

  // Add extra input handle when in input mode
  const actualInputs = slider && isInput ? inputs + 1 : inputs;
  const maxHandles = Math.max(actualInputs, outputs);

  // Generate labels for input mode (in, value)
  const actualInputLabels = slider && isInput ? ['in', 'value'] : inputLabels;
  const hasLabels = actualInputLabels && actualInputLabels.length > 0;

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
          ? (e) => {
              // Don't toggle panel if double-clicking on a contentEditable
              if (
                e.target instanceof HTMLElement &&
                e.target.isContentEditable
              ) {
                return;
              }
              const newExpanded = !expanded;
              setExpanded(newExpanded);
              onExpandedChange?.(newExpanded);
            }
          : undefined
      }
    >
      {/* Event squares - first */}
      {/* TODO: clear that*/}
      {events.length == 0 && (
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

      {/* Optional slider or input based on mode */}
      {slider && isSlider && !isInput && (
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
      {slider && !isSlider && !isInput && (
        <div className="content">
          <NumericInput
            value={slider.value}
            onChange={slider.onChange}
            min={slider.min}
            max={slider.max}
            className="w-full text-center"
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
          {actualInputLabels?.map((lbl, i) => (
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

      {Children.toArray(children).filter(Boolean).length > 0 && (
        <div className="content">{children}</div>
      )}

      {expanded && (
        <div className="tools">
          {!sliderOnly && (
            <div className="flex w-full text-center gap-1 bg-white/3 p-1 rounded-md">
              <div
                className={`flex-1 transition-colors ${!isSlider && !isInput ? 'bg-black/50 hover:bg-black/75' : 'bg-black/0 hover:bg-black/15'} rounded`}
                onClick={() => {
                  setIsSlider(false);
                  setIsInput(false);
                  onSliderModeChange?.(false);
                  onInputModeChange?.(false);
                }}
              >
                Value
              </div>
              <div
                className={`flex-1 transition-colors ${isSlider && !isInput ? 'bg-black/50 hover:bg-black/75' : 'bg-black/0 hover:bg-black/15'} rounded`}
                onClick={() => {
                  setIsSlider(true);
                  setIsInput(false);
                  onSliderModeChange?.(true);
                  onInputModeChange?.(false);
                }}
              >
                Slider
              </div>
              <div
                className={`flex-1 transition-colors ${isInput ? 'bg-black/50 hover:bg-black/75' : 'bg-black/0 hover:bg-black/15'} rounded`}
                onClick={() => {
                  setIsSlider(false);
                  setIsInput(true);
                  onSliderModeChange?.(false);
                  onInputModeChange?.(true);
                }}
              >
                Input
              </div>
            </div>
          )}
          {slider && (
            <div className="flex gap-2 mt-1 text-xs text-center w-full bg-white/3 rounded-md p-1">
              <div className="flex flex-col gap-0.5 flex-1">
                <span className="opacity-50">Min</span>
                <NumericInput
                  value={slider.min}
                  onChange={(v) => slider.onMinChange?.(v)}
                  className="w-full bg-black/30! px-1! py-0.5! text-center"
                />
              </div>
              <div className="flex flex-col gap-0.5 flex-1">
                <span className="opacity-50">Max</span>
                <NumericInput
                  value={slider.max}
                  onChange={(v) => slider.onMaxChange?.(v)}
                  className="w-full bg-black/30! px-1! py-0.5! text-center"
                />
              </div>
              {(isSlider || sliderOnly) && (
                <div className="flex flex-col gap-0.5 flex-1">
                  <span className="opacity-50">Step</span>
                  <NumericInput
                    value={slider.step ?? 1}
                    onChange={(v) => slider.onStepChange?.(v)}
                    min={0.001}
                    className="w-full bg-black/30! px-1! py-0.5! text-center"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Input handles */}
      {Array.from({ length: actualInputs }).map((_, i) => {
        const hasError = inputErrorFn?.(i) ?? false;
        const handleType = inputHandleTypes?.[i];
        const top =
          actualInputs === 1 && !hasLabels
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
