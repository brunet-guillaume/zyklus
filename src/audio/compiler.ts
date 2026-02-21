import type { Edge } from '@xyflow/react';
import type { Pattern } from '@strudel/core';
import { mini } from '@strudel/mini';
import type { AppNode } from '../nodes/types';

/**
 * Compile the node graph into a Strudel Pattern
 */
export function compileGraph(
  nodes: AppNode[],
  edges: Edge[]
): { pattern: Pattern | null; code: string } {
  const outputNode = nodes.find((n) => n.type === 'output');
  if (!outputNode) return { pattern: null, code: '' };

  const result = buildChain(outputNode.id, nodes, edges);
  return result;
}

function buildChain(
  nodeId: string,
  nodes: AppNode[],
  edges: Edge[]
): { pattern: Pattern | null; code: string } {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return { pattern: null, code: '' };

  // Find incoming connected nodes
  const incomingEdges = edges.filter((e) => e.target === nodeId);
  const sourceNodes = incomingEdges
    .map((e) => nodes.find((n) => n.id === e.source))
    .filter(Boolean) as AppNode[];

  switch (node.type) {
    case 'pattern': {
      const patternStr = node.data.pattern;
      // .s() marks values as audio samples
      const pattern = mini(patternStr).s() as Pattern;
      return {
        pattern,
        code: `"${patternStr}".s()`,
      };
    }

    case 'transform': {
      if (sourceNodes.length === 0) return { pattern: null, code: '' };
      const source = buildChain(sourceNodes[0].id, nodes, edges);
      if (!source.pattern) return { pattern: null, code: '' };

      const { transform, value } = node.data;
      let newPattern: Pattern;
      let newCode: string;

      if (value !== undefined) {
        newPattern = (
          source.pattern as unknown as Record<string, (v: number) => Pattern>
        )[transform](value);
        newCode = `${source.code}.${transform}(${value})`;
      } else {
        newPattern = (
          source.pattern as unknown as Record<string, () => Pattern>
        )[transform]();
        newCode = `${source.code}.${transform}()`;
      }

      return { pattern: newPattern, code: newCode };
    }

    case 'effect': {
      if (sourceNodes.length === 0) return { pattern: null, code: '' };
      const source = buildChain(sourceNodes[0].id, nodes, edges);
      if (!source.pattern) return { pattern: null, code: '' };

      const { effect, value } = node.data;
      const newPattern = (
        source.pattern as unknown as Record<string, (v: number) => Pattern>
      )[effect](value);
      const newCode = `${source.code}.${effect}(${value})`;

      return { pattern: newPattern, code: newCode };
    }

    case 'output': {
      if (sourceNodes.length === 0) return { pattern: null, code: '' };
      // For now, just take the first input
      return buildChain(sourceNodes[0].id, nodes, edges);
    }

    default:
      return { pattern: null, code: '' };
  }
}
