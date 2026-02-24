// Declarative node definitions
// Each node is defined by its configuration, reducing code duplication

export interface SliderDefaults {
  value: number;
  min: number;
  max: number;
  step: number;
  defaultMode: 'value' | 'slider';
}

// Compilation patterns
export type CompilePattern =
  | { type: 'transform'; method: string } // .method(paramValue) - uses slider value
  | { type: 'transformNoParam'; method: string } // .method() - no parameter
  | { type: 'transformFixed'; method: string; arg: string } // .method("fixedArg")
  | { type: 'passthrough' } // just pass code through (output)
  | { type: 'global'; method: string } // standalone, inserted at start of code
  | { type: 'custom' }; // needs custom logic in compiler

export interface NodeDefinition {
  label: string;
  inputs: number;
  outputs: number;
  modeOutput?: boolean;
  className?: string;
  inputLabels?: string[];
  slider?: SliderDefaults;
  compile: CompilePattern;
}

export const nodeDefinitions = {
  // === Pattern/Source nodes ===
  sound: {
    label: 'Sound',
    inputs: 1,
    outputs: 1,
    compile: { type: 'custom' } as const,
  },
  note: {
    label: 'Note',
    inputs: 1,
    outputs: 1,
    modeOutput: true,
    className: 'w-20',
    compile: { type: 'custom' } as const,
  },

  // === Transform nodes ===
  fast: {
    label: 'Fast',
    inputs: 1,
    outputs: 1,
    className: 'w-46',
    slider: {
      value: 2,
      min: 0.1,
      max: 8,
      step: 0.5,
      defaultMode: 'slider' as const,
    },
    compile: { type: 'transform', method: 'fast' } as const,
  },
  slow: {
    label: 'Slow',
    inputs: 1,
    outputs: 1,
    className: 'w-46',
    slider: {
      value: 2,
      min: 0.1,
      max: 16,
      step: 0.5,
      defaultMode: 'value' as const,
    },
    compile: { type: 'transform', method: 'slow' } as const,
  },
  rev: {
    label: 'Rev',
    inputs: 1,
    outputs: 1,
    modeOutput: true,
    compile: { type: 'transformNoParam', method: 'rev' } as const,
  },

  // === Synth nodes ===
  supersaw: {
    label: 'Supersaw',
    inputs: 1,
    outputs: 1,
    modeOutput: true,
    className: 'w-20',
    compile: {
      type: 'transformFixed',
      method: 'sound',
      arg: 'supersaw',
    } as const,
  },

  // === Effect nodes ===
  gain: {
    label: 'Gain',
    inputs: 1,
    outputs: 1,
    className: 'w-46',
    slider: {
      value: 0.8,
      min: 0,
      max: 1,
      step: 0.1,
      defaultMode: 'slider' as const,
    },
    compile: { type: 'transform', method: 'gain' } as const,
  },
  reverb: {
    label: 'Reverb',
    inputs: 1,
    outputs: 1,
    className: 'w-46',
    slider: {
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.1,
      defaultMode: 'slider' as const,
    },
    compile: { type: 'transform', method: 'room' } as const, // Strudel uses .room() for reverb
  },
  delay: {
    label: 'Delay',
    inputs: 1,
    outputs: 1,
    className: 'w-46',
    slider: {
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.1,
      defaultMode: 'slider' as const,
    },
    compile: { type: 'transform', method: 'delay' } as const,
  },
  lpf: {
    label: 'Low-pass',
    inputs: 1,
    outputs: 1,
    className: 'w-46',
    slider: {
      value: 1000,
      min: 20,
      max: 20000,
      step: 100,
      defaultMode: 'value' as const,
    },
    compile: { type: 'transform', method: 'lpf' } as const,
  },
  lpenv: {
    label: 'LP Env',
    inputs: 1,
    outputs: 1,
    className: 'w-46',
    slider: {
      value: 4,
      min: 0,
      max: 16,
      step: 0.1,
      defaultMode: 'value' as const,
    },
    compile: { type: 'transform', method: 'lpenv' } as const,
  },
  room: {
    label: 'Room',
    inputs: 1,
    outputs: 1,
    className: 'w-46',
    slider: {
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.05,
      defaultMode: 'slider' as const,
    },
    compile: { type: 'transform', method: 'room' } as const,
  },

  // === ADSR Envelope nodes ===
  attack: {
    label: 'Attack',
    inputs: 1,
    outputs: 1,
    className: 'w-46',
    slider: {
      value: 0.01,
      min: 0,
      max: 1,
      step: 0.01,
      defaultMode: 'slider' as const,
    },
    compile: { type: 'transform', method: 'attack' } as const,
  },
  sustain: {
    label: 'Sustain',
    inputs: 1,
    outputs: 1,
    className: 'w-46',
    slider: {
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.05,
      defaultMode: 'slider' as const,
    },
    compile: { type: 'transform', method: 'sustain' } as const,
  },
  release: {
    label: 'Release',
    inputs: 1,
    outputs: 1,
    className: 'w-46',
    slider: {
      value: 0.1,
      min: 0,
      max: 2,
      step: 0.05,
      defaultMode: 'slider' as const,
    },
    compile: { type: 'transform', method: 'release' } as const,
  },

  // === Parameter nodes ===
  postgain: {
    label: 'Postgain',
    inputs: 1,
    outputs: 1,
    className: 'w-46',
    slider: {
      value: 0.8,
      min: 0,
      max: 1,
      step: 0.1,
      defaultMode: 'slider' as const,
    },
    compile: { type: 'transform', method: 'postgain' } as const,
  },
  pcurve: {
    label: 'Pcurve',
    inputs: 1,
    outputs: 1,
    className: 'w-46',
    slider: {
      value: 2,
      min: 0,
      max: 10,
      step: 0.1,
      defaultMode: 'slider' as const,
    },
    compile: { type: 'transform', method: 'pcurve' } as const,
  },
  pdecay: {
    label: 'Pdecay',
    inputs: 1,
    outputs: 1,
    className: 'w-46',
    slider: {
      value: 0.1,
      min: 0,
      max: 1,
      step: 0.01,
      defaultMode: 'slider' as const,
    },
    compile: { type: 'transform', method: 'pdecay' } as const,
  },

  // === Structural nodes ===
  pick: {
    label: 'Pick',
    inputs: 2,
    outputs: 1,
    inputLabels: ['values', 'indices'],
    compile: { type: 'custom' } as const,
  },
  struct: {
    label: 'Struct',
    inputs: 2,
    outputs: 1,
    inputLabels: ['pattern', 'struct'],
    compile: { type: 'custom' } as const,
  },

  // === Output node ===
  output: {
    label: 'Output',
    inputs: 1,
    outputs: 0,
    modeOutput: true,
    className: 'w-20',
    compile: { type: 'passthrough' } as const,
  },

  // === Global nodes (standalone, inserted at start) ===
  cpm: {
    label: 'CPM',
    inputs: 0,
    outputs: 0,
    className: 'w-46',
    slider: {
      value: 30,
      min: 10,
      max: 120,
      step: 1,
      defaultMode: 'slider' as const,
    },
    compile: { type: 'global', method: 'setCpm' } as const,
  },
} as const satisfies Record<string, NodeDefinition>;

export type NodeType = keyof typeof nodeDefinitions;

// Helper to get definition with proper typing
export function getNodeDefinition(type: string): NodeDefinition | undefined {
  return nodeDefinitions[type as NodeType];
}
