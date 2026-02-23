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

// Convert note string to MIDI number for musical sorting
// e.g. "c3" -> 48, "e3" -> 52, "g#4" -> 68
function noteToMidi(note: string): number | null {
  const match = note.toLowerCase().match(/^([a-g])(#|b|s)?(\d+)$/);
  if (!match) return null;

  const [, letter, accidental, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);

  // Semitone offsets from C
  const noteMap: Record<string, number> = {
    c: 0,
    d: 2,
    e: 4,
    f: 5,
    g: 7,
    a: 9,
    b: 11,
  };

  let semitone = noteMap[letter];
  if (semitone === undefined) return null;

  // Apply accidental
  if (accidental === '#' || accidental === 's') {
    semitone += 1;
  } else if (accidental === 'b') {
    semitone -= 1;
  }

  // MIDI note number (C4 = 60)
  return (octave + 1) * 12 + semitone;
}

// Compare two notes musically
function compareNotes(
  a: string | number | null,
  b: string | number | null
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;

  // Both are numbers (MIDI values)
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  // Both are strings (note names)
  if (typeof a === 'string' && typeof b === 'string') {
    const midiA = noteToMidi(a);
    const midiB = noteToMidi(b);

    // If both are valid notes, compare by MIDI
    if (midiA !== null && midiB !== null) {
      return midiA - midiB;
    }

    // Fallback to alphabetical if not parseable as notes
    return a.localeCompare(b);
  }

  // Mixed types: numbers first
  if (typeof a === 'number') return -1;
  return 1;
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

  console.log('[Events] Clean code:', cleanCode);

  try {
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
      console.log(
        '[Events] Raw locations:',
        JSON.parse(JSON.stringify(locations))
      );

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

      console.log('[Events] Unique sorted locations:', uniqueLocations);

      window.dispatchEvent(
        new CustomEvent('zyklus:events', {
          detail: { locations: uniqueLocations },
        })
      );
    }
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
