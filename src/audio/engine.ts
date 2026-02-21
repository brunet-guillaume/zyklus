import {
  initAudioOnFirstClick,
  getAudioContext,
  webaudioOutput,
  samples,
  registerSynthSounds,
} from '@strudel/webaudio';
import { repl, type Pattern } from '@strudel/core';

let currentRepl: Awaited<ReturnType<typeof repl>> | null = null;
let audioInitialized = false;

export async function initAudio() {
  if (audioInitialized) return;

  await initAudioOnFirstClick();

  // Register synth oscillators (sawtooth, sine, square, triangle)
  registerSynthSounds();

  // Load base samples (drums, etc.)
  await samples('github:tidalcycles/Dirt-Samples/master');

  audioInitialized = true;
}

export async function playPattern(pattern: Pattern) {
  await initAudio();

  const ctx = getAudioContext();

  if (!currentRepl) {
    currentRepl = await repl({
      defaultOutput: webaudioOutput,
      getTime: () => ctx.currentTime,
    });
  }

  try {
    currentRepl.scheduler.setPattern(pattern, true);
    if (!currentRepl.scheduler.started) {
      currentRepl.scheduler.start();
    }
  } catch (error) {
    console.error('Strudel error:', error);
    throw error;
  }
}

export function stopPattern() {
  if (currentRepl) {
    currentRepl.scheduler.stop();
  }
}

export function isPlaying(): boolean {
  return currentRepl?.scheduler?.started ?? false;
}
