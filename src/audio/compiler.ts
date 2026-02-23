import type { Edge } from '@xyflow/react';
import type { AppNode } from '../nodes/types';

// Node info for trigger chain
type NodeInfo = { id: string; type: string };

// Build result includes the chain of data nodes
type BuildResult = {
  code: string;
  sourceType: string;
  dataNodes: NodeInfo[]; // Value/array nodes that feed into this
};

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

export interface CompileResult {
  code: string;
  cleanCode: string; // Code without onTrigger callbacks, for querying
  eventCount: number; // Number of events per cycle (0 if unknown)
}

/**
 * Compile the node graph into Strudel code string
 * Also builds a position map for Value nodes
 * Returns both the full code (with triggers) and clean code (for querying)
 */
export function compileGraph(nodes: AppNode[], edges: Edge[]): CompileResult {
  const outputNodes = nodes.filter((n) => n.type === 'output');
  if (outputNodes.length === 0)
    return { code: '', cleanCode: '', eventCount: 0 };

  // Build code for each output (with triggers)
  const codes = outputNodes
    .map((outputNode) => buildCode(outputNode.id, nodes, edges, true).code)
    .filter((code) => code !== '');

  // Build clean code for each output (without triggers, for querying)
  const cleanCodes = outputNodes
    .map((outputNode) => buildCode(outputNode.id, nodes, edges, false).code)
    .filter((code) => code !== '');

  if (codes.length === 0) return { code: '', cleanCode: '', eventCount: 0 };

  // Combine multiple outputs with stack
  let code = codes.length === 1 ? codes[0] : `stack(${codes.join(', ')})`;
  let cleanCode =
    cleanCodes.length === 1 ? cleanCodes[0] : `stack(${cleanCodes.join(', ')})`;

  // Extract value positions from markers and clean the code
  currentValuePositions = extractValuePositions(code);
  code = removeMarkers(code);
  cleanCode = removeMarkers(cleanCode);

  return { code, cleanCode, eventCount: 0 };
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
 * Create trigger string that fires for this node AND all data nodes in the chain
 */
function makeTrigger(
  nodeId: string,
  nodeType: string,
  dataNodes: NodeInfo[],
  includeTriggers: boolean
): string {
  if (!includeTriggers) return '';

  // Build array of all triggers
  const allTriggers = [
    `__zyklusTrigger('${nodeId}', hap, '${nodeType}')`,
    ...dataNodes.map((n) => `__zyklusTrigger('${n.id}', hap, '${n.type}')`),
  ];

  return `.onTrigger((hap) => { ${allTriggers.join('; ')} }, false)`;
}

/**
 * Build code string for a node
 */
function buildCode(
  nodeId: string,
  nodes: AppNode[],
  edges: Edge[],
  includeTriggers: boolean = true
): BuildResult {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return { code: '', sourceType: '', dataNodes: [] };

  // Find incoming edges and get source codes
  const incomingEdges = edges.filter((e) => e.target === nodeId);
  const sourceResults = incomingEdges
    .map((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (!sourceNode)
        return { edge, result: { code: '', sourceType: '', dataNodes: [] } };
      return {
        edge,
        result: buildCode(sourceNode.id, nodes, edges, includeTriggers),
      };
    })
    .filter((s) => s.result.code !== '');

  // Collect all data nodes from sources
  const allDataNodes = sourceResults.flatMap((s) => s.result.dataNodes);

  // Get source type from first source (propagate through chain)
  const inheritedSourceType = sourceResults[0]?.result.sourceType || '';

  switch (node.type) {
    // === DATA NODES (pass themselves in dataNodes) ===

    case 'value':
      return {
        code: `"${MARKER_START}${node.id}${MARKER_SEP}${node.data.value}${MARKER_END}"`,
        sourceType: 'value',
        dataNodes: [{ id: node.id, type: 'value' }],
      };

    case 'array': {
      const sorted = sourceResults.sort((a, b) => {
        const aIdx = parseInt(a.edge.targetHandle?.split('-')[1] || '0');
        const bIdx = parseInt(b.edge.targetHandle?.split('-')[1] || '0');
        return aIdx - bIdx;
      });
      // Add trigger to each element for its dataNodes + array itself
      const elements = sorted.map((s) => {
        // Always include array in the trigger, plus any source dataNodes
        const triggerNodes = [
          ...s.result.dataNodes,
          { id: node.id, type: 'array' },
        ];
        const trigger = makeTrigger(
          node.id,
          'array',
          triggerNodes,
          includeTriggers
        );
        return `${s.result.code}${trigger}`;
      });
      return {
        code: `[${elements.join(', ')}]`,
        sourceType: 'array',
        dataNodes: [],
      };
    }

    // === SOURCE NODES (fire triggers for self + data nodes) ===

    case 'sound': {
      const trigger = makeTrigger(
        node.id,
        'sound',
        allDataNodes,
        includeTriggers
      );
      const code =
        sourceResults.length > 0
          ? `${sourceResults[0].result.code}.s()${trigger}`
          : `"${node.data.sound}".s()${trigger}`;
      return { code, sourceType: 'sound', dataNodes: [] };
    }

    case 'code': {
      const trigger = makeTrigger(
        node.id,
        'code',
        allDataNodes,
        includeTriggers
      );
      return {
        code: `(${node.data.code})${trigger}`,
        sourceType: 'code',
        dataNodes: [],
      };
    }

    // === PATTERN GENERATORS ===

    case 'note': {
      const trigger = makeTrigger(
        node.id,
        'note',
        allDataNodes,
        includeTriggers
      );
      const code =
        sourceResults.length > 0
          ? `note(${sourceResults[0].result.code})${trigger}`
          : `note("${node.data.note}")${trigger}`;
      return { code, sourceType: 'note', dataNodes: [] };
    }

    case 'pick': {
      const valuesInput = sourceResults.find(
        (s) => s.edge.targetHandle === 'in-0'
      );
      const indicesInput = sourceResults.find(
        (s) => s.edge.targetHandle === 'in-1'
      );
      if (!valuesInput || !indicesInput)
        return { code: '', sourceType: '', dataNodes: [] };
      const trigger = makeTrigger(
        node.id,
        'pick',
        allDataNodes,
        includeTriggers
      );
      return {
        code: `pick(${valuesInput.result.code}, ${indicesInput.result.code})${trigger}`,
        sourceType: 'pick',
        dataNodes: [],
      };
    }

    // === TRANSFORM NODES ===

    case 'fast': {
      if (sourceResults.length === 0)
        return { code: '', sourceType: '', dataNodes: [] };
      const trigger = makeTrigger(
        node.id,
        'fast',
        allDataNodes,
        includeTriggers
      );
      return {
        code: `${sourceResults[0].result.code}.fast(${node.data.value})${trigger}`,
        sourceType: inheritedSourceType,
        dataNodes: [],
      };
    }

    case 'slow': {
      if (sourceResults.length === 0)
        return { code: '', sourceType: '', dataNodes: [] };
      const trigger = makeTrigger(
        node.id,
        'slow',
        allDataNodes,
        includeTriggers
      );
      return {
        code: `${sourceResults[0].result.code}.slow(${node.data.value})${trigger}`,
        sourceType: inheritedSourceType,
        dataNodes: [],
      };
    }

    case 'rev': {
      if (sourceResults.length === 0)
        return { code: '', sourceType: '', dataNodes: [] };
      const trigger = makeTrigger(
        node.id,
        'rev',
        allDataNodes,
        includeTriggers
      );
      return {
        code: `${sourceResults[0].result.code}.rev()${trigger}`,
        sourceType: inheritedSourceType,
        dataNodes: [],
      };
    }

    case 'gain': {
      if (sourceResults.length === 0)
        return { code: '', sourceType: '', dataNodes: [] };
      const trigger = makeTrigger(
        node.id,
        'gain',
        allDataNodes,
        includeTriggers
      );
      return {
        code: `${sourceResults[0].result.code}.gain(${node.data.value})${trigger}`,
        sourceType: inheritedSourceType,
        dataNodes: [],
      };
    }

    case 'reverb': {
      if (sourceResults.length === 0)
        return { code: '', sourceType: '', dataNodes: [] };
      const trigger = makeTrigger(
        node.id,
        'reverb',
        allDataNodes,
        includeTriggers
      );
      return {
        code: `${sourceResults[0].result.code}.room(${node.data.value})${trigger}`,
        sourceType: inheritedSourceType,
        dataNodes: [],
      };
    }

    case 'delay': {
      if (sourceResults.length === 0)
        return { code: '', sourceType: '', dataNodes: [] };
      const trigger = makeTrigger(
        node.id,
        'delay',
        allDataNodes,
        includeTriggers
      );
      return {
        code: `${sourceResults[0].result.code}.delay(${node.data.value})${trigger}`,
        sourceType: inheritedSourceType,
        dataNodes: [],
      };
    }

    case 'lpf': {
      if (sourceResults.length === 0)
        return { code: '', sourceType: '', dataNodes: [] };
      const trigger = makeTrigger(
        node.id,
        'lpf',
        allDataNodes,
        includeTriggers
      );
      return {
        code: `${sourceResults[0].result.code}.lpf(${node.data.value})${trigger}`,
        sourceType: inheritedSourceType,
        dataNodes: [],
      };
    }

    // === OUTPUT NODE ===

    case 'output': {
      if (sourceResults.length === 0)
        return { code: '', sourceType: '', dataNodes: [] };
      const trigger = makeTrigger(
        node.id,
        'output',
        allDataNodes,
        includeTriggers
      );
      return {
        code: `${sourceResults[0].result.code}${trigger}`,
        sourceType: inheritedSourceType,
        dataNodes: [],
      };
    }

    default:
      return { code: '', sourceType: '', dataNodes: [] };
  }
}
