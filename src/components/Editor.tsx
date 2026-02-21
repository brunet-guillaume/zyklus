import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes, type AppNode } from '../nodes';
import { compileGraph, playPattern, stopPattern } from '../audio';

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
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
];

export function Editor() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isPlaying, setIsPlaying] = useState(false);
  const [compiledCode, setCompiledCode] = useState('');

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleCompile = useCallback(() => {
    const result = compileGraph(nodes, edges);
    setCompiledCode(result.code);
    return result;
  }, [nodes, edges]);

  const handlePlay = useCallback(async () => {
    const result = handleCompile();
    if (result.pattern) {
      try {
        await playPattern(result.pattern);
        setIsPlaying(true);
        setNodes((nds) =>
          nds.map((n) =>
            n.type === 'output'
              ? { ...n, data: { ...n.data, isPlaying: true } }
              : n
          )
        );
      } catch (error) {
        console.error('Play error:', error);
      }
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

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-4 p-4 bg-gray-900 border-b border-gray-700">
        <h1 className="text-xl font-bold text-purple-400">Zyklus</h1>
        <div className="flex gap-2">
          <button
            onClick={isPlaying ? handleStop : handlePlay}
            className={`px-4 py-2 rounded font-medium ${
              isPlaying
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isPlaying ? 'Stop' : 'Play'}
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
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-950"
        >
          <Background color="#333" gap={20} />
          <Controls className="bg-gray-800 border-gray-700" />
        </ReactFlow>
      </div>
    </div>
  );
}
