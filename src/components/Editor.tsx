import { useCallback, useState, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type IsValidConnection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes, type AppNode } from '../nodes';
import { compileGraph, initAudio, playCode, stopPlayback } from '../audio';
import { ContextMenu } from './ContextMenu';
import { NodePalette } from './NodePalette';
import { GradientEdge } from './GradientEdge';
import defaultCanvas from '../default-canvas.json';

const edgeTypes = {
  gradient: GradientEdge,
};

const STORAGE_KEY = 'zyklus-canvas';

function loadFromStorage(): { nodes: AppNode[]; edges: Edge[] } | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
  return null;
}

const savedCanvas = loadFromStorage();
const initialNodes = (savedCanvas?.nodes ?? defaultCanvas.nodes) as AppNode[];
const initialEdges = (savedCanvas?.edges ?? defaultCanvas.edges) as Edge[];

// Calculate initial nodeId from existing nodes
let nodeId = Math.max(...initialNodes.map((n) => parseInt(n.id) || 0), 0) + 1;
const getNodeId = () => `${nodeId++}`;

function getDefaultData(type: string) {
  switch (type) {
    case 'sound':
      return {};
    case 'note':
      return {};
    case 'code':
      return { code: 'c3 e3 g3' };
    case 'value':
      return { value: 'c3' };
    case 'array':
      return { inputCount: 2 };
    case 'pick':
      return { values: 'c3, e3, g3, c4', indices: '<0 1 2 3>' };
    case 'fast':
      return { value: 2 };
    case 'slow':
      return { value: 2 };
    case 'rev':
      return {};
    case 'gain':
      return { value: 0.8 };
    case 'reverb':
      return { value: 0.5 };
    case 'delay':
      return { value: 0.5 };
    case 'lpf':
      return { value: 1000 };
    case 'output':
      return { isPlaying: false };
    case 'group':
      return { label: 'Group', expanded: false };
    default:
      return {};
  }
}

function EditorContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [compiledCode, setCompiledCode] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    flowX: number;
    flowY: number;
  } | null>(null);
  const [palette, setPalette] = useState<{
    x: number;
    y: number;
    flowX: number;
    flowY: number;
  } | null>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Handle deletion: unparent children when deleting a group
  const onBeforeDelete = useCallback(
    async ({
      nodes: nodesToDelete,
      edges: edgesToDelete,
    }: {
      nodes: AppNode[];
      edges: Edge[];
    }) => {
      const groupsToDelete = nodesToDelete.filter((n) => n.type === 'group');

      if (groupsToDelete.length > 0) {
        const groupIds = new Set(groupsToDelete.map((g) => g.id));
        const nonGroupNodesToDelete = new Set(
          nodesToDelete.filter((n) => n.type !== 'group').map((n) => n.id)
        );
        const edgeIdsToDelete = new Set(edgesToDelete.map((e) => e.id));

        // Do everything in one atomic operation
        setNodes((nds) => {
          const result: AppNode[] = [];
          for (const n of nds) {
            // Remove groups being deleted
            if (groupIds.has(n.id)) continue;
            // Remove other nodes being deleted
            if (nonGroupNodesToDelete.has(n.id)) continue;

            // Unparent children of groups being deleted
            if (n.parentId && groupIds.has(n.parentId)) {
              const parent = nds.find((p) => p.id === n.parentId);
              if (parent) {
                result.push({
                  ...n,
                  parentId: undefined,
                  position: {
                    x: n.position.x + parent.position.x,
                    y: n.position.y + parent.position.y,
                  },
                } as AppNode);
                continue;
              }
            }

            result.push(n);
          }
          return result;
        });

        // Also delete the edges
        setEdges((eds) => eds.filter((e) => !edgeIdsToDelete.has(e.id)));

        // Return false to prevent React Flow's default deletion
        return false;
      }

      return true; // Allow normal deletion for non-groups
    },
    [setNodes, setEdges]
  );

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
  }, [nodes, edges]);

  // Track mouse position
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Space: open palette
      if (e.code === 'Space' && !palette) {
        e.preventDefault();
        const { x, y } = mousePos.current;
        const flowPos = screenToFlowPosition({ x, y });
        setPalette({
          x,
          y,
          flowX: flowPos.x,
          flowY: flowPos.y,
        });
      }

      // U: ungroup selected nodes
      if (e.code === 'KeyU') {
        e.preventDefault();
        setNodes((nds) =>
          nds.map((n) => {
            if (n.selected && n.parentId) {
              const parent = nds.find((p) => p.id === n.parentId);
              if (parent) {
                return {
                  ...n,
                  parentId: undefined,
                  position: {
                    x: n.position.x + parent.position.x,
                    y: n.position.y + parent.position.y,
                  },
                } as AppNode;
              }
            }
            return n;
          })
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [palette, screenToFlowPosition, setNodes]);

  const handleReset = useCallback(() => {
    if (confirm('Reset to default canvas? All changes will be lost.')) {
      localStorage.removeItem(STORAGE_KEY);
      setNodes(defaultCanvas.nodes as AppNode[]);
      setEdges(defaultCanvas.edges as Edge[]);
      nodeId =
        Math.max(...defaultCanvas.nodes.map((n) => parseInt(n.id) || 0), 0) + 1;
    }
  }, [setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => {
        // Remove existing connections to the same target handle (single input per handle)
        const filtered = eds.filter(
          (e) =>
            e.target !== params.target || e.targetHandle !== params.targetHandle
        );
        return addEdge(params, filtered);
      });
    },
    [setEdges]
  );

  // Validate connections
  const isValidConnection: IsValidConnection = useCallback(
    (connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) return false;

      // Can't connect to self
      if (sourceNode.id === targetNode.id) return false;

      // Output can't be a source
      if (sourceNode.type === 'output') return false;

      return true;
    },
    [nodes]
  );

  const handleCompile = useCallback(async () => {
    const code = compileGraph(nodes, edges);
    setCompiledCode(code);

    // Hot reload: if playing, update the pattern
    if (isPlaying && code) {
      await playCode(code);
    }

    return code;
  }, [nodes, edges, isPlaying]);

  const handlePlay = useCallback(async () => {
    setIsLoading(true);
    try {
      await initAudio();
      const code = await handleCompile();
      if (code) {
        await playCode(code);
        setIsPlaying(true);
        setNodes((nds) =>
          nds.map((n) =>
            n.type === 'output'
              ? { ...n, data: { ...n.data, isPlaying: true } }
              : n
          )
        );
      }
    } catch (error) {
      console.error('Play error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [handleCompile, setNodes]);

  const handleStop = useCallback(async () => {
    await stopPlayback();
    setIsPlaying(false);
    setNodes((nds) =>
      nds.map((n) =>
        n.type === 'output'
          ? { ...n, data: { ...n.data, isPlaying: false } }
          : n
      )
    );
  }, [setNodes]);

  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        flowX: position.x,
        flowY: position.y,
      });
    },
    [screenToFlowPosition]
  );

  const handleAddNode = useCallback(
    (type: string) => {
      if (!contextMenu) return;

      const newNodeId = getNodeId();

      if (type === 'group') {
        // Get selected nodes (excluding groups)
        const selectedNodes = nodes.filter(
          (n) => n.selected && n.type !== 'group'
        );

        if (selectedNodes.length > 0) {
          // Calculate bounding box of selected nodes
          let minX = Infinity,
            minY = Infinity;
          for (const n of selectedNodes) {
            minX = Math.min(minX, n.position.x);
            minY = Math.min(minY, n.position.y);
          }

          const padding = 20;
          const headerHeight = 30;
          const groupX = minX - padding;
          const groupY = minY - padding - headerHeight;

          // Create group node first, then update children
          const groupNode = {
            id: newNodeId,
            type: 'group',
            position: { x: groupX, y: groupY },
            data: { ...getDefaultData('group'), expanded: true },
          } as AppNode;

          setNodes((nds) => {
            // Add group first
            const withGroup = [groupNode, ...nds];
            // Then update children to reference the group
            return withGroup.map((n) => {
              if (n.selected && n.type !== 'group') {
                return {
                  ...n,
                  parentId: newNodeId,
                  position: {
                    x: n.position.x - groupX,
                    y: n.position.y - groupY,
                  },
                  selected: false,
                } as AppNode;
              }
              return n;
            });
          });
          return;
        }
      }

      const newNode = {
        id: newNodeId,
        type,
        position: { x: contextMenu.flowX, y: contextMenu.flowY },
        data: getDefaultData(type),
      } as AppNode;

      setNodes((nds) => [...nds, newNode]);
    },
    [contextMenu, setNodes, nodes]
  );

  const handlePaletteSelect = useCallback(
    (type: string) => {
      if (!palette) return;

      const newNodeId = getNodeId();

      if (type === 'group') {
        // Get selected nodes (excluding groups)
        const selectedNodes = nodes.filter(
          (n) => n.selected && n.type !== 'group'
        );

        if (selectedNodes.length > 0) {
          // Calculate bounding box of selected nodes
          let minX = Infinity,
            minY = Infinity;
          for (const n of selectedNodes) {
            minX = Math.min(minX, n.position.x);
            minY = Math.min(minY, n.position.y);
          }

          const padding = 20;
          const headerHeight = 30;
          const groupX = minX - padding;
          const groupY = minY - padding - headerHeight;

          // Create group node first, then update children
          const groupNode = {
            id: newNodeId,
            type: 'group',
            position: { x: groupX, y: groupY },
            data: { ...getDefaultData('group'), expanded: true },
          } as AppNode;

          setNodes((nds) => {
            // Add group first
            const withGroup = [groupNode, ...nds];
            // Then update children to reference the group
            return withGroup.map((n) => {
              if (n.selected && n.type !== 'group') {
                return {
                  ...n,
                  parentId: newNodeId,
                  position: {
                    x: n.position.x - groupX,
                    y: n.position.y - groupY,
                  },
                  selected: false,
                } as AppNode;
              }
              return n;
            });
          });
          setPalette(null);
          return;
        }
      }

      const newNode = {
        id: newNodeId,
        type,
        position: { x: palette.flowX, y: palette.flowY },
        data: getDefaultData(type),
      } as AppNode;

      setNodes((nds) => [...nds, newNode]);
      setPalette(null);
    },
    [palette, setNodes, nodes]
  );

  // Find collapsed groups and their children
  const collapsedGroups = nodes.filter(
    (n) => n.type === 'group' && !(n.data as { expanded?: boolean }).expanded
  );
  const collapsedGroupIds = new Set(collapsedGroups.map((g) => g.id));

  // Map child node IDs to their parent group ID (for collapsed groups only)
  const childToGroupMap = new Map<string, string>();
  for (const node of nodes) {
    if (node.parentId && collapsedGroupIds.has(node.parentId)) {
      childToGroupMap.set(node.id, node.parentId);
    }
  }

  // Set hidden property on nodes that are children of collapsed groups
  const visibleNodes = nodes.map((node) => {
    if (!node.parentId) return node;
    const parent = nodes.find((n) => n.id === node.parentId);
    if (!parent || parent.type !== 'group') return node;
    const isHidden = !(parent.data as { expanded?: boolean }).expanded;
    return { ...node, hidden: isHidden };
  });

  // Build handle mappings for collapsed groups
  const groupInputHandles = new Map<string, Map<string, number>>(); // groupId -> (edgeId -> handleIndex)
  const groupOutputHandles = new Map<string, Map<string, number>>();

  for (const group of collapsedGroups) {
    const children = nodes.filter((n) => n.parentId === group.id);
    const childIds = new Set(children.map((n) => n.id));
    const childPositions = new Map(children.map((n) => [n.id, n.position.y]));

    // External inputs: edges going INTO children from outside (sorted by target Y position)
    const inputs = edges
      .filter((e) => childIds.has(e.target) && !childIds.has(e.source))
      .sort(
        (a, b) =>
          (childPositions.get(a.target) ?? 0) -
          (childPositions.get(b.target) ?? 0)
      );
    const inputMap = new Map<string, number>();
    inputs.forEach((e, i) => inputMap.set(e.id, i));
    groupInputHandles.set(group.id, inputMap);

    // External outputs: edges going OUT OF children to outside (sorted by source Y position)
    const outputs = edges
      .filter((e) => childIds.has(e.source) && !childIds.has(e.target))
      .sort(
        (a, b) =>
          (childPositions.get(a.source) ?? 0) -
          (childPositions.get(b.source) ?? 0)
      );
    const outputMap = new Map<string, number>();
    outputs.forEach((e, i) => outputMap.set(e.id, i));
    groupOutputHandles.set(group.id, outputMap);
  }

  // Compute visible edges: redirect edges to group handles when collapsed
  const visibleEdges = edges
    .map((edge) => {
      const sourceGroup = childToGroupMap.get(edge.source);
      const targetGroup = childToGroupMap.get(edge.target);

      // Both ends inside same collapsed group - hide edge
      if (sourceGroup && targetGroup && sourceGroup === targetGroup) {
        return null;
      }

      // Source is in collapsed group - redirect to group output
      if (sourceGroup) {
        const handleIndex =
          groupOutputHandles.get(sourceGroup)?.get(edge.id) ?? 0;
        const sourceHandle = `out-${handleIndex}`;
        return {
          ...edge,
          source: sourceGroup,
          sourceHandle,
          data: {
            ...edge.data,
            originalSourceChildId: edge.source, // Store original child ID
            redirectedSourceHandle: sourceHandle,
          },
        };
      }

      // Target is in collapsed group - redirect to group input
      if (targetGroup) {
        const handleIndex =
          groupInputHandles.get(targetGroup)?.get(edge.id) ?? 0;
        const targetHandle = `in-${handleIndex}`;
        return {
          ...edge,
          target: targetGroup,
          targetHandle,
          data: {
            ...edge.data,
            originalTargetChildId: edge.target, // Store original child ID
            redirectedTargetHandle: targetHandle,
          },
        };
      }

      return edge;
    })
    .filter((e): e is Edge => e !== null);

  const handleSave = useCallback(() => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zyklus-patch.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const handleLoad = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.nodes && data.edges) {
            setNodes(data.nodes);
            setEdges(data.edges);
            // Update nodeId counter to avoid collisions
            const maxId = Math.max(
              ...data.nodes.map((n: AppNode) => parseInt(n.id) || 0)
            );
            nodeId = maxId + 1;
          }
        } catch (err) {
          console.error('Failed to load file:', err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [setNodes, setEdges]);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-4 p-4 bg-gray-900 border-b border-gray-700">
        <h1 className="text-xl font-bold text-purple-400">Zyklus</h1>
        <div className="flex gap-2">
          <button
            onClick={isPlaying ? handleStop : handlePlay}
            disabled={isLoading}
            className={`px-4 py-2 rounded font-medium ${
              isLoading
                ? 'bg-gray-600 cursor-wait'
                : isPlaying
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isLoading ? 'Loading...' : isPlaying ? 'Stop' : 'Play'}
          </button>
          <button
            onClick={handleCompile}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
          >
            Compile
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
          >
            Save
          </button>
          <button
            onClick={handleLoad}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
          >
            Load
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
          >
            Reset
          </button>
        </div>
        {compiledCode && (
          <code className="ml-4 px-3 py-1 bg-gray-800 rounded text-sm text-green-400">
            {compiledCode}
          </code>
        )}
      </div>

      {/* Flow Editor */}
      <div className="flex-1" ref={flowRef}>
        <ReactFlow
          nodes={visibleNodes}
          edges={visibleEdges}
          onNodesChange={onNodesChange}
          onBeforeDelete={onBeforeDelete}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onContextMenu={handleContextMenu}
          isValidConnection={isValidConnection}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ type: 'gradient' }}
          snapToGrid
          snapGrid={[20, 20]}
          fitView
        >
          <Background color="#424A72" gap={20} />
          <Controls />
        </ReactFlow>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onAddNode={handleAddNode}
        />
      )}

      {palette && (
        <NodePalette
          x={palette.x}
          y={palette.y}
          onSelect={handlePaletteSelect}
          onClose={() => setPalette(null)}
        />
      )}
    </div>
  );
}

export function Editor() {
  return (
    <ReactFlowProvider>
      <EditorContent />
    </ReactFlowProvider>
  );
}
