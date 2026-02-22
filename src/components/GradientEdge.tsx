import {
  BaseEdge,
  getBezierPath,
  useNodes,
  type EdgeProps,
} from '@xyflow/react';
import { useEffect, useState, useRef } from 'react';

interface EdgeData {
  originalSourceChildId?: string;
  originalTargetChildId?: string;
  redirectedSourceHandle?: string;
  redirectedTargetHandle?: string;
}

export function GradientEdge({
  id,
  source,
  target,
  data,
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
  const edgeData = data as EdgeData | undefined;
  const originalSourceChildId = edgeData?.originalSourceChildId;
  const originalTargetChildId = edgeData?.originalTargetChildId;
  const sourceNode = nodes.find((n) => n.id === source);
  const targetNode = nodes.find((n) => n.id === target);

  // Track trigger state with direct event listener to avoid React batching issues
  const [isTriggered, setIsTriggered] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleTrigger = (event: Event) => {
      const customEvent = event as CustomEvent<{
        nodeId: string;
        triggeredChildId?: string;
      }>;
      const { nodeId, triggeredChildId } = customEvent.detail ?? {};

      let shouldTrigger = false;

      // For edges from a collapsed group: ONLY check source side with child match
      if (originalSourceChildId) {
        if (nodeId === source && triggeredChildId === originalSourceChildId) {
          shouldTrigger = true;
        }
      }
      // For edges to a collapsed group: ONLY check target side with child match
      else if (originalTargetChildId) {
        if (nodeId === target && triggeredChildId === originalTargetChildId) {
          shouldTrigger = true;
        }
      }
      // Regular edge: trigger only when SOURCE triggers (data flows from source)
      else {
        if (nodeId === source) {
          shouldTrigger = true;
        }
      }

      if (shouldTrigger) {
        // Clear previous timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        setIsTriggered(true);

        // Reset after animation duration
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
  }, [source, target, originalSourceChildId, originalTargetChildId]);

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Get child node to determine its type (for edge colors)
  const originalSourceChild = originalSourceChildId
    ? nodes.find((n) => n.id === originalSourceChildId)
    : undefined;
  const originalTargetChild = originalTargetChildId
    ? nodes.find((n) => n.id === originalTargetChildId)
    : undefined;

  const gradientId = `gradient-${id}`;
  const sourceType = originalSourceChild?.type ?? sourceNode?.type;
  const targetType = originalTargetChild?.type ?? targetNode?.type;
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
