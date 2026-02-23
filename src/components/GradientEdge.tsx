import {
  BaseEdge,
  getSmoothStepPath,
  useNodes,
  type EdgeProps,
} from '@xyflow/react';
import { useEffect, useState, useRef } from 'react';

export function GradientEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  selected,
}: EdgeProps) {
  const nodes = useNodes();
  const sourceNode = nodes.find((n) => n.id === source);
  const targetNode = nodes.find((n) => n.id === target);

  // Track trigger state with direct event listener to avoid React batching issues
  const [isTriggered, setIsTriggered] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleTrigger = (event: Event) => {
      const customEvent = event as CustomEvent<{ nodeId: string }>;
      const { nodeId } = customEvent.detail ?? {};

      // Trigger when SOURCE triggers (data flows from source)
      if (nodeId === source) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        setIsTriggered(true);

        timeoutRef.current = window.setTimeout(() => {
          setIsTriggered(false);
        }, 150);
      }
    };

    window.addEventListener('zyklus:trigger', handleTrigger);
    return () => {
      window.removeEventListener('zyklus:trigger', handleTrigger);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [source]);

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const gradientId = `gradient-${id}`;
  const sourceType = sourceNode?.type;
  const targetType = targetNode?.type;
  const sourceColor = sourceType ? `var(--${sourceType})` : '#818CF8';
  const targetColor = targetType ? `var(--${targetType})` : '#F472B6';

  const strokeWidth = selected ? 3 : isTriggered ? 3.5 : 1;

  return (
    <>
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={sourceX}
          y1={sourceY}
          x2={targetX}
          y2={targetY}
        >
          <stop offset="0%" stopColor={sourceColor} />
          <stop offset="100%" stopColor={targetColor} />
        </linearGradient>
      </defs>
      <path
        d={edgePath}
        fill="none"
        stroke="var(--background)"
        strokeLinecap="round"
        opacity={0.8}
        style={{
          strokeWidth: strokeWidth + 4,
          transition: 'stroke-width 0.3s ease-out',
        }}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: `url(#${gradientId})`,
          strokeWidth,
          transition: 'stroke-width 0.3s ease-out',
        }}
        markerEnd={markerEnd}
      />
    </>
  );
}
