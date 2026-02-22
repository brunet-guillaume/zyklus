import {
  useEdges,
  useNodes,
  useReactFlow,
  type NodeProps,
} from '@xyflow/react';
import type { GroupNode as GroupNodeType } from './types';
import { BaseNode } from './BaseNode';
import { useMemo, useEffect, useState } from 'react';

export function GroupNode({ id, data, selected }: NodeProps<GroupNodeType>) {
  const { updateNodeData } = useReactFlow();
  const nodes = useNodes();
  const edges = useEdges();

  // Find child nodes of this group
  const childNodes = useMemo(() => {
    return nodes.filter((n) => n.parentId === id);
  }, [nodes, id]);

  const childNodeIds = useMemo(() => {
    return new Set(childNodes.map((n) => n.id));
  }, [childNodes]);

  // Track triggered children for badge animation
  const [triggeredChildren, setTriggeredChildren] = useState<Set<string>>(
    new Set()
  );
  // Track the type of the currently triggered child (for group color)
  const [triggeredType, setTriggeredType] = useState<string | null>(null);

  useEffect(() => {
    const childIds = data.childIds ?? [];
    const childTypes = data.childTypes ?? [];
    const outputChildIds = new Set(data.outputChildIds ?? []);

    if (childIds.length === 0 || data.expanded) return;

    const timeouts = new Map<string, number>();
    let typeTimeout: number | null = null;

    const handleTrigger = (event: Event) => {
      const customEvent = event as CustomEvent<{ nodeId: string }>;
      const triggeredNodeId = customEvent.detail?.nodeId;

      if (triggeredNodeId && childIds.includes(triggeredNodeId)) {
        // Clear existing timeout for this node
        const existingTimeout = timeouts.get(triggeredNodeId);
        if (existingTimeout) clearTimeout(existingTimeout);

        // Add to triggered set
        setTriggeredChildren((prev) => new Set(prev).add(triggeredNodeId));

        // Set the group color only if this child is connected to output
        const childIndex = childIds.indexOf(triggeredNodeId);
        const childType = childTypes[childIndex];

        if (outputChildIds.has(triggeredNodeId) && childType) {
          if (typeTimeout) clearTimeout(typeTimeout);
          setTriggeredType(childType);
          typeTimeout = window.setTimeout(() => {
            setTriggeredType(null);
          }, 150);
        }

        // Emit trigger for the group itself (for edge animation)
        // Pass the triggered child ID so edges can look up if they connect to it
        window.dispatchEvent(
          new CustomEvent('zyklus:trigger', {
            detail: {
              nodeId: id,
              triggeredType: outputChildIds.has(triggeredNodeId)
                ? childType
                : undefined,
              triggeredChildId: triggeredNodeId,
            },
          })
        );

        // Remove after animation duration
        const timeout = window.setTimeout(() => {
          setTriggeredChildren((prev) => {
            const next = new Set(prev);
            next.delete(triggeredNodeId);
            return next;
          });
          timeouts.delete(triggeredNodeId);
        }, 150);
        timeouts.set(triggeredNodeId, timeout);
      }
    };

    window.addEventListener('zyklus:trigger', handleTrigger);
    return () => {
      window.removeEventListener('zyklus:trigger', handleTrigger);
      timeouts.forEach((t) => clearTimeout(t));
      if (typeTimeout) clearTimeout(typeTimeout);
    };
  }, [
    data.childIds,
    data.childTypes,
    data.outputChildIds,
    data.edgeToChildMap,
    data.expanded,
    id,
  ]);

  // Calculate bounding box of children (for expanded view)
  // Children are positioned relative to group, handle negative positions
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
    // Handle negative positions by extending the container
    const offsetX = Math.min(0, minX - padding);
    const offsetY = Math.min(0, minY - padding);

    return {
      width: maxX - offsetX + padding,
      height: maxY - offsetY + padding,
      offsetX,
      offsetY,
    };
  }, [childNodes]);

  // Map child IDs to Y positions for sorting
  const childPositions = useMemo(() => {
    return new Map(childNodes.map((n) => [n.id, n.position.y]));
  }, [childNodes]);

  // Calculate external inputs/outputs (sorted by child Y position)
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

  // Store counts when expanded
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

  const inputErrorFn = (index: number) => {
    const count = data.expanded ? calculatedInputCount : (data.inputCount ?? 0);
    return index >= count;
  };
  const outputErrorFn = (index: number) => {
    const count = data.expanded
      ? calculatedOutputCount
      : (data.outputCount ?? 0);
    return index >= count;
  };

  const toggleExpanded = () => {
    if (data.expanded) {
      // Store bounds, child types and IDs when collapsing
      const childTypes = childNodes
        .map((n) => n.type)
        .filter((t): t is string => !!t);
      const childIds = childNodes.map((n) => n.id);
      // Get IDs of children connected to external outputs
      const outputChildIds = [...new Set(externalOutputs.map((e) => e.source))];
      // Map input handle index to child type and ID (for handle colors and trigger)
      const inputHandleTypes = externalInputs.map((e) => {
        const child = childNodes.find((n) => n.id === e.target);
        return child?.type ?? 'group';
      });
      const inputHandleChildIds = externalInputs.map((e) => e.target);
      // Map output handle index to child type and ID (for edge colors)
      const outputHandleTypes = externalOutputs.map((e) => {
        const child = childNodes.find((n) => n.id === e.source);
        return child?.type ?? 'group';
      });
      const outputHandleChildIds = externalOutputs.map((e) => e.source);
      // Map edge ID to child ID and type (for robust trigger matching)
      const edgeToChildMap: Record<string, string> = {};
      const edgeToTypeMap: Record<string, string> = {};
      for (const e of externalInputs) {
        edgeToChildMap[e.id] = e.target;
        const child = childNodes.find((n) => n.id === e.target);
        edgeToTypeMap[e.id] = child?.type ?? 'group';
      }
      for (const e of externalOutputs) {
        edgeToChildMap[e.id] = e.source;
        const child = childNodes.find((n) => n.id === e.source);
        edgeToTypeMap[e.id] = child?.type ?? 'group';
      }
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
        inputHandleChildIds,
        outputHandleTypes,
        outputHandleChildIds,
        edgeToChildMap,
        edgeToTypeMap,
      });
    } else {
      updateNodeData(id, { expanded: true });
    }
  };

  // Expanded view: large container
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

  // Calculate center offset for collapsed view
  const collapsedNodeWidth = 100; // Approximate width of collapsed node
  const collapsedNodeHeight = 40; // Approximate height of collapsed node
  const centerOffsetX = data.expandedWidth
    ? (data.expandedOffsetX ?? 0) +
      (data.expandedWidth - collapsedNodeWidth) / 2
    : 0;
  const centerOffsetY = data.expandedHeight
    ? (data.expandedOffsetY ?? 0) +
      (data.expandedHeight - collapsedNodeHeight) / 2
    : 0;

  // Collapsed view: normal node centered where the expanded container was
  return (
    <div
      style={{ transform: `translate(${centerOffsetX}px, ${centerOffsetY}px)` }}
    >
      <BaseNode
        type={triggeredType ?? 'group'}
        inputs={inputCount}
        outputs={outputCount}
        selected={selected}
        triggered={triggeredChildren.size > 0}
        inputErrorFn={inputErrorFn}
        outputErrorFn={outputErrorFn}
        inputHandleTypes={data.inputHandleTypes}
        outputHandleTypes={data.outputHandleTypes}
        compactHandlesArea
        isGroup
      >
        <div className="flex flex-col gap-1">
          {data.childTypes && data.childTypes.length > 0 && (
            <div
              className="flex gap-2 -mx-3 -mt-1 px-2 pt-1.5 pb-1"
              style={{ width: 'calc(100% + 24px)' }}
            >
              {data.childTypes.map((type, i) => {
                const childId = data.childIds?.[i];
                const isTriggered = childId
                  ? triggeredChildren.has(childId)
                  : false;
                return (
                  <span
                    key={i}
                    className="flex-1 rounded-lg transition-all duration-150"
                    style={{
                      backgroundColor: 'transparent',
                      border: `${isTriggered ? 2 : 1}px solid var(--${type})`,
                      opacity: isTriggered ? 1 : 0.4,
                      boxShadow: isTriggered
                        ? `0 0 8px var(--${type})`
                        : 'none',
                      height: '18px',
                    }}
                    title={type}
                  />
                );
              })}
            </div>
          )}
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
