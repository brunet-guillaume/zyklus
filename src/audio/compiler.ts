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
 * Clean code from markers and quotes for use as parameter value
 */
function cleanParamCode(code: string): string {
  // Remove markers (STX, ETX, EOT characters and node IDs between them)
  const markerRegex = new RegExp(
    `\u0002[^\u0003]+\u0003([^\u0004]*)\u0004`,
    'g'
  );
  let cleaned = code.replace(markerRegex, '$1');

  // Remove surrounding quotes if present
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }

  return cleaned;
}

/**
 * Get parameter value based on mode (value, slider, or input)
 * Returns the code string to use as the parameter value
 */
function getParamValue(
  nodeId: string,
  defaultValue: number,
  sourceResults: Array<{ edge: Edge; result: BuildResult }>
): string | number {
  const isInputMode = window.__zyklusInputModes?.[nodeId] ?? false;
  const isSliderMode = window.__zyklusSliderModes?.[nodeId] ?? false;

  if (isInputMode) {
    // Find the source connected to in-1 (the parameter input)
    const paramInput = sourceResults.find(
      (s) => s.edge.targetHandle === 'in-1'
    );
    if (paramInput) {
      return `"${cleanParamCode(paramInput.result.code)}"`;
    }
    // Fallback to default if no input connected
    return defaultValue;
  }

  if (isSliderMode) {
    return `signal(() => window.__zyklusSliders?.['${nodeId}'] ?? ${defaultValue})`;
  }

  return defaultValue;
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

    case 'slider': {
      // Use a global variable that can be updated in real-time
      // Strudel will read this value on each cycle via signal()
      return {
        code: `signal(() => window.__zyklusSliders?.['${node.id}'] ?? ${node.data.value ?? 500})`,
        sourceType: 'slider',
        dataNodes: [{ id: node.id, type: 'slider' }],
      };
    }

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

    case 'struct': {
      const patternInput = sourceResults.find(
        (s) => s.edge.targetHandle === 'in-0'
      );
      const structInput = sourceResults.find(
        (s) => s.edge.targetHandle === 'in-1'
      );
      if (!patternInput || !structInput)
        return { code: '', sourceType: '', dataNodes: [] };
      // Include dataNodes from both inputs for proper triggering
      const combinedDataNodes = [
        ...patternInput.result.dataNodes,
        ...structInput.result.dataNodes,
      ];
      const trigger = makeTrigger(
        node.id,
        'struct',
        combinedDataNodes,
        includeTriggers
      );
      return {
        code: `${patternInput.result.code}.struct(${structInput.result.code})${trigger}`,
        sourceType: 'struct',
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
      const fastValue = getParamValue(
        node.id,
        node.data.value ?? 2,
        sourceResults
      );
      return {
        code: `${sourceResults[0].result.code}.fast(${fastValue})${trigger}`,
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
      const slowValue = getParamValue(
        node.id,
        node.data.value ?? 2,
        sourceResults
      );
      return {
        code: `${sourceResults[0].result.code}.slow(${slowValue})${trigger}`,
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

    case 'supersaw': {
      if (sourceResults.length === 0)
        return { code: '', sourceType: '', dataNodes: [] };
      const trigger = makeTrigger(
        node.id,
        'supersaw',
        allDataNodes,
        includeTriggers
      );
      return {
        code: `${sourceResults[0].result.code}.sound("supersaw")${trigger}`,
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
      const gainValue = getParamValue(
        node.id,
        node.data.value ?? 0.8,
        sourceResults
      );
      return {
        code: `${sourceResults[0].result.code}.gain(${gainValue})${trigger}`,
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
      const reverbValue = getParamValue(
        node.id,
        node.data.value ?? 0.5,
        sourceResults
      );
      return {
        code: `${sourceResults[0].result.code}.room(${reverbValue})${trigger}`,
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
      const delayValue = getParamValue(
        node.id,
        node.data.value ?? 0.5,
        sourceResults
      );
      return {
        code: `${sourceResults[0].result.code}.delay(${delayValue})${trigger}`,
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
      const freqValue = getParamValue(
        node.id,
        node.data.value ?? 1000,
        sourceResults
      );
      return {
        code: `${sourceResults[0].result.code}.lpf(${freqValue})${trigger}`,
        sourceType: inheritedSourceType,
        dataNodes: [],
      };
    }

    case 'lpenv': {
      if (sourceResults.length === 0)
        return { code: '', sourceType: '', dataNodes: [] };
      const trigger = makeTrigger(
        node.id,
        'lpenv',
        allDataNodes,
        includeTriggers
      );
      const envValue = getParamValue(
        node.id,
        node.data.value ?? 4,
        sourceResults
      );
      return {
        code: `${sourceResults[0].result.code}.lpenv(${envValue})${trigger}`,
        sourceType: inheritedSourceType,
        dataNodes: [],
      };
    }

    case 'room': {
      if (sourceResults.length === 0)
        return { code: '', sourceType: '', dataNodes: [] };
      const trigger = makeTrigger(
        node.id,
        'room',
        allDataNodes,
        includeTriggers
      );
      const roomValue = getParamValue(
        node.id,
        node.data.value ?? 0.5,
        sourceResults
      );
      return {
        code: `${sourceResults[0].result.code}.room(${roomValue})${trigger}`,
        sourceType: inheritedSourceType,
        dataNodes: [],
      };
    }

    case 'attack': {
      if (sourceResults.length === 0)
        return { code: '', sourceType: '', dataNodes: [] };
      const trigger = makeTrigger(
        node.id,
        'attack',
        allDataNodes,
        includeTriggers
      );
      const attackValue = getParamValue(
        node.id,
        node.data.value ?? 0.01,
        sourceResults
      );
      return {
        code: `${sourceResults[0].result.code}.attack(${attackValue})${trigger}`,
        sourceType: inheritedSourceType,
        dataNodes: [],
      };
    }

    case 'sustain': {
      if (sourceResults.length === 0)
        return { code: '', sourceType: '', dataNodes: [] };
      const trigger = makeTrigger(
        node.id,
        'sustain',
        allDataNodes,
        includeTriggers
      );
      const sustainValue = getParamValue(
        node.id,
        node.data.value ?? 0.5,
        sourceResults
      );
      return {
        code: `${sourceResults[0].result.code}.sustain(${sustainValue})${trigger}`,
        sourceType: inheritedSourceType,
        dataNodes: [],
      };
    }

    case 'release': {
      if (sourceResults.length === 0)
        return { code: '', sourceType: '', dataNodes: [] };
      const trigger = makeTrigger(
        node.id,
        'release',
        allDataNodes,
        includeTriggers
      );
      const releaseValue = getParamValue(
        node.id,
        node.data.value ?? 0.1,
        sourceResults
      );
      return {
        code: `${sourceResults[0].result.code}.release(${releaseValue})${trigger}`,
        sourceType: inheritedSourceType,
        dataNodes: [],
      };
    }

    case 'postgain': {
      if (sourceResults.length === 0)
        return { code: '', sourceType: '', dataNodes: [] };
      const trigger = makeTrigger(
        node.id,
        'postgain',
        allDataNodes,
        includeTriggers
      );
      const postgainValue = getParamValue(
        node.id,
        node.data.value ?? 0.8,
        sourceResults
      );
      return {
        code: `${sourceResults[0].result.code}.postgain(${postgainValue})${trigger}`,
        sourceType: inheritedSourceType,
        dataNodes: [],
      };
    }

    case 'pcurve': {
      if (sourceResults.length === 0)
        return { code: '', sourceType: '', dataNodes: [] };
      const trigger = makeTrigger(
        node.id,
        'pcurve',
        allDataNodes,
        includeTriggers
      );
      const pcurveValue = getParamValue(
        node.id,
        node.data.value ?? 2,
        sourceResults
      );
      return {
        code: `${sourceResults[0].result.code}.pcurve(${pcurveValue})${trigger}`,
        sourceType: inheritedSourceType,
        dataNodes: [],
      };
    }

    case 'pdecay': {
      if (sourceResults.length === 0)
        return { code: '', sourceType: '', dataNodes: [] };
      const trigger = makeTrigger(
        node.id,
        'pdecay',
        allDataNodes,
        includeTriggers
      );
      const pdecayValue = getParamValue(
        node.id,
        node.data.value ?? 0.1,
        sourceResults
      );
      return {
        code: `${sourceResults[0].result.code}.pdecay(${pdecayValue})${trigger}`,
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
