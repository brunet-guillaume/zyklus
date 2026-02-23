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
    case 'supersaw':
      return {};
    case 'slider':
      return { min: 20, max: 2000, value: 1000, step: 10 };
    case 'gain':
      return { value: 0.8 };
    case 'reverb':
      return { value: 0.5 };
    case 'delay':
      return { value: 0.5 };
    case 'lpf':
      return { value: 1000 };
    case 'lpenv':
      return { value: 4 };
    case 'output':
      return { isPlaying: false };
    default:
      return {};
  }
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

      const newNode = {
        id: getNodeId(),
        type,
        position: { x: contextMenu.flowX, y: contextMenu.flowY },
        data: getDefaultData(type),
      } as AppNode;

      setNodes((nds) => [...nds, newNode]);
    },
    [contextMenu, setNodes]
  );

  const handlePaletteSelect = useCallback(
    (type: string) => {
      if (!palette) return;

      const newNode = {
        id: getNodeId(),
        type,
        position: { x: palette.flowX, y: palette.flowY },
        data: getDefaultData(type),
      } as AppNode;

      setNodes((nds) => [...nds, newNode]);
      setPalette(null);
    },
    [palette, setNodes]
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
