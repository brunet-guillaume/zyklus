import {
  BaseEdge,
  getBezierPath,
  useNodes,
  type EdgeProps,
} from '@xyflow/react';
import { useTrigger } from '../hooks/useTrigger';

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
  const { isTriggered: sourceTriggered } = useTrigger(source);
  const { isTriggered: targetTriggered } = useTrigger(target);

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const gradientId = `gradient-${id}`;
  const sourceColor = sourceNode?.type
    ? `var(--${sourceNode.type})`
    : '#818CF8';
  const targetColor = targetNode?.type
    ? `var(--${targetNode.type})`
    : '#F472B6';

  const isTriggered = sourceTriggered && targetTriggered;
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
