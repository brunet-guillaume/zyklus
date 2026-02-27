import type { Edge } from '@xyflow/react';
import type { AppNode } from '../nodes/types';
import {
  getNodeDefinition,
  MARKER_START,
  MARKER_END,
  type BuildResult,
  type CompileContext,
  type CompileInput,
} from '../nodes/nodeDefinitions';

// Map of nodeId to start position in compiled code (after the opening quote)
export type ValueStartMap = Map<string, number>;

export interface CompileResult {
  code: string;
  cleanCode: string; // Code without onTrigger callbacks, for querying
  eventCount: number; // Number of events per cycle (0 if unknown)
}

/**
 * Build global statements from standalone nodes (CPM, setVar, etc.)
 */
function buildGlobalStatements(
  nodes: AppNode[],
  edges: Edge[],
  includeTriggers: boolean
): string[] {
  const statements: string[] = [];

  for (const node of nodes) {
    const def = getNodeDefinition(node.type);
    if (!def?.compileGlobal) continue;

    // Build context for global compile
    const ctx = buildCompileContext(node, nodes, edges, includeTriggers);
    const result = def.compileGlobal(ctx);
    if (result) {
      statements.push(result);
    }
  }

  return statements;
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

  // Build global statements (CPM, setVar, etc.) - always use static values
  const globalStatements = buildGlobalStatements(nodes, edges, false);

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
  const patternCode =
    codes.length === 1 ? codes[0] : `stack(${codes.join(', ')})`;
  const cleanPatternCode =
    cleanCodes.length === 1 ? cleanCodes[0] : `stack(${cleanCodes.join(', ')})`;

  // Combine global statements with pattern code using comma operator
  // This allows the code to be wrapped in parentheses: (setCpm(60), pattern).play()
  let code = [...globalStatements, patternCode].join(', ');
  let cleanCode = [...globalStatements, cleanPatternCode].join(', ');

  // Extract ValueNode positions from markers and remove them
  const valueStarts = extractValueStarts(code);
  code = removeValueMarkers(code);
  cleanCode = removeValueMarkers(cleanCode);
  console.log('[Compiler] Clean code:', cleanCode);
  console.log('[Compiler] Code without markers:', code);

  window.__zyklusValueStarts = valueStarts;

  return { code, cleanCode, eventCount: 0 };
}

/**
 * Extract start positions of ValueNode content from markers
 * Marker format: \x02nodeId\x03"content"
 * We want the position of the content (after the opening quote)
 */
function extractValueStarts(code: string): ValueStartMap {
  const starts: ValueStartMap = new Map();
  const regex = new RegExp(
    `${MARKER_START}([^${MARKER_END}]+)${MARKER_END}`,
    'g'
  );

  let offset = 0; // Track how many marker chars we've removed
  let match;
  while ((match = regex.exec(code)) !== null) {
    const nodeId = match[1];
    const markerLength = match[0].length;
    // After marker removal: position of quote = match.index - offset
    // Position of content = position of quote + 1
    const contentStart = match.index - offset + 2;
    starts.set(nodeId, contentStart);
    offset += markerLength;
  }

  return starts;
}

/**
 * Remove value markers from code
 */
function removeValueMarkers(code: string): string {
  const regex = new RegExp(
    `${MARKER_START}[^${MARKER_END}]+${MARKER_END}`,
    'g'
  );
  return code.replace(regex, '');
}

/**
 * Create trigger string - only used on output node
 */
function makeTrigger(includeTriggers: boolean): string {
  if (!includeTriggers) return '';
  return `.onTrigger((hap) => { __zyklusTrigger(hap) }, false)`;
}

/**
 * Remove surrounding quotes from code for use as parameter value
 */
function stripQuotes(code: string): string {
  if (code.startsWith('"') && code.endsWith('"')) {
    return code.slice(1, -1);
  }
  return code;
}

/**
 * Get parameter value based on mode (value, slider, or input)
 */
function getParamValue(
  nodeId: string,
  def: ReturnType<typeof getNodeDefinition>,
  currentValue: number | undefined,
  sourceResults: Array<{ edge: Edge; result: BuildResult }>,
  useRealtime: boolean = true
): string | number {
  const fallbackValue = def?.slider?.value ?? 1;
  const isInputMode = window.__zyklusInputModes?.[nodeId] ?? false;
  const isSliderMode = window.__zyklusSliderModes?.[nodeId] ?? false;
  const value =
    currentValue !== undefined && Number.isFinite(currentValue)
      ? currentValue
      : fallbackValue;

  if (isInputMode) {
    const paramInput = sourceResults.find(
      (s) => s.edge.targetHandle === 'in-1'
    );
    if (paramInput) {
      return `${stripQuotes(paramInput.result.code)}`;
    }
    return value;
  }

  if (isSliderMode) {
    if (!useRealtime) {
      const sliderVal = window.__zyklusSliders?.[nodeId];
      return sliderVal !== undefined && Number.isFinite(sliderVal)
        ? sliderVal
        : value;
    }
    return `signal(() => { const v = window.__zyklusSliders?.['${nodeId}']; return Number.isFinite(v) ? v : ${value}; })`;
  }

  return value;
}

/**
 * Build CompileContext for a node
 */
function buildCompileContext(
  node: AppNode,
  nodes: AppNode[],
  edges: Edge[],
  includeTriggers: boolean
): CompileContext {
  const def = getNodeDefinition(node.type);

  // Find incoming edges and get source codes
  const incomingEdges = edges.filter((e) => e.target === node.id);
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

  // Build inputs array
  const inputs: CompileInput[] = sourceResults.map((s) => ({
    handle: s.edge.targetHandle || 'in-0',
    code: s.result.code,
    sourceType: s.result.sourceType,
    dataNodes: s.result.dataNodes,
  }));

  // Collect all data nodes from sources
  const allDataNodes = () => sourceResults.flatMap((s) => s.result.dataNodes);

  return {
    nodeId: node.id,
    nodeType: node.type,
    data: node.data as Record<string, unknown>,
    inputs,
    includeTriggers,
    getInput: (handle: string) => inputs.find((i) => i.handle === handle),
    getParamValue: () =>
      getParamValue(
        node.id,
        def,
        (node.data as { value?: number }).value,
        sourceResults,
        includeTriggers
      ),
    makeTrigger: () => makeTrigger(includeTriggers),
    allDataNodes,
  };
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

  const def = getNodeDefinition(node.type);
  if (!def?.compile) return { code: '', sourceType: '', dataNodes: [] };

  // Build context and call compile function
  const ctx = buildCompileContext(node, nodes, edges, includeTriggers);
  const result = def.compile(ctx);

  // Normalize result (string → BuildResult)
  if (typeof result === 'string') {
    const inheritedSourceType = ctx.inputs[0]?.sourceType || '';
    return {
      code: result,
      sourceType: inheritedSourceType,
      dataNodes: ctx.allDataNodes(),
    };
  }

  return result;
}
