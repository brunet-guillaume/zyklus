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
  lpq: {
    label: 'LP Q',
    inputs: 1,
    outputs: 1,
    className: 'w-46',
    slider: {
      value: 1,
      min: 0,
      max: 50,
      step: 0.5,
      defaultMode: 'value' as const,
    },
    compile: { type: 'transform', method: 'lpq' } as const,
  },
  lpa: {
    label: 'LP Attack',
    inputs: 1,
    outputs: 1,
    className: 'w-46',
    slider: {
      value: 0.01,
      min: 0,
      max: 1,
      step: 0.01,
      defaultMode: 'value' as const,
    },
    compile: { type: 'transform', method: 'lpa' } as const,
  },
  lps: {
    label: 'LP Sustain',
    inputs: 1,
    outputs: 1,
    className: 'w-46',
    slider: {
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.05,
      defaultMode: 'value' as const,
    },
    compile: { type: 'transform', method: 'lps' } as const,
  },
  lpr: {
    label: 'LP Release',
    inputs: 1,
    outputs: 1,
    className: 'w-46',
    slider: {
      value: 0.1,
      min: 0,
      max: 2,
      step: 0.05,
      defaultMode: 'value' as const,
    },
    compile: { type: 'transform', method: 'lpr' } as const,
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
  ribbon: {
    label: 'Ribbon',
    inputs: 3,
    outputs: 1,
    inputLabels: ['pattern', 'offset', 'cycles'],
    compile: { type: 'custom' } as const,
  },
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

  // === Distortion ===
  distort: {
    label: 'Distort',
    inputs: 1,
    outputs: 1,
    compile: { type: 'custom' } as const,
  },

  // === Routing nodes ===
  orbit: {
    label: 'Orbit',
    inputs: 1,
    outputs: 1,
    className: 'w-46',
    slider: {
      value: 1,
      min: 1,
      max: 16,
      step: 1,
      defaultMode: 'value' as const,
    },
    compile: { type: 'transform', method: 'orbit' } as const,
  },
  duckorbit: {
    label: 'Duck',
    inputs: 1,
    outputs: 1,
    className: 'w-46',
    slider: {
      value: 1,
      min: 1,
      max: 16,
      step: 1,
      defaultMode: 'value' as const,
    },
    compile: { type: 'transform', method: 'duckorbit' } as const,
  },
  duckattack: {
    label: 'Duck Att',
    inputs: 1,
    outputs: 1,
    className: 'w-46',
    slider: {
      value: 0.2,
      min: 0,
      max: 2,
      step: 0.01,
      defaultMode: 'value' as const,
    },
    compile: { type: 'transform', method: 'duckattack' } as const,
  },
  duckdepth: {
    label: 'Duck Depth',
    inputs: 1,
    outputs: 1,
    className: 'w-46',
    slider: {
      value: 1,
      min: 0,
      max: 1,
      step: 0.05,
      defaultMode: 'value' as const,
    },
    compile: { type: 'transform', method: 'duckdepth' } as const,
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

  // === Bank node ===
  bank: {
    label: 'Bank',
    inputs: 1,
    outputs: 1,
    compile: { type: 'custom' } as const,
  },

  // === Pattern generator nodes ===
  irand: {
    label: 'Irand',
    inputs: 0,
    outputs: 1,
    className: 'w-46',
    slider: {
      value: 10,
      min: 1,
      max: 100,
      step: 1,
      defaultMode: 'value' as const,
    },
    compile: { type: 'custom' } as const,
  },
  sub: {
    label: 'Sub',
    inputs: 1,
    outputs: 1,
    className: 'w-46',
    slider: {
      value: 0,
      min: -100,
      max: 100,
      step: 1,
      defaultMode: 'value' as const,
    },
    compile: { type: 'transform', method: 'sub' } as const,
  },
  seg: {
    label: 'Seg',
    inputs: 1,
    outputs: 1,
    className: 'w-46',
    slider: {
      value: 16,
      min: 1,
      max: 64,
      step: 1,
      defaultMode: 'value' as const,
    },
    compile: { type: 'transform', method: 'seg' } as const,
  },
  scale: {
    label: 'Scale',
    inputs: 1,
    outputs: 1,
    modeOutput: true,
    compile: { type: 'custom' } as const,
  },

  // === Variable nodes ===
  setVar: {
    label: 'Set',
    inputs: 1,
    outputs: 0,
    compile: { type: 'custom' } as const,
  },
  getVar: {
    label: 'Get',
    inputs: 0,
    outputs: 1,
    compile: { type: 'custom' } as const,
  },
} as const satisfies Record<string, NodeDefinition>;

export type NodeType = keyof typeof nodeDefinitions;

// Helper to get definition with proper typing
export function getNodeDefinition(type: string): NodeDefinition | undefined {
  return nodeDefinitions[type as NodeType];
}
