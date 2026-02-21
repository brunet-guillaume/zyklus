declare module '@strudel/core' {
  export interface Pattern {
    s(): Pattern
    note(): Pattern
    sound(name: string): Pattern
    fast(factor: number): Pattern
    slow(factor: number): Pattern
    rev(): Pattern
    stack(...patterns: Pattern[]): Pattern
    gain(value: number): Pattern
    room(value: number): Pattern
    delay(value: number): Pattern
    lpf(value: number): Pattern
  }

  export function stack(...patterns: Pattern[]): Pattern

  export interface Scheduler {
    started: boolean
    setPattern(pattern: Pattern, autostart?: boolean): void
    start(): void
    stop(): void
  }

  export interface Repl {
    scheduler: Scheduler
    evaluate(pattern: Pattern): Promise<void>
    stop(): void
  }

  export function repl(options: {
    defaultOutput: unknown
    getTime: () => number
  }): Promise<Repl>
}

declare module '@strudel/mini' {
  import type { Pattern } from '@strudel/core'
  export function mini(code: string): Pattern
}

declare module '@strudel/webaudio' {
  export function getAudioContext(): AudioContext
  export function webaudioOutput(hap: unknown): void
  export function samples(url: string): Promise<void>
  export function registerSynthSounds(): void
}

declare module '@strudel/soundfonts' {
  export function soundfonts(url: string): Promise<void>
}
