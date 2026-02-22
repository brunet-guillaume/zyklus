import type { Edge } from '@xyflow/react';
import type { AppNode } from '../nodes/types';

/**
 * Compile the node graph into Strudel code string
 * Does NOT evaluate - just generates the code
 */
export function compileGraph(nodes: AppNode[], edges: Edge[]): string {
  const outputNodes = nodes.filter((n) => n.type === 'output');
  if (outputNodes.length === 0) return '';

  // Build code for each output
  const codes = outputNodes
    .map((outputNode) => buildCode(outputNode.id, nodes, edges))
    .filter((code) => code !== '');

  if (codes.length === 0) return '';

  // Combine multiple outputs with stack
  return codes.length === 1 ? codes[0] : `stack(${codes.join(', ')})`;
}

/**
 * Build code string for a node
 * Each node just returns a string, no Pattern evaluation
 */
function buildCode(nodeId: string, nodes: AppNode[], edges: Edge[]): string {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return '';

  // Find incoming edges and get source codes
  const incomingEdges = edges.filter((e) => e.target === nodeId);
  const sourceCodes = incomingEdges
    .map((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (!sourceNode) return { edge, code: '' };
      return {
        edge,
        code: buildCode(sourceNode.id, nodes, edges),
      };
    })
    .filter((s) => s.code !== '');

  switch (node.type) {
    // === SOURCE NODES ===

    case 'sound':
      if (sourceCodes.length > 0) return `${sourceCodes[0].code}.s()`;
      return `"${node.data.sound}".s()`;

    case 'code':
      return node.data.code;

    case 'value':
      return `"${node.data.value}"`;

    // === COLLECTOR NODE ===

    case 'array': {
      // Sort by input handle index
      const sorted = sourceCodes.sort((a, b) => {
        const aIdx = parseInt(a.edge.targetHandle?.split('-')[1] || '0');
        const bIdx = parseInt(b.edge.targetHandle?.split('-')[1] || '0');
        return aIdx - bIdx;
      });
      return `[${sorted.map((s) => s.code).join(', ')}]`;
    }

    // === PATTERN GENERATORS ===

    case 'note': {
      if (sourceCodes.length > 0) return `note(${sourceCodes[0].code})`;
      return `"note(${node.data.note})"`;
    }

    case 'pick': {
      // in-0: array/values, in-1: indices pattern
      const valuesInput = sourceCodes.find(
        (s) => s.edge.targetHandle === 'in-0'
      );
      const indicesInput = sourceCodes.find(
        (s) => s.edge.targetHandle === 'in-1'
      );
      if (!valuesInput || !indicesInput) return '';
      return `pick(${valuesInput.code}, ${indicesInput.code})`;
    }

    // === TRANSFORM NODES ===

    case 'fast': {
      if (sourceCodes.length === 0) return '';
      return `${sourceCodes[0].code}.fast(${node.data.value})`;
    }

    case 'slow': {
      if (sourceCodes.length === 0) return '';
      return `${sourceCodes[0].code}.slow(${node.data.value})`;
    }

    case 'rev': {
      if (sourceCodes.length === 0) return '';
      return `${sourceCodes[0].code}.rev()`;
    }

    case 'gain': {
      if (sourceCodes.length === 0) return '';
      return `${sourceCodes[0].code}.gain(${node.data.value})`;
    }

    case 'reverb': {
      if (sourceCodes.length === 0) return '';
      return `${sourceCodes[0].code}.room(${node.data.value})`;
    }

    case 'delay': {
      if (sourceCodes.length === 0) return '';
      return `${sourceCodes[0].code}.delay(${node.data.value})`;
    }

    case 'lpf': {
      if (sourceCodes.length === 0) return '';
      return `${sourceCodes[0].code}.lpf(${node.data.value})`;
    }

    // === OUTPUT NODE ===

    case 'output': {
      if (sourceCodes.length === 0) return '';
      return sourceCodes[0].code;
    }

    default:
      return '';
  }
}
