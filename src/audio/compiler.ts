import type { Edge } from '@xyflow/react';
import { type Pattern, stack, cat, pick, note } from '@strudel/core';
import { mini } from '@strudel/mini';
import type { AppNode } from '../nodes/types';

// Result type for node compilation
type BuildResult = {
  pattern: Pattern | null;
  code: string;
  values?: string[]; // For nodes that output raw string values
  patterns?: Pattern[]; // For nodes that output multiple patterns (Array)
  patternCodes?: string[]; // Code for each pattern
};

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
    .map((outputNode) => buildNode(outputNode.id, nodes, edges))
    .filter((r) => r.pattern !== null);

  if (results.length === 0) return { pattern: null, code: '' };

  if (results.length === 1) {
    return { pattern: results[0].pattern, code: results[0].code };
  }

  // Combine multiple tracks with stack
  const patterns = results.map((r) => r.pattern as Pattern);
  const codes = results.map((r) => r.code);

  return {
    pattern: stack(...patterns) as Pattern,
    code: `stack(${codes.join(', ')})`,
  };
}

/**
 * Build a node and return its result
 * Each node builds independently and uses its inputs' results
 */
function buildNode(
  nodeId: string,
  nodes: AppNode[],
  edges: Edge[]
): BuildResult {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return { pattern: null, code: '' };

  // Find incoming edges and build source nodes
  const incomingEdges = edges.filter((e) => e.target === nodeId);

  // Get sources with their results (build each source first)
  const sources = incomingEdges
    .map((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (!sourceNode) return null;
      return {
        edge,
        node: sourceNode,
        result: buildNode(sourceNode.id, nodes, edges),
      };
    })
    .filter(Boolean) as Array<{
    edge: Edge;
    node: AppNode;
    result: BuildResult;
  }>;

  switch (node.type) {
    // === SOURCE NODES (no inputs) ===

    case 'pattern': {
      const patternStr = node.data.pattern;
      const pattern = mini(patternStr).s() as Pattern;
      return {
        pattern,
        code: `"${patternStr}".s()`,
      };
    }

    case 'value': {
      // Value evaluates mini notation and returns a Pattern
      const valueStr = node.data.value;
      const pattern = mini(valueStr) as Pattern;
      return {
        pattern,
        code: `"${valueStr}"`,
        patterns: [pattern],
        patternCodes: [`"${valueStr}"`],
      };
    }

    // === COLLECTOR NODE ===

    case 'array': {
      // Sort sources by their input handle index
      const sortedSources = sources.sort((a, b) => {
        const aIndex = parseInt(a.edge.targetHandle?.split('-')[1] || '0');
        const bIndex = parseInt(b.edge.targetHandle?.split('-')[1] || '0');
        return aIndex - bIndex;
      });

      // Collect patterns from all sources
      const allPatterns: Pattern[] = [];
      const allCodes: string[] = [];

      for (const source of sortedSources) {
        if (source.result.patterns) {
          allPatterns.push(...source.result.patterns);
          allCodes.push(...(source.result.patternCodes || []));
        } else if (source.result.pattern) {
          allPatterns.push(source.result.pattern);
          allCodes.push(source.result.code);
        }
      }

      return {
        pattern: null,
        code: `[${allCodes.join(', ')}]`,
        patterns: allPatterns,
        patternCodes: allCodes,
      };
    }

    // === PATTERN GENERATORS ===

    case 'note': {
      // Check if there's an input
      if (sources.length > 0) {
        const source = sources[0].result;

        // If source has multiple patterns (from Array), use cat to sequence them
        if (source.patterns && source.patterns.length > 0) {
          const combinedPattern = cat(...source.patterns) as Pattern;
          const codesStr = source.patternCodes?.join(', ') || '';
          const pattern = note(combinedPattern).sound('sawtooth') as Pattern;
          return {
            pattern,
            code: `note(cat(${codesStr})).sound("sawtooth")`,
          };
        }

        // If source has a single pattern, wrap it with note()
        if (source.pattern) {
          const pattern = note(source.pattern).sound('sawtooth') as Pattern;
          return {
            pattern,
            code: `note(${source.code}).sound("sawtooth")`,
          };
        }
      }

      // Fallback to inline notes
      const notesStr = node.data.notes;
      const pattern = note(mini(notesStr)).sound('sawtooth') as Pattern;
      return {
        pattern,
        code: `note("${notesStr}").sound("sawtooth")`,
      };
    }

    case 'pick': {
      const { values, indices } = node.data;

      // Check if there's a source with patterns (from Array of Values)
      const sourceWithPatterns = sources.find((s) => s.result.patterns);
      if (sourceWithPatterns && sourceWithPatterns.result.patterns) {
        const patterns = sourceWithPatterns.result.patterns;
        const codes = sourceWithPatterns.result.patternCodes || [];
        // Pass Pattern objects to pick
        const pattern = pick(patterns as unknown as string[], mini(indices)) as Pattern;
        return {
          pattern,
          code: `pick([${codes.join(', ')}], "${indices}")`,
        };
      }

      // Fallback: use pick with string values
      let valuesArray: string[];
      let valuesCode: string;

      const sourceWithValues = sources.find((s) => s.result.values);
      if (sourceWithValues) {
        valuesArray = sourceWithValues.result.values!;
        valuesCode = `[${valuesArray.map((v) => `"${v}"`).join(', ')}]`;
      } else {
        valuesArray = values.split(',').map((v) => v.trim());
        valuesCode = `[${valuesArray.map((v) => `"${v}"`).join(', ')}]`;
      }

      const pattern = pick(valuesArray, mini(indices)) as Pattern;
      return {
        pattern,
        code: `pick(${valuesCode}, "${indices}")`,
      };
    }

    // === TRANSFORM NODES ===

    case 'transform': {
      const source = sources[0]?.result;
      if (!source?.pattern) return { pattern: null, code: '' };

      const { transform, value } = node.data;
      const hasValue = transform !== 'rev';

      let newPattern: Pattern;
      let newCode: string;

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
      const source = sources[0]?.result;
      if (!source?.pattern) return { pattern: null, code: '' };

      const { effect, value } = node.data;
      const newPattern = (
        source.pattern as unknown as Record<string, (v: number) => Pattern>
      )[effect](value);

      return {
        pattern: newPattern,
        code: `${source.code}.${effect}(${value})`,
      };
    }

    // === OUTPUT NODE ===

    case 'output': {
      const source = sources[0]?.result;
      if (!source?.pattern) return { pattern: null, code: '' };
      return source;
    }

    default:
      return { pattern: null, code: '' };
  }
}
