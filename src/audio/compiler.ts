import type { Edge } from '@xyflow/react';
import type { AppNode } from '../nodes/types';

// Types for tracking data nodes
type BuildResult = { code: string; dataNodeIds: string[] };

// Mapping of nodeId to position range in compiled code
export type ValuePositionMap = Map<
  string,
  { start: number; end: number; content: string }
>;

// Store the current position map globally for access by trigger handler
let currentValuePositions: ValuePositionMap = new Map();

export function getValuePositions(): ValuePositionMap {
  return currentValuePositions;
}

/**
 * Compile the node graph into Strudel code string
 * Also builds a position map for Value nodes
 */
export function compileGraph(nodes: AppNode[], edges: Edge[]): string {
  const outputNodes = nodes.filter((n) => n.type === 'output');
  if (outputNodes.length === 0) return '';

  // Build code for each output
  const codes = outputNodes
    .map((outputNode) => buildCode(outputNode.id, nodes, edges).code)
    .filter((code) => code !== '');

  if (codes.length === 0) return '';

  // Combine multiple outputs with stack
  let code = codes.length === 1 ? codes[0] : `stack(${codes.join(', ')})`;

  // Extract value positions from markers and clean the code
  currentValuePositions = extractValuePositions(code);
  code = removeMarkers(code);

  return code;
}

// Marker format: ␂nodeId␃content␄
const MARKER_START = '\u0002'; // STX
const MARKER_SEP = '\u0003'; // ETX
const MARKER_END = '\u0004'; // EOT

function extractValuePositions(code: string): ValuePositionMap {
  const positions: ValuePositionMap = new Map();
  const regex = new RegExp(
    `${MARKER_START}([^${MARKER_SEP}]+)${MARKER_SEP}([^${MARKER_END}]*)${MARKER_END}`,
    'g'
  );

  // Two-pass approach: first find all markers, then calculate final positions
  const markers: Array<{
    index: number;
    nodeId: string;
    content: string;
    fullMatch: string;
  }> = [];

  let match;
  while ((match = regex.exec(code)) !== null) {
    markers.push({
      index: match.index,
      nodeId: match[1],
      content: match[2],
      fullMatch: match[0],
    });
  }

  // Calculate positions in final code (after all markers are removed)
  let removedChars = 0;
  for (const marker of markers) {
    const markerOverhead = marker.fullMatch.length - marker.content.length;
    const finalStart = marker.index - removedChars;
    const finalEnd = finalStart + marker.content.length;

    positions.set(marker.nodeId, {
      start: finalStart,
      end: finalEnd,
      content: marker.content,
    });

    removedChars += markerOverhead;
  }

  return positions;
}

function removeMarkers(code: string): string {
  const regex = new RegExp(
    `${MARKER_START}([^${MARKER_SEP}]+)${MARKER_SEP}([^${MARKER_END}]*)${MARKER_END}`,
    'g'
  );
  return code.replace(regex, '$2');
}

/**
 * Create trigger string that fires for node and its data dependencies
 * Passes the hap to get location info for highlighting
 */
function makeTrigger(nodeId: string, dataNodeIds: string[]): string {
  const allIds = [nodeId, ...dataNodeIds];
  const triggers = allIds
    .map((id) => `__zyklusTrigger('${id}', hap)`)
    .join('; ');
  return `.onTrigger((hap) => { ${triggers} }, false)`;
}

/**
 * Build code string for a node
 * Returns code and any data node IDs (value/array) that feed into it
 */
function buildCode(
  nodeId: string,
  nodes: AppNode[],
  edges: Edge[]
): BuildResult {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return { code: '', dataNodeIds: [] };

  // Find incoming edges and get source codes
  const incomingEdges = edges.filter((e) => e.target === nodeId);
  const sourceResults = incomingEdges
    .map((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (!sourceNode) return { edge, result: { code: '', dataNodeIds: [] } };
      return {
        edge,
        result: buildCode(sourceNode.id, nodes, edges),
      };
    })
    .filter((s) => s.result.code !== '');

  // Collect all data node IDs from sources
  const allDataNodeIds = sourceResults.flatMap((s) => s.result.dataNodeIds);

  switch (node.type) {
    // === DATA NODES (return their ID to be triggered by consumers) ===

    case 'value':
      // Wrap content with markers for position tracking
      return {
        code: `"${MARKER_START}${node.id}${MARKER_SEP}${node.data.value}${MARKER_END}"`,
        dataNodeIds: [node.id],
      };

    case 'array': {
      // Sort by input handle index
      const sorted = sourceResults.sort((a, b) => {
        const aIdx = parseInt(a.edge.targetHandle?.split('-')[1] || '0');
        const bIdx = parseInt(b.edge.targetHandle?.split('-')[1] || '0');
        return aIdx - bIdx;
      });
      return {
        code: `[${sorted.map((s) => s.result.code).join(', ')}]`,
        dataNodeIds: [node.id, ...allDataNodeIds],
      };
    }

    // === SOURCE NODES ===

    case 'sound': {
      const trigger = makeTrigger(node.id, allDataNodeIds);
      const code =
        sourceResults.length > 0
          ? `${sourceResults[0].result.code}.s()${trigger}`
          : `"${node.data.sound}".s()${trigger}`;
      return { code, dataNodeIds: [] };
    }

    case 'code': {
      const trigger = makeTrigger(node.id, allDataNodeIds);
      return { code: `(${node.data.code})${trigger}`, dataNodeIds: [] };
    }

    // === PATTERN GENERATORS ===

    case 'note': {
      const trigger = makeTrigger(node.id, allDataNodeIds);
      const code =
        sourceResults.length > 0
          ? `note(${sourceResults[0].result.code})${trigger}`
          : `note("${node.data.note}")${trigger}`;
      return { code, dataNodeIds: [] };
    }

    case 'pick': {
      // in-0: array/values, in-1: indices pattern
      const valuesInput = sourceResults.find(
        (s) => s.edge.targetHandle === 'in-0'
      );
      const indicesInput = sourceResults.find(
        (s) => s.edge.targetHandle === 'in-1'
      );
      if (!valuesInput || !indicesInput) return { code: '', dataNodeIds: [] };
      const trigger = makeTrigger(node.id, allDataNodeIds);
      return {
        code: `pick(${valuesInput.result.code}, ${indicesInput.result.code})${trigger}`,
        dataNodeIds: [],
      };
    }

    // === TRANSFORM NODES ===

    case 'fast': {
      if (sourceResults.length === 0) return { code: '', dataNodeIds: [] };
      const trigger = makeTrigger(node.id, allDataNodeIds);
      return {
        code: `${sourceResults[0].result.code}.fast(${node.data.value})${trigger}`,
        dataNodeIds: [],
      };
    }

    case 'slow': {
      if (sourceResults.length === 0) return { code: '', dataNodeIds: [] };
      const trigger = makeTrigger(node.id, allDataNodeIds);
      return {
        code: `${sourceResults[0].result.code}.slow(${node.data.value})${trigger}`,
        dataNodeIds: [],
      };
    }

    case 'rev': {
      if (sourceResults.length === 0) return { code: '', dataNodeIds: [] };
      const trigger = makeTrigger(node.id, allDataNodeIds);
      return {
        code: `${sourceResults[0].result.code}.rev()${trigger}`,
        dataNodeIds: [],
      };
    }

    case 'gain': {
      if (sourceResults.length === 0) return { code: '', dataNodeIds: [] };
      const trigger = makeTrigger(node.id, allDataNodeIds);
      return {
        code: `${sourceResults[0].result.code}.gain(${node.data.value})${trigger}`,
        dataNodeIds: [],
      };
    }

    case 'reverb': {
      if (sourceResults.length === 0) return { code: '', dataNodeIds: [] };
      const trigger = makeTrigger(node.id, allDataNodeIds);
      return {
        code: `${sourceResults[0].result.code}.room(${node.data.value})${trigger}`,
        dataNodeIds: [],
      };
    }

    case 'delay': {
      if (sourceResults.length === 0) return { code: '', dataNodeIds: [] };
      const trigger = makeTrigger(node.id, allDataNodeIds);
      return {
        code: `${sourceResults[0].result.code}.delay(${node.data.value})${trigger}`,
        dataNodeIds: [],
      };
    }

    case 'lpf': {
      if (sourceResults.length === 0) return { code: '', dataNodeIds: [] };
      const trigger = makeTrigger(node.id, allDataNodeIds);
      return {
        code: `${sourceResults[0].result.code}.lpf(${node.data.value})${trigger}`,
        dataNodeIds: [],
      };
    }

    // === OUTPUT NODE ===

    case 'output': {
      if (sourceResults.length === 0) return { code: '', dataNodeIds: [] };
      const trigger = makeTrigger(node.id, allDataNodeIds);
      return {
        code: `${sourceResults[0].result.code}${trigger}`,
        dataNodeIds: [],
      };
    }

    default:
      return { code: '', dataNodeIds: [] };
  }
}
