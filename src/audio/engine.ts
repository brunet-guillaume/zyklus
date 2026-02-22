import { initStrudel, evaluate } from '@strudel/web';
import { getValuePositions, type ValuePositionMap } from './compiler';

let strudelInitialized = false;

// Hap type for Strudel events
interface Hap {
  value: Record<string, unknown>;
  context?: {
    locations?: Array<{
      start: number;
      end: number;
    }>;
  };
}

// Map Strudel location to Value node relative position
// Note: Strudel locations are offset by 1 due to wrapping code in `(code).play()`
function mapLocationToValueNode(
  location: { start: number; end: number },
  valuePositions: ValuePositionMap
): { nodeId: string; start: number; end: number } | null {
  // Adjust for the `(` wrapper added in playCode
  const adjustedStart = location.start - 1;
  const adjustedEnd = location.end - 1;

  for (const [nodeId, pos] of valuePositions) {
    // Check if the Strudel location falls within this Value node's content
    if (adjustedStart >= pos.start && adjustedEnd <= pos.end) {
      return {
        nodeId,
        start: adjustedStart - pos.start,
        end: adjustedEnd - pos.start,
      };
    }
  }
  return null;
}

// Dispatch trigger events for node animation with node ID and location
function dispatchTrigger(nodeId: string, hap?: Hap) {
  const locations = hap?.context?.locations;
  const valuePositions = getValuePositions();

  // Check if this is a Value node
  const isValueNode = valuePositions.has(nodeId);

  // Map locations to Value node relative positions
  let relativeLocations: Array<{ start: number; end: number }> | undefined;

  if (locations && locations.length > 0) {
    for (const loc of locations) {
      const mapped = mapLocationToValueNode(loc, valuePositions);
      if (mapped && mapped.nodeId === nodeId) {
        relativeLocations = relativeLocations || [];
        relativeLocations.push({ start: mapped.start, end: mapped.end });
      }
    }
  }

  // For Value nodes, only trigger if there are mapped locations
  if (isValueNode && !relativeLocations) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent('zyklus:trigger', {
      detail: {
        nodeId,
        locations: relativeLocations,
      },
    })
  );
}

// Make the trigger function globally accessible
declare global {
  interface Window {
    __zyklusTrigger: (nodeId: string, hap?: Hap) => void;
  }
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

  strudelInitialized = true;
}

// Play Strudel code
export async function playCode(code: string): Promise<void> {
  await initAudio();
  // The code already has .onTrigger() calls from compiler, just play it
  await evaluate(`(${code}).play()`);
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
