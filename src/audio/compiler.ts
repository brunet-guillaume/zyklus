import type { Edge } from '@xyflow/react';
import type { AppNode } from '../nodes/types';
import { getNodeDefinition } from '../nodes/nodeDefinitions';

// Node info for trigger chain
type NodeInfo = { id: string; type: string };

// Build result includes the chain of data nodes
type BuildResult = {
  code: string;
  sourceType: string;
  dataNodes: NodeInfo[]; // Value/array nodes that feed into this
};

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
function buildGlobalStatements(nodes: AppNode[], edges: Edge[]): string[] {
  const statements: string[] = [];

  for (const node of nodes) {
    const def = getNodeDefinition(node.type);

    // Handle global nodes (like setCpm)
    if (def?.compile.type === 'global') {
      const { method } = def.compile;
      const defaultValue = def.slider?.value ?? 1;

      // Global functions (like setCpm) don't support signal() - always use static value
      const isSliderMode = def.slider
        ? (window.__zyklusSliderModes?.[node.id] ??
          def.slider.defaultMode === 'slider')
        : false;

      const currentValue = isSliderMode
        ? (window.__zyklusSliders?.[node.id] ?? defaultValue)
        : ((node.data as { value?: number }).value ?? defaultValue);

      statements.push(`${method}(${currentValue})`);

      // Store CPM globally for animation duration calculations
      if (node.type === 'cpm') {
        window.__zyklusCpm = currentValue;
      }
    }

    // Handle setVar nodes
    if (node.type === 'setVar') {
      const varName = (node.data as { name?: string }).name || 'unnamed';

      // Find the input connected to this setVar node
      const inputEdge = edges.find(
        (e) => e.target === node.id && e.targetHandle === 'in-0'
      );

      if (inputEdge) {
        // Build code from the source node
        const sourceResult = buildCode(inputEdge.source, nodes, edges, false);
        if (sourceResult.code) {
          // Use assignment expression (not const) for comma operator compatibility
          statements.push(
            `(window.__zyklusVars = window.__zyklusVars || {}, window.__zyklusVars['${varName}'] = ${sourceResult.code})`
          );
        }
      }
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
  const globalStatements = buildGlobalStatements(nodes, edges);

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

// Marker format: \x02nodeId\x03 (invisible markers around node ID, placed before content)
const MARKER_START = '\u0002';
const MARKER_END = '\u0003';

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
 * Returns the code string to use as the parameter value
 * When useRealtime is false, returns static values for querying
 *
 * @param nodeId - The node ID
 * @param currentValue - The current value from node.data.value
 * @param fallbackValue - The fallback value if currentValue is undefined
 * @param sourceResults - The source results for input mode
 * @param useRealtime - Whether to use signal() for real-time updates
 */
function getParamValue(
  nodeId: string,
  currentValue: number | undefined,
  fallbackValue: number,
  sourceResults: Array<{ edge: Edge; result: BuildResult }>,
  useRealtime: boolean = true
): string | number {
  const isInputMode = window.__zyklusInputModes?.[nodeId] ?? false;
  const isSliderMode = window.__zyklusSliderModes?.[nodeId] ?? false;
  // Use fallback if currentValue is undefined or NaN
  const value =
    currentValue !== undefined && Number.isFinite(currentValue)
      ? currentValue
      : fallbackValue;

  if (isInputMode) {
    // Find the source connected to in-1 (the parameter input)
    const paramInput = sourceResults.find(
      (s) => s.edge.targetHandle === 'in-1'
    );
    if (paramInput) {
      return `${stripQuotes(paramInput.result.code)}`;
    }
    // Fallback to value if no input connected
    return value;
  }

  if (isSliderMode) {
    // For clean code (querying), use current slider value or fallback
    if (!useRealtime) {
      const sliderVal = window.__zyklusSliders?.[nodeId];
      return sliderVal !== undefined && Number.isFinite(sliderVal)
        ? sliderVal
        : value;
    }
    // Use a helper that ensures we always return a finite number
    return `signal(() => { const v = window.__zyklusSliders?.['${nodeId}']; return Number.isFinite(v) ? v : ${value}; })`;
  }

  // Mode "value": use the current value from node data
  return value;
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

  // Get node definition
  const def = getNodeDefinition(node.type);

  // Handle nodes based on their compile pattern
  if (def?.compile) {
    const { compile } = def;

    switch (compile.type) {
      // === TRANSFORM WITH PARAMETER (slider value) ===
      case 'transform': {
        const mainInput = sourceResults.find(
          (s) => s.edge.targetHandle === 'in-0'
        );
        if (!mainInput) return { code: '', sourceType: '', dataNodes: [] };
        const paramValue = getParamValue(
          node.id,
          (node.data as { value?: number }).value,
          def.slider?.value ?? 1,
          sourceResults,
          includeTriggers
        );
        console.log(paramValue);
        return {
          code: `${mainInput.result.code}.${compile.method}(${paramValue})`,
          sourceType: mainInput.result.sourceType || inheritedSourceType,
          dataNodes: allDataNodes,
        };
      }

      case 'transformNoParam': {
        const mainInput = sourceResults.find(
          (s) => s.edge.targetHandle === 'in-0'
        );
        if (!mainInput) return { code: '', sourceType: '', dataNodes: [] };
        return {
          code: `${mainInput.result.code}.${compile.method}()`,
          sourceType: mainInput.result.sourceType || inheritedSourceType,
          dataNodes: allDataNodes,
        };
      }

      case 'transformFixed': {
        const mainInput = sourceResults.find(
          (s) => s.edge.targetHandle === 'in-0'
        );
        if (!mainInput) return { code: '', sourceType: '', dataNodes: [] };
        return {
          code: `${mainInput.result.code}.${compile.method}("${compile.arg}")`,
          sourceType: mainInput.result.sourceType || inheritedSourceType,
          dataNodes: allDataNodes,
        };
      }

      // === PASSTHROUGH (output) - only place with trigger ===
      case 'passthrough': {
        const mainInput = sourceResults.find(
          (s) => s.edge.targetHandle === 'in-0'
        );
        if (!mainInput) return { code: '', sourceType: '', dataNodes: [] };
        const trigger = makeTrigger(includeTriggers);
        return {
          code: `${mainInput.result.code}${trigger}`,
          sourceType: mainInput.result.sourceType || inheritedSourceType,
          dataNodes: [],
        };
      }
    }
  }

  // === CUSTOM NODES (need special handling) ===
  switch (node.type) {
    case 'value':
      return {
        // Marker before quote: \x02id\x03"content"
        // After marker removal, we know content starts at the marker position + 1 (for the quote)
        code: `${MARKER_START}${node.id}${MARKER_END}"${node.data.value}"`,
        sourceType: 'value',
        dataNodes: [{ id: node.id, type: 'value' }],
      };

    case 'slider': {
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
      const elements = sorted.map((s) => {
        return s.result.code;
      });
      return {
        code: `[${elements.join(', ')}]`,
        sourceType: 'array',
        dataNodes: allDataNodes,
      };
    }

    case 'sound': {
      const code =
        sourceResults.length > 0
          ? `${sourceResults[0].result.code}.s()`
          : `"${(node.data as { sound?: string }).sound}".s()`;
      return { code, sourceType: 'sound', dataNodes: allDataNodes };
    }

    case 'code': {
      return {
        code: `(${node.data.code})`,
        sourceType: 'code',
        dataNodes: allDataNodes,
      };
    }

    case 'note': {
      const code =
        sourceResults.length > 0
          ? `note(${sourceResults[0].result.code})`
          : `note("${(node.data as { note?: string }).note}")`;
      return { code, sourceType: 'note', dataNodes: allDataNodes };
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
      return {
        code: `pick(${valuesInput.result.code}, ${indicesInput.result.code})`,
        sourceType: 'pick',
        dataNodes: allDataNodes,
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
      const combinedDataNodes = [
        ...patternInput.result.dataNodes,
        ...structInput.result.dataNodes,
      ];
      return {
        code: `${patternInput.result.code}.struct(${structInput.result.code})`,
        sourceType: 'struct',
        dataNodes: combinedDataNodes,
      };
    }

    case 'ribbon': {
      const patternInput = sourceResults.find(
        (s) => s.edge.targetHandle === 'in-0'
      );
      const offsetInput = sourceResults.find(
        (s) => s.edge.targetHandle === 'in-1'
      );
      const cyclesInput = sourceResults.find(
        (s) => s.edge.targetHandle === 'in-2'
      );
      if (!patternInput || !offsetInput || !cyclesInput)
        return { code: '', sourceType: '', dataNodes: [] };
      return {
        code: `${patternInput.result.code}.ribbon(${offsetInput.result.code}, ${cyclesInput.result.code})`,
        sourceType: 'ribbon',
        dataNodes: allDataNodes,
      };
    }

    case 'setVar': {
      // setVar is handled in buildGlobalStatements, no output
      return { code: '', sourceType: '', dataNodes: [] };
    }

    case 'getVar': {
      const varName = (node.data as { name?: string }).name || 'unnamed';
      // Generate code that retrieves the value from global storage
      return {
        code: `window.__zyklusVars?.['${varName}']`,
        sourceType: 'var',
        dataNodes: [],
      };
    }

    case 'bank': {
      const mainInput = sourceResults.find(
        (s) => s.edge.targetHandle === 'in-0'
      );
      if (!mainInput) return { code: '', sourceType: '', dataNodes: [] };
      const bankName = (node.data as { bank?: string }).bank || 'RolandTR808';
      return {
        code: `${mainInput.result.code}.bank("${bankName}")`,
        sourceType: mainInput.result.sourceType,
        dataNodes: allDataNodes,
      };
    }

    case 'irand': {
      const value = (node.data as { value?: number }).value ?? 10;
      return {
        code: `irand(${value})`,
        sourceType: 'irand',
        dataNodes: [],
      };
    }

    case 'scale': {
      const mainInput = sourceResults.find(
        (s) => s.edge.targetHandle === 'in-0'
      );
      if (!mainInput) return { code: '', sourceType: '', dataNodes: [] };
      const scaleName = (node.data as { scale?: string }).scale || 'c:minor';
      return {
        code: `${mainInput.result.code}.scale("${scaleName}")`,
        sourceType: mainInput.result.sourceType,
        dataNodes: allDataNodes,
      };
    }

    case 'distort': {
      const mainInput = sourceResults.find(
        (s) => s.edge.targetHandle === 'in-0'
      );
      if (!mainInput) return { code: '', sourceType: '', dataNodes: [] };
      const distortData = node.data as {
        amount?: number;
        postgain?: number;
        mode?: string;
      };
      const amount = distortData.amount ?? 2;
      const postgain = distortData.postgain ?? 0.5;
      const mode = distortData.mode || '';

      // Build distort string: "amount:postgain:mode" or simpler variants
      let distortArg: string;
      if (mode) {
        distortArg = `"${amount}:${postgain}:${mode}"`;
      } else {
        distortArg = `"${amount}:${postgain}"`;
      }

      return {
        code: `${mainInput.result.code}.distort(${distortArg})`,
        sourceType: mainInput.result.sourceType,
        dataNodes: allDataNodes,
      };
    }

    default:
      return { code: '', sourceType: '', dataNodes: [] };
  }
}
