import { useCallback, useState, useRef } from 'react';
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
import { compileGraph, playPattern, updatePattern, stopPattern, initAudio } from '../audio';
import { ContextMenu } from './ContextMenu';

const initialNodes: AppNode[] = [
  {
    id: '1',
    type: 'pattern',
    position: { x: 100, y: 100 },
    data: { pattern: 'bd sd' },
  },
  {
    id: '2',
    type: 'transform',
    position: { x: 350, y: 100 },
    data: { transform: 'fast', value: 2 },
  },
  {
    id: '3',
    type: 'output',
    position: { x: 600, y: 100 },
    data: { isPlaying: false },
  },
  {
    id: '4',
    type: 'note',
    position: { x: 100, y: 250 },
    data: { notes: 'c3 e3 g3' },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
];

let nodeId = 5;
const getNodeId = () => `${nodeId++}`;

function getDefaultData(type: string) {
  switch (type) {
    case 'pattern':
      return { pattern: 'bd sd' };
    case 'note':
      return { notes: 'c3 e3 g3' };
    case 'value':
      return { value: 'c3' };
    case 'array':
      return { inputCount: 2 };
    case 'pick':
      return { values: 'c3, e3, g3, c4', indices: '<0 1 2 3>' };
    case 'transform':
      return { transform: 'fast' as const, value: 2 };
    case 'effect':
      return { effect: 'gain' as const, value: 0.8 };
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
  const [compiledCode, setCompiledCode] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    flowX: number;
    flowY: number;
  } | null>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

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

      // Pattern nodes can't be targets (they are pure sources)
      if (targetNode.type === 'pattern') return false;

      // Output can't be a source
      if (sourceNode.type === 'output') return false;

      return true;
    },
    [nodes]
  );

  const handleCompile = useCallback(() => {
    const result = compileGraph(nodes, edges);

    // Hot reload: only update if code changed
    if (isPlaying && result.pattern && result.code !== compiledCode) {
      updatePattern(result.pattern);
    }

    setCompiledCode(result.code);
    return result;
  }, [nodes, edges, isPlaying, compiledCode]);

  const handlePlay = useCallback(async () => {
    setIsLoading(true);
    try {
      // Initialize audio first (loads samples)
      await initAudio();

      const result = await handleCompile();
      if (result.pattern) {
        await playPattern(result.pattern);
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

  const handleStop = useCallback(() => {
    stopPattern();
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
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onContextMenu={handleContextMenu}
          isValidConnection={isValidConnection}
          nodeTypes={nodeTypes}
          snapToGrid
          snapGrid={[20, 20]}
          fitView
          className="bg-gray-950"
        >
          <Background color="#333" gap={20} />
          <Controls className="bg-gray-800 border-gray-700" />
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
