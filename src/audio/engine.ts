import { initStrudel, evaluate } from '@strudel/web';

let strudelInitialized = false;

export async function initAudio() {
  if (strudelInitialized) return;

  // Initialize Strudel with samples
  await initStrudel();

  // Load samples
  await evaluate(`await samples('github:tidalcycles/Dirt-Samples/master')`);

  strudelInitialized = true;
}

// Play Strudel code
export async function playCode(code: string): Promise<void> {
  await initAudio();
  // Add .play() to make the pattern play
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
