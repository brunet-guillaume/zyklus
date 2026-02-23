import {
  useEdges,
  useNodes,
  useReactFlow,
  type NodeProps,
} from '@xyflow/react';
import type { GroupNode as GroupNodeType } from './types';
import { BaseNode } from './BaseNode';
import { useMemo, useEffect, useState, useRef } from 'react';

interface SquareState {
  id: string;
  nodeId: string;
  nodeType: string;
  isTriggered: boolean;
  start: number;
  end: number;
}

export function GroupNode({ id, data, selected }: NodeProps<GroupNodeType>) {
  const { updateNodeData } = useReactFlow();
  const nodes = useNodes();
  const edges = useEdges();

  const childNodes = useMemo(() => {
    return nodes.filter((n) => n.parentId === id);
  }, [nodes, id]);

  const childNodeIds = useMemo(() => {
    return new Set(childNodes.map((n) => n.id));
  }, [childNodes]);

  const [triggeredType, setTriggeredType] = useState<string | null>(null);
  const [squares, setSquares] = useState<SquareState[]>([]);
  const timeoutsRef = useRef<Map<string, number>>(new Map());

  // Get internal nodes sorted (nodes without inputs first)
  const internalNodes = useMemo(() => {
    if (data.expanded) return [];
    const childIds = data.childIds ?? [];
    const childTypes = data.childTypes ?? [];
    if (childIds.length === 0) return [];

    const result: Array<{ id: string; type: string; hasInputs: boolean }> = [];

    for (let i = 0; i < childIds.length; i++) {
      const nodeId = childIds[i];
      const nodeType = childTypes[i] || 'unknown';
      const hasInputs = edges.some(
        (e) => e.target === nodeId && childIds.includes(e.source)
      );
      result.push({ id: nodeId, type: nodeType, hasInputs });
    }

    result.sort((a, b) => {
      if (a.hasInputs === b.hasInputs) return 0;
      return a.hasInputs ? 1 : -1;
    });

    return result;
  }, [data.expanded, data.childIds, data.childTypes, edges]);

  // Listen for events to create squares
  useEffect(() => {
    if (data.expanded || internalNodes.length === 0) return;

    const handleEvents = (event: Event) => {
      const customEvent = event as CustomEvent<{
        locations: Array<{ start: number; end: number }>;
      }>;

      const locations = customEvent.detail?.locations ?? [];

      const newSquares: SquareState[] = [];
      for (const node of internalNodes) {
        for (let i = 0; i < locations.length; i++) {
          newSquares.push({
            id: `${node.id}-${i}`,
            nodeId: node.id,
            nodeType: node.type,
            isTriggered: false,
            start: locations[i].start,
            end: locations[i].end,
          });
        }
      }
      setSquares(newSquares);
    };

    window.addEventListener('zyklus:events', handleEvents);
    return () => window.removeEventListener('zyklus:events', handleEvents);
  }, [data.expanded, internalNodes]);

  // Handle triggers
  useEffect(() => {
    if (data.expanded) return;
    const childIds = data.childIds ?? [];
    if (childIds.length === 0) return;

    let typeTimeout: number | null = null;

    const handleTrigger = (event: Event) => {
      const customEvent = event as CustomEvent<{
        nodeId: string;
        nodeType: string;
        timing?: { start: number; end: number };
      }>;

      const detail = customEvent.detail;
      if (!detail?.nodeId) return;
      if (!childIds.includes(detail.nodeId)) return;

      // Update border color
      if (typeTimeout) clearTimeout(typeTimeout);
      setTriggeredType(detail.nodeType);
      typeTimeout = window.setTimeout(() => {
        setTriggeredType(null);
      }, 150);

      const triggerPos = detail.timing ? detail.timing.start % 1 : 0;

      setSquares((prev) => {
        return prev.map((sq) => {
          if (sq.nodeId !== detail.nodeId) return sq;

          const shouldTrigger =
            triggerPos >= sq.start - 0.001 && triggerPos < sq.end + 0.001;

          if (shouldTrigger) {
            const existingTimeout = timeoutsRef.current.get(sq.id);
            if (existingTimeout) clearTimeout(existingTimeout);

            const timeout = window.setTimeout(() => {
              setSquares((s) =>
                s.map((x) =>
                  x.id === sq.id ? { ...x, isTriggered: false } : x
                )
              );
              timeoutsRef.current.delete(sq.id);
            }, 150);
            timeoutsRef.current.set(sq.id, timeout);

            return { ...sq, isTriggered: true };
          }

          return sq;
        });
      });

      // Emit trigger for group (for Output and parent groups)
      window.dispatchEvent(
        new CustomEvent('zyklus:trigger', {
          detail: {
            nodeId: id,
            nodeType: 'group',
            timing: detail.timing,
          },
        })
      );
    };

    window.addEventListener('zyklus:trigger', handleTrigger);
    const timeouts = timeoutsRef.current;
    return () => {
      window.removeEventListener('zyklus:trigger', handleTrigger);
      timeouts.forEach((t) => clearTimeout(t));
      timeouts.clear();
      if (typeTimeout) clearTimeout(typeTimeout);
    };
  }, [data.expanded, data.childIds, id]);

  // Group squares by node
  const squaresByNode = useMemo(() => {
    const groups: Array<{
      nodeId: string;
      nodeType: string;
      squares: SquareState[];
    }> = [];
    const nodeMap = new Map<string, SquareState[]>();

    for (const sq of squares) {
      if (!nodeMap.has(sq.nodeId)) {
        nodeMap.set(sq.nodeId, []);
      }
      nodeMap.get(sq.nodeId)!.push(sq);
    }

    for (const node of internalNodes) {
      const nodeSquares = nodeMap.get(node.id);
      if (nodeSquares && nodeSquares.length > 0) {
        groups.push({
          nodeId: node.id,
          nodeType: node.type,
          squares: nodeSquares,
        });
      }
    }

    return groups;
  }, [squares, internalNodes]);

  // Calculate bounding box of children
  const childrenBounds = useMemo(() => {
    if (childNodes.length === 0) {
      return { width: 150, height: 100, offsetX: 0, offsetY: 0 };
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const child of childNodes) {
      const width = child.measured?.width ?? 120;
      const height = child.measured?.height ?? 50;
      minX = Math.min(minX, child.position.x);
      minY = Math.min(minY, child.position.y);
      maxX = Math.max(maxX, child.position.x + width);
      maxY = Math.max(maxY, child.position.y + height);
    }

    const padding = 20;
    const offsetX = Math.min(0, minX - padding);
    const offsetY = Math.min(0, minY - padding);

    return {
      width: maxX - offsetX + padding,
      height: maxY - offsetY + padding,
      offsetX,
      offsetY,
    };
  }, [childNodes]);

  const childPositions = useMemo(() => {
    return new Map(childNodes.map((n) => [n.id, n.position.y]));
  }, [childNodes]);

  const externalInputs = useMemo(() => {
    return edges
      .filter((e) => childNodeIds.has(e.target) && !childNodeIds.has(e.source))
      .sort(
        (a, b) =>
          (childPositions.get(a.target) ?? 0) -
          (childPositions.get(b.target) ?? 0)
      );
  }, [edges, childNodeIds, childPositions]);

  const externalOutputs = useMemo(() => {
    return edges
      .filter((e) => childNodeIds.has(e.source) && !childNodeIds.has(e.target))
      .sort(
        (a, b) =>
          (childPositions.get(a.source) ?? 0) -
          (childPositions.get(b.source) ?? 0)
      );
  }, [edges, childNodeIds, childPositions]);

  const calculatedInputCount = externalInputs.length;
  const calculatedOutputCount = externalOutputs.length;

  useEffect(() => {
    if (
      data.expanded &&
      (data.inputCount !== calculatedInputCount ||
        data.outputCount !== calculatedOutputCount)
    ) {
      updateNodeData(id, {
        inputCount: calculatedInputCount,
        outputCount: calculatedOutputCount,
      });
    }
  }, [
    data.expanded,
    data.inputCount,
    data.outputCount,
    calculatedInputCount,
    calculatedOutputCount,
    updateNodeData,
    id,
  ]);

  const inputCount = data.expanded
    ? calculatedInputCount
    : (data.inputCount ?? calculatedInputCount);
  const outputCount = data.expanded
    ? calculatedOutputCount
    : (data.outputCount ?? calculatedOutputCount);

  const inputErrorFn = (index: number) =>
    index >= (data.expanded ? calculatedInputCount : (data.inputCount ?? 0));
  const outputErrorFn = (index: number) =>
    index >= (data.expanded ? calculatedOutputCount : (data.outputCount ?? 0));

  const toggleExpanded = () => {
    if (data.expanded) {
      const childTypes = childNodes
        .map((n) => n.type)
        .filter((t): t is string => !!t);
      const childIds = childNodes.map((n) => n.id);
      const outputChildIds = [...new Set(externalOutputs.map((e) => e.source))];
      const inputHandleTypes = externalInputs.map(
        (e) => childNodes.find((n) => n.id === e.target)?.type ?? 'group'
      );
      const outputHandleTypes = externalOutputs.map(
        (e) => childNodes.find((n) => n.id === e.source)?.type ?? 'group'
      );

      updateNodeData(id, {
        expanded: false,
        inputCount: calculatedInputCount,
        outputCount: calculatedOutputCount,
        expandedWidth: childrenBounds.width,
        expandedHeight: childrenBounds.height,
        expandedOffsetX: childrenBounds.offsetX,
        expandedOffsetY: childrenBounds.offsetY,
        childTypes,
        childIds,
        outputChildIds,
        inputHandleTypes,
        outputHandleTypes,
      });
    } else {
      updateNodeData(id, { expanded: true });
    }
  };

  if (data.expanded) {
    return (
      <div
        className="group-container"
        style={{
          width: childrenBounds.width,
          height: childrenBounds.height,
          transform: `translate(${childrenBounds.offsetX}px, ${childrenBounds.offsetY}px)`,
        }}
      >
        <div className="group-header">
          <button
            onClick={toggleExpanded}
            className="w-4 h-4 flex items-center justify-center rounded hover:bg-white/20"
          >
            −
          </button>
          <input
            type="text"
            value={data.label}
            onChange={(e) => updateNodeData(id, { label: e.target.value })}
            placeholder="Group"
            className="bg-transparent border-none outline-none text-xs flex-1"
          />
        </div>
      </div>
    );
  }

  const collapsedNodeWidth = 100;
  const collapsedNodeHeight = 40;
  const centerOffsetX = data.expandedWidth
    ? (data.expandedOffsetX ?? 0) +
      (data.expandedWidth - collapsedNodeWidth) / 2
    : 0;
  const centerOffsetY = data.expandedHeight
    ? (data.expandedOffsetY ?? 0) +
      (data.expandedHeight - collapsedNodeHeight) / 2
    : 0;

  return (
    <div
      style={{ transform: `translate(${centerOffsetX}px, ${centerOffsetY}px)` }}
    >
      <BaseNode
        type={triggeredType ?? 'group'}
        nodeId={id}
        inputs={inputCount}
        outputs={outputCount}
        selected={selected}
        triggered={triggeredType !== null}
        inputErrorFn={inputErrorFn}
        outputErrorFn={outputErrorFn}
        inputHandleTypes={data.inputHandleTypes}
        outputHandleTypes={data.outputHandleTypes}
        compactHandlesArea
        isGroup
      >
        <div className="flex flex-col">
          {squaresByNode.map((group) => (
            <div
              key={group.nodeId}
              className="flex flex-wrap -mx-3 first:-mt-1 px-2"
              style={{ width: 'calc(100% + 24px)' }}
            >
              {group.squares.map((sq) => {
                const color = `var(--${sq.nodeType})`;
                return (
                  <span
                    key={sq.id}
                    className="rounded-sm transition-all duration-150"
                    style={{
                      backgroundColor: 'transparent',
                      border: `${sq.isTriggered ? 2 : 1}px solid ${color}`,
                      opacity: sq.isTriggered ? 1 : 0.4,
                      boxShadow: sq.isTriggered ? `0 0 8px ${color}` : 'none',
                      width: '4px',
                      height: '4px',
                    }}
                  />
                );
              })}
            </div>
          ))}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={toggleExpanded}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-white/10"
            >
              +
            </button>
            <input
              type="text"
              value={data.label}
              onChange={(e) => updateNodeData(id, { label: e.target.value })}
              placeholder="Group"
              className="bg-transparent border-none outline-none w-20"
            />
          </div>
        </div>
      </BaseNode>
    </div>
  );
}
