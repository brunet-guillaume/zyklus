import type { Edge } from '@xyflow/react';
import { type Pattern, stack, pick } from '@strudel/core';
import { mini } from '@strudel/mini';
import type { AppNode } from '../nodes/types';

/**
 * Compile the node graph into a Strudel Pattern
 * Supports multiple Output nodes (tracks) combined with stack
 */
export function compileGraph(
  nodes: AppNode[],
  edges: Edge[]
): { pattern: Pattern | null; code: string } {
  const outputNodes = nodes.filter((n) => n.type === 'output');
  if (outputNodes.length === 0) return { pattern: null, code: '' };

  const results = outputNodes
    .map((outputNode) => buildChain(outputNode.id, nodes, edges))
    .filter((r) => r.pattern !== null);

  if (results.length === 0) return { pattern: null, code: '' };

  if (results.length === 1) {
    return results[0];
  }

  // Combine multiple tracks with stack
  const patterns = results.map((r) => r.pattern as Pattern);
  const codes = results.map((r) => r.code);

  return {
    pattern: stack(...patterns) as Pattern,
    code: `stack(${codes.join(', ')})`,
  };
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

    case 'note': {
      const notesStr = node.data.notes;
      // .note() with synth sound
      const pattern = mini(notesStr).note().sound('sawtooth') as Pattern;
      return {
        pattern,
        code: `"${notesStr}".note().sound("sawtooth")`,
      };
    }

    case 'pick': {
      const { values, indices } = node.data;

      // Check if there's an Array node connected
      const arraySource = sourceNodes.find((n) => n.type === 'array');
      let valuesArray: string[];
      let valuesCode: string;

      if (arraySource) {
        // Get values from connected Array node
        const arrayResult = buildArray(arraySource.id, nodes, edges);
        valuesArray = arrayResult.values;
        valuesCode = arrayResult.code;
      } else {
        // Parse comma-separated values
        valuesArray = values.split(',').map((v) => v.trim());
        valuesCode = `[${valuesArray.map((v) => `"${v}"`).join(', ')}]`;
      }

      // Create pattern using pick function
      const pattern = pick(valuesArray, mini(indices))
        .note()
        .sound('sawtooth') as Pattern;
      return {
        pattern,
        code: `pick(${valuesCode}, "${indices}").note().sound("sawtooth")`,
      };
    }

    case 'transform': {
      if (sourceNodes.length === 0) return { pattern: null, code: '' };
      const source = buildChain(sourceNodes[0].id, nodes, edges);
      if (!source.pattern) return { pattern: null, code: '' };

      const { transform, value } = node.data;
      let newPattern: Pattern;
      let newCode: string;

      // rev doesn't take a value
      const hasValue = transform !== 'rev';

      if (hasValue && value !== undefined) {
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

/**
 * Build an array of values from an Array node
 */
function buildArray(
  nodeId: string,
  nodes: AppNode[],
  edges: Edge[]
): { values: string[]; code: string } {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node || node.type !== 'array') return { values: [], code: '[]' };

  // Find all incoming edges, sorted by target handle (input-0, input-1, etc.)
  const incomingEdges = edges
    .filter((e) => e.target === nodeId)
    .sort((a, b) => {
      const aIndex = parseInt(a.targetHandle?.split('-')[1] || '0');
      const bIndex = parseInt(b.targetHandle?.split('-')[1] || '0');
      return aIndex - bIndex;
    });

  const values: string[] = [];
  const codes: string[] = [];

  for (const edge of incomingEdges) {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    if (sourceNode?.type === 'value') {
      values.push(sourceNode.data.value);
      codes.push(`"${sourceNode.data.value}"`);
    }
  }

  return {
    values,
    code: `[${codes.join(', ')}]`,
  };
}
