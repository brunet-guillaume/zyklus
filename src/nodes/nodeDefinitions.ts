// Declarative node definitions
// Each node is defined by its configuration, reducing code duplication

export interface SliderDefaults {
  value: number;
  min: number;
  max: number;
  step: number;
  defaultMode: 'value' | 'slider';
}

// Data type keys - maps to actual data types in types.ts
export type DataTypeKey =
  | 'simple'
  | 'slider'
  | 'output'
  | 'value'
  | 'array'
  | 'code'
  | 'var'
  | 'bank'
  | 'scale'
  | 'distort'
  | 'standaloneSlider';

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
  dataType: DataTypeKey;
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
    dataType: 'simple',
    inputs: 1,
    outputs: 1,
    compile: { type: 'custom' } as const,
  },
  note: {
    label: 'Note',
    dataType: 'simple',
    inputs: 1,
    outputs: 1,
    modeOutput: true,
    className: 'w-20',
    compile: { type: 'custom' } as const,
  },

  // === Transform nodes ===
  fast: {
    label: 'Fast',
    dataType: 'slider',
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
    dataType: 'slider',
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
    dataType: 'simple',
    inputs: 1,
    outputs: 1,
    modeOutput: true,
    compile: { type: 'transformNoParam', method: 'rev' } as const,
  },

  // === Synth nodes ===
  supersaw: {
    label: 'Supersaw',
    dataType: 'simple',
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
    dataType: 'slider',
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
    dataType: 'slider',
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
    dataType: 'slider',
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
    dataType: 'slider',
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
    dataType: 'slider',
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
    dataType: 'slider',
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
    dataType: 'slider',
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
    dataType: 'slider',
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
    dataType: 'slider',
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
    dataType: 'slider',
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
    dataType: 'slider',
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
    dataType: 'slider',
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
    dataType: 'slider',
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
    dataType: 'slider',
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
    dataType: 'slider',
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
    dataType: 'slider',
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
    dataType: 'simple',
    inputs: 3,
    outputs: 1,
    inputLabels: ['pattern', 'offset', 'cycles'],
    compile: { type: 'custom' } as const,
  },
  pick: {
    label: 'Pick',
    dataType: 'simple',
    inputs: 2,
    outputs: 1,
    inputLabels: ['values', 'indices'],
    compile: { type: 'custom' } as const,
  },
  struct: {
    label: 'Struct',
    dataType: 'simple',
    inputs: 2,
    outputs: 1,
    inputLabels: ['pattern', 'struct'],
    compile: { type: 'custom' } as const,
  },

  // === Distortion ===
  distort: {
    label: 'Distort',
    dataType: 'distort',
    inputs: 1,
    outputs: 1,
    compile: { type: 'custom' } as const,
  },

  // === Routing nodes ===
  orbit: {
    label: 'Orbit',
    dataType: 'slider',
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
    dataType: 'slider',
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
    dataType: 'slider',
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
    dataType: 'slider',
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
    dataType: 'output',
    inputs: 1,
    outputs: 0,
    modeOutput: true,
    className: 'w-20',
    compile: { type: 'passthrough' } as const,
  },

  // === Global nodes (standalone, inserted at start) ===
  cpm: {
    label: 'CPM',
    dataType: 'slider',
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
    dataType: 'bank',
    inputs: 1,
    outputs: 1,
    compile: { type: 'custom' } as const,
  },

  // === Pattern generator nodes ===
  irand: {
    label: 'Irand',
    dataType: 'slider',
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
    dataType: 'slider',
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
    dataType: 'slider',
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
    dataType: 'scale',
    inputs: 1,
    outputs: 1,
    modeOutput: true,
    compile: { type: 'custom' } as const,
  },

  // === Variable nodes ===
  setVar: {
    label: 'Set',
    dataType: 'var',
    inputs: 1,
    outputs: 0,
    compile: { type: 'custom' } as const,
  },
  getVar: {
    label: 'Get',
    dataType: 'var',
    inputs: 0,
    outputs: 1,
    compile: { type: 'custom' } as const,
  },

  // === Special nodes (not in definitions, added here for completeness) ===
  slider: {
    label: 'Slider',
    dataType: 'standaloneSlider',
    inputs: 0,
    outputs: 1,
    compile: { type: 'custom' } as const,
  },
  value: {
    label: 'Value',
    dataType: 'value',
    inputs: 0,
    outputs: 1,
    compile: { type: 'custom' } as const,
  },
  array: {
    label: 'Array',
    dataType: 'array',
    inputs: 2,
    outputs: 1,
    compile: { type: 'custom' } as const,
  },
  code: {
    label: 'Code',
    dataType: 'code',
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
