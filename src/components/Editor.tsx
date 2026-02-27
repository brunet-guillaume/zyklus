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

import {
  nodeTypes,
  type AppNode,
  getDefaultData,
  getShortcutMap,
  nodeDefinitions,
} from '../nodes';
import {
  compileGraph,
  initAudio,
  playCode,
  queryEvents,
  stopPlayback,
} from '../audio';
import { ContextMenu } from './ContextMenu';
import { NodePalette } from './NodePalette';
import { GradientEdge } from './GradientEdge';
import defaultCanvas from '../default-canvas.json';

const edgeTypes = {
  gradient: GradientEdge,
};

// Shortcut map: key -> node type
const SHORTCUT_MAP = getShortcutMap();

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

// Constants matching BaseNode.tsx handle positioning
const HANDLE_SPACING = 20;
const TITLE_OFFSET = 4;

// Calculate position for new node to align handles
function getAlignedPosition(
  selectedNode: AppNode,
  selectedOutputs: number,
  newInputs: number
): { x: number; y: number } {
  const selectedWidth = selectedNode.measured?.width ?? 100;
  const selectedHeight = selectedNode.measured?.height ?? 40;

  // X: 50px to the right of selected node
  const x = selectedNode.position.x + selectedWidth + 50;

  // Y: align first output handle with first input handle
  // Output handle position (always 50% for single output)
  const outputY =
    selectedOutputs === 1
      ? selectedHeight / 2
      : TITLE_OFFSET + HANDLE_SPACING / 2;

  // Input handle position (50% for single input without labels, else fixed)
  // Since we don't know if new node has labels, assume 50% for single input
  const inputY =
    newInputs === 1
      ? selectedHeight / 2 // Assume similar height, so use same offset
      : TITLE_OFFSET + HANDLE_SPACING / 2;

  const y = selectedNode.position.y + outputY - inputY;

  return { x, y };
}

// Focus the first contentEditable input in a node after creation
function focusNodeInput(nodeId: string, selectAll = false) {
  // Use setTimeout to ensure React has rendered the node
  setTimeout(() => {
    // React Flow uses data-id on the node wrapper
    const nodeEl = document.querySelector(
      `.react-flow__node[data-id="${nodeId}"]`
    );
    if (!nodeEl) return;

    // Find the first contentEditable element
    const el = nodeEl.querySelector(
      '[contenteditable="true"]'
    ) as HTMLElement | null;
    if (el) {
      el.focus();
      // Optionally select all content for easy replacement
      if (selectAll) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  }, 50);
}

function EditorContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
  }, [nodes, edges]);

  // Expose edges and nodes globally for trigger propagation
  useEffect(() => {
    window.__zyklusEdges = edges;
    window.__zyklusNodes = nodes;
  }, [edges, nodes]);

  // Track mouse position
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Shortcut buffer for multi-character shortcuts (Shift + keys)
  const [shortcutBuffer, setShortcutBuffer] = useState<string>('');
  const isShiftHeld = useRef(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input/textarea/contentEditable
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
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
        return;
      }

      // Track Shift key for multi-character shortcuts
      if (e.key === 'Shift') {
        isShiftHeld.current = true;
        setShortcutBuffer('');
        return;
      }

      // Build shortcut buffer while Shift is held
      if (
        isShiftHeld.current &&
        e.key.length === 1 &&
        !palette &&
        !contextMenu
      ) {
        e.preventDefault();
        setShortcutBuffer((prev) => prev + e.key.toLowerCase());
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Ignore if typing in an input/textarea/contentEditable
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      // On Shift release, check the buffer for a matching shortcut
      if (e.key === 'Shift' && isShiftHeld.current) {
        isShiftHeld.current = false;

        // Look up the shortcut
        const nodeType = SHORTCUT_MAP.get(shortcutBuffer);
        if (nodeType && !palette && !contextMenu) {
          const { x, y } = mousePos.current;
          const flowPos = screenToFlowPosition({ x, y });
          const id = getNodeId();

          // Find selected node and check if auto-connect is possible
          const selectedNode = nodes.find((n) => n.selected);
          const newNodeDef =
            nodeDefinitions[nodeType as keyof typeof nodeDefinitions];
          const selectedNodeDef = selectedNode
            ? nodeDefinitions[selectedNode.type as keyof typeof nodeDefinitions]
            : null;

          const canAutoConnect =
            selectedNode &&
            (selectedNodeDef?.outputs ?? 0) > 0 &&
            newNodeDef?.inputs > 0;

          // Position: right of selected node if auto-connecting, otherwise at cursor
          const position = canAutoConnect
            ? getAlignedPosition(
                selectedNode,
                selectedNodeDef?.outputs ?? 1,
                newNodeDef?.inputs ?? 1
              )
            : { x: flowPos.x, y: flowPos.y };

          const newNode = {
            id,
            type: nodeType,
            position,
            data: getDefaultData(nodeType),
            selected: true,
          } as AppNode;

          setNodes((nds) => [
            ...nds.map((n) => ({ ...n, selected: false })),
            newNode,
          ]);

          // Auto-connect: selected node's first output -> new node's first input
          if (canAutoConnect) {
            setEdges((eds) =>
              addEdge(
                {
                  source: selectedNode.id,
                  sourceHandle: 'out-0',
                  target: id,
                  targetHandle: 'in-0',
                },
                eds
              )
            );
          }

          focusNodeInput(id, true);
        }

        setShortcutBuffer('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    palette,
    contextMenu,
    screenToFlowPosition,
    setNodes,
    setEdges,
    nodes,
    shortcutBuffer,
  ]);

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
    const result = compileGraph(nodes, edges);

    // Always query events to show squares
    if (result.cleanCode) {
      await queryEvents(result.cleanCode);
    }

    // Hot reload: if playing, update the pattern
    if (isPlaying && result.code) {
      await playCode(result.code);
    }

    return result;
  }, [nodes, edges, isPlaying]);

  const handlePlay = useCallback(async () => {
    setIsLoading(true);
    try {
      await initAudio();
      const result = await handleCompile();
      if (result.code) {
        await playCode(result.code);
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

      const id = getNodeId();

      // Find selected node and check if auto-connect is possible
      const selectedNode = nodes.find((n) => n.selected);
      const newNodeDef = nodeDefinitions[type as keyof typeof nodeDefinitions];
      const selectedNodeDef = selectedNode
        ? nodeDefinitions[selectedNode.type as keyof typeof nodeDefinitions]
        : null;

      const canAutoConnect =
        selectedNode &&
        (selectedNodeDef?.outputs ?? 0) > 0 &&
        newNodeDef?.inputs > 0;

      // Position: right of selected node if auto-connecting, otherwise at cursor
      const position = canAutoConnect
        ? getAlignedPosition(
            selectedNode,
            selectedNodeDef?.outputs ?? 1,
            newNodeDef?.inputs ?? 1
          )
        : { x: contextMenu.flowX, y: contextMenu.flowY };

      const newNode = {
        id,
        type,
        position,
        data: getDefaultData(type),
        selected: true,
      } as AppNode;

      setNodes((nds) => [
        ...nds.map((n) => ({ ...n, selected: false })),
        newNode,
      ]);

      // Auto-connect: selected node's first output -> new node's first input
      if (canAutoConnect) {
        setEdges((eds) =>
          addEdge(
            {
              source: selectedNode.id,
              sourceHandle: 'out-0',
              target: id,
              targetHandle: 'in-0',
            },
            eds
          )
        );
      }

      focusNodeInput(id, true);
    },
    [contextMenu, setNodes, setEdges, nodes]
  );

  const handlePaletteSelect = useCallback(
    (type: string) => {
      if (!palette) return;

      const id = getNodeId();

      // Find selected node and check if auto-connect is possible
      const selectedNode = nodes.find((n) => n.selected);
      const newNodeDef = nodeDefinitions[type as keyof typeof nodeDefinitions];
      const selectedNodeDef = selectedNode
        ? nodeDefinitions[selectedNode.type as keyof typeof nodeDefinitions]
        : null;

      const canAutoConnect =
        selectedNode &&
        (selectedNodeDef?.outputs ?? 0) > 0 &&
        newNodeDef?.inputs > 0;

      // Position: right of selected node if auto-connecting, otherwise at cursor
      const position = canAutoConnect
        ? getAlignedPosition(
            selectedNode,
            selectedNodeDef?.outputs ?? 1,
            newNodeDef?.inputs ?? 1
          )
        : { x: palette.flowX, y: palette.flowY };

      const newNode = {
        id,
        type,
        position,
        data: getDefaultData(type),
        selected: true,
      } as AppNode;

      setNodes((nds) => [
        ...nds.map((n) => ({ ...n, selected: false })),
        newNode,
      ]);

      // Auto-connect: selected node's first output -> new node's first input
      if (canAutoConnect) {
        setEdges((eds) =>
          addEdge(
            {
              source: selectedNode.id,
              sourceHandle: 'out-0',
              target: id,
              targetHandle: 'in-0',
            },
            eds
          )
        );
      }

      setPalette(null);
      focusNodeInput(id, true);
    },
    [palette, setNodes, setEdges, nodes]
  );

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
      </div>

      {/* Flow Editor */}
      <div className="flex-1" ref={flowRef}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onContextMenu={handleContextMenu}
          isValidConnection={isValidConnection}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ type: 'gradient' }}
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

      {/* Shortcut indicator */}
      {shortcutBuffer && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-800 border border-purple-500 rounded-lg px-4 py-2 z-50 shadow-xl">
          <span className="text-gray-400 text-sm mr-2">Shortcut:</span>
          <span className="text-purple-400 font-mono text-lg">
            {shortcutBuffer}
          </span>
        </div>
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
