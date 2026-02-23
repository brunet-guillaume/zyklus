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

// Dispatch trigger event for a single node
function dispatchTrigger(nodeId: string, hap?: Hap, nodeType?: string) {
  // Get timing info from hap (convert Fraction to number)
  const timing = hap
    ? {
        start: Number(hap.whole?.begin ?? hap.part.begin),
        end: Number(hap.whole?.end ?? hap.part.end),
      }
    : undefined;

  // Extract note value for sorting
  const note = extractNote(hap);

  window.dispatchEvent(
    new CustomEvent('zyklus:trigger', {
      detail: {
        nodeId,
        nodeType: nodeType ?? 'unknown',
        timing,
        note,
      },
    })
  );
}

// Make the trigger function globally accessible
declare global {
  interface Window {
    __zyklusTrigger: (nodeId: string, hap?: Hap, nodeType?: string) => void;
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

// Query events from clean code (without onTrigger callbacks)
export async function queryEvents(cleanCode: string): Promise<void> {
  await initAudio();

  try {
    await evaluate(`
      const __events = (${cleanCode}).queryArc(0, 1);
      const locations = __events.map(e => ({
        start: Number(e.whole?.begin ?? e.part.begin),
        end: Number(e.whole?.end ?? e.part.end),
        note: e.value?.note ?? e.value?.n ?? e.value?.s ?? null
      }));
      // Sort by note/pitch for visual organization
      locations.sort((a, b) => {
        if (a.note === null && b.note === null) return a.start - b.start;
        if (a.note === null) return 1;
        if (b.note === null) return -1;
        if (typeof a.note === 'number' && typeof b.note === 'number') return a.note - b.note;
        if (typeof a.note === 'string' && typeof b.note === 'string') return a.note.localeCompare(b.note);
        return a.start - b.start;
      });
      window.dispatchEvent(new CustomEvent('zyklus:events', {
        detail: { locations }
      }));
    `);
  } catch (e) {
    console.error('[Engine] Query failed:', e);
  }
}

// Play Strudel code
export async function playCode(code: string): Promise<void> {
  await initAudio();
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
