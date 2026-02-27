import { initStrudel, evaluate } from '@strudel/web';

let strudelInitialized = false;

// Hap type for Strudel events
interface Hap {
  value: Record<string, unknown>;
  whole?: {
    begin: number;
    end: number;
  };
  part: {
    begin: number;
    end: number;
  };
}

// Extract note value from hap for sorting
function extractNote(hap?: Hap): string | number | null {
  if (!hap?.value) return null;
  return (hap.value.note ?? hap.value.n ?? hap.value.s ?? null) as
    | string
    | number
    | null;
}

// Convert Strudel Fraction {s, n, d} to number
function fractionToNumber(frac: unknown): number {
  if (typeof frac === 'number') return frac;
  if (
    frac &&
    typeof frac === 'object' &&
    's' in frac &&
    'n' in frac &&
    'd' in frac
  ) {
    const { s, n, d } = frac as { s: bigint; n: bigint; d: bigint };
    return (Number(s) * Number(n)) / Number(d);
  }
  return 0;
}

// Dispatch trigger event - called once per hap from the single onTrigger
function dispatchTrigger(hap?: Hap) {
  if (!hap) return;

  // Get timing info from hap (convert Fraction to number)
  const timing = {
    start: fractionToNumber(hap.whole?.begin ?? hap.part.begin),
    end: fractionToNumber(hap.whole?.end ?? hap.part.end),
  };

  // Extract note value
  const note = extractNote(hap);

  // Get locations from hap
  const locations = (
    hap as { context?: { locations?: Array<{ start: number; end: number }> } }
  )?.context?.locations;

  if (!locations || locations.length === 0) return;

  const valueStarts = window.__zyklusValueStarts;
  if (!valueStarts) return;

  // For each location, find which ValueNode it belongs to
  for (const loc of locations) {
    // Find the ValueNode with the closest contentStart that's <= loc.start
    let matchedNodeId: string | null = null;
    let matchedContentStart = -1;

    for (const [nodeId, contentStart] of valueStarts.entries()) {
      if (contentStart <= loc.start && contentStart > matchedContentStart) {
        matchedNodeId = nodeId;
        matchedContentStart = contentStart;
      }
    }

    if (matchedNodeId) {
      // Calculate relative position within the ValueNode content
      const relativeLocation = {
        start: loc.start - matchedContentStart,
        end: loc.end - matchedContentStart,
      };

      // Dispatch trigger to the source ValueNode
      window.dispatchEvent(
        new CustomEvent('zyklus:trigger', {
          detail: {
            nodeId: matchedNodeId,
            nodeType: 'value',
            timing,
            note,
            location: relativeLocation,
            hap,
          },
        })
      );

      // Propagate trigger to all descendants with delay based on depth
      const descendants = getDescendants(matchedNodeId);
      const delayPerDepth = 50; // ms delay per depth level
      const nodes = window.__zyklusNodes;

      for (const { id, depth } of descendants) {
        const delay = depth * delayPerDepth;

        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('zyklus:trigger', {
              detail: {
                nodeId: id,
                nodeType: 'descendant',
                timing,
                note,
                hap,
              },
            })
          );

          // If this is a setVar, trigger all getVar nodes with the same name
          const node = nodes?.find((n) => n.id === id);
          if (node?.type === 'setVar' && node.data?.name) {
            const varName = node.data.name;
            const getVarNodes = nodes?.filter(
              (n) => n.type === 'getVar' && n.data?.name === varName
            );

            for (const getVarNode of getVarNodes || []) {
              window.dispatchEvent(
                new CustomEvent('zyklus:trigger', {
                  detail: {
                    nodeId: getVarNode.id,
                    nodeType: 'var',
                    timing,
                    note,
                    hap,
                  },
                })
              );
            }
          }
        }, delay);
      }
    }
  }
}

// Make the trigger function globally accessible
declare global {
  interface Window {
    __zyklusTrigger: (hap?: Hap) => void;
    __zyklusEdges?: Array<{
      source: string;
      target: string;
      sourceHandle?: string;
      targetHandle?: string;
    }>;
    __zyklusNodes?: Array<{
      id: string;
      type?: string;
      data?: { name?: string };
    }>;
  }
}

// Get all descendants of a node with their depth (nodes connected to its outputs, recursively)
function getDescendants(nodeId: string): Array<{ id: string; depth: number }> {
  const edges = window.__zyklusEdges;
  if (!edges) return [];

  const descendants: Array<{ id: string; depth: number }> = [];
  const visited = new Set<string>();
  const queue: Array<{ id: string; depth: number }> = [
    { id: nodeId, depth: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);

    // Find all nodes connected to current's outputs
    const nodes = window.__zyklusNodes;

    for (const edge of edges) {
      if (edge.source !== current.id || visited.has(edge.target)) continue;

      // Check if target node accepts trigger on this input
      const targetNode = nodes?.find((n) => n.id === edge.target);
      const isTargetArray = targetNode?.type === 'array';
      // Array accepts triggers on all inputs, others only on in-0
      const isValidTargetHandle = isTargetArray || edge.targetHandle === 'in-0';

      if (isValidTargetHandle) {
        descendants.push({ id: edge.target, depth: current.depth + 1 });
        queue.push({ id: edge.target, depth: current.depth + 1 });
      }
    }
  }

  return descendants;
}

export async function initAudio() {
  if (strudelInitialized) return;

  // Setup global trigger callback before Strudel init
  window.__zyklusTrigger = dispatchTrigger;

  // Initialize Strudel with samples
  await initStrudel();

  // Register the trigger function in Strudel context
  await evaluate(`globalThis.__zyklusTrigger = window.__zyklusTrigger`);

  // Load samples
  await evaluate(`await samples('github:tidalcycles/Dirt-Samples/master')`);

  // Load all samples from dough-samples
  const ds = 'https://raw.githubusercontent.com/felixroos/dough-samples/main';
  await evaluate(`await samples('${ds}/Dirt-Samples.json')`);
  await evaluate(`await samples('${ds}/tidal-drum-machines.json')`);
  await evaluate(`await samples('${ds}/piano.json')`);
  await evaluate(`await samples('${ds}/EmuSP12.json')`);
  await evaluate(`await samples('${ds}/vcsl.json')`);
  await evaluate(`await samples('${ds}/mridangam.json')`);

  strudelInitialized = true;
}

// Query events from clean code (without onTrigger callbacks)
export async function queryEvents(cleanCode: string): Promise<void> {
  await initAudio();

  try {
    // TODO: queryArc doesn't work with multi-statement code (const, etc.)
    // Commenting out for now until we find a solution
    /*
    // Query events and store in window for retrieval
    // Query 4 cycles to capture patterns with slow() and alternating sequences like <0 1 2 3>
    await evaluate(`
      const __events = (${cleanCode}).queryArc(0, 20);
      window.__zyklusLocations = __events.map(e => ({
        start: Number(e.whole?.begin ?? e.part.begin),
        end: Number(e.whole?.end ?? e.part.end),
        note: e.value?.note ?? e.value?.n ?? e.value?.s ?? null
      }));
    `);
    */
    void cleanCode; // Suppress unused variable warning

    /*
    // Retrieve and sort locations in TypeScript (for musical sorting)
    const locations = (
      window as unknown as {
        __zyklusLocations: Array<{
          start: number;
          end: number;
          note: string | number | null;
        }>;
      }
    ).__zyklusLocations;

    if (locations) {
      // Deduplicate by note - keep only one event per unique note
      const seenNotes = new Set<string>();
      const uniqueLocations = locations.filter((loc) => {
        const noteKey = String(loc.note ?? `${loc.start}-${loc.end}`);
        if (seenNotes.has(noteKey)) return false;
        seenNotes.add(noteKey);
        return true;
      });

      // Sort by note/pitch for visual organization (musical order)
      uniqueLocations.sort((a, b) => {
        const noteCompare = compareNotes(a.note, b.note);
        return noteCompare !== 0 ? noteCompare : a.start - b.start;
      });

      window.dispatchEvent(
        new CustomEvent('zyklus:events', {
          detail: { locations: uniqueLocations },
        })
      );
    }
    */
  } catch (e) {
    console.error('[Engine] Query failed:', e);
  }
}

// Play Strudel code
export async function playCode(code: string): Promise<void> {
  await initAudio();
  const fullCode = `(${code}).play()`;
  window.__zyklusCompiledCode = fullCode;
  await evaluate(fullCode);
  console.log(fullCode);
}

// Stop playback using hush()
export async function stopPlayback(): Promise<void> {
  if (strudelInitialized) {
    await evaluate('hush()');
  }
}

export function isInitialized(): boolean {
  return strudelInitialized;
}
