import {
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

  // Get or create audio context
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  // Register synth oscillators (sawtooth, sine, square, triangle)
  registerSynthSounds();

  // Load base samples (drums, etc.)
  await samples('github:tidalcycles/Dirt-Samples/master');

  audioInitialized = true;
}

export async function playPattern(pattern: Pattern) {
  await initAudio();

  const ctx = getAudioContext();

  // Resume audio context (required after user interaction)
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

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

export function updatePattern(pattern: Pattern) {
  if (currentRepl && currentRepl.scheduler.started) {
    currentRepl.scheduler.setPattern(pattern, false);
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
