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
  color: string;
  dataType: DataTypeKey;
  inputs: number;
  outputs: number;
  modeOutput?: boolean;
  className?: string;
  inputLabels?: string[];
  slider?: SliderDefaults;
  compile: CompilePattern;

  // === UI Options ===
  // Text input field (for var name, bank name, scale, etc.)
  textInput?: {
    placeholder: string;
    dataKey: string;
  };
  // Code editor textarea
  codeEditor?: {
    placeholder: string;
  };
  // Dynamic inputs that grow based on connections (array node)
  dynamicInputs?: boolean;
  // Standalone slider (no mode switcher, always shows slider)
  sliderOnly?: boolean;
}

export const nodeDefinitions = {
  // === Pattern/Source nodes ===
  sound: {
    label: 'Sound',
    color: '#ffa577',
    dataType: 'simple',
    inputs: 1,
    outputs: 1,
    compile: { type: 'custom' } as const,
  },
  note: {
    label: 'Note',
    color: '#71d7ca',
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
    color: '#60a5fa',
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
    color: '#a78bfa',
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
    color: '#f472b6',
    dataType: 'simple',
    inputs: 1,
    outputs: 1,
    modeOutput: true,
    compile: { type: 'transformNoParam', method: 'rev' } as const,
  },

  // === Synth nodes ===
  supersaw: {
    label: 'Supersaw',
    color: '#e879f9',
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
    color: '#4ade80',
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
    color: '#22c55e',
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
    color: '#16a34a',
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
    color: '#15803d',
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
    color: '#166534',
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
    color: '#047857',
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
    color: '#0d9488',
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
    color: '#0891b2',
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
    color: '#0e7490',
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
    color: '#059669',
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
    color: '#f43f5e',
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
    color: '#ec4899',
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
    color: '#d946ef',
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
    color: '#84cc16',
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
    color: '#06b6d4',
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
    color: '#0891b2',
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
    color: '#f43f5e',
    dataType: 'simple',
    inputs: 3,
    outputs: 1,
    inputLabels: ['pattern', 'offset', 'cycles'],
    compile: { type: 'custom' } as const,
  },
  pick: {
    label: 'Pick',
    color: '#22d3ee',
    dataType: 'simple',
    inputs: 2,
    outputs: 1,
    inputLabels: ['values', 'indices'],
    compile: { type: 'custom' } as const,
  },
  struct: {
    label: 'Struct',
    color: '#14b8a6',
    dataType: 'simple',
    inputs: 2,
    outputs: 1,
    inputLabels: ['pattern', 'struct'],
    compile: { type: 'custom' } as const,
  },

  // === Distortion ===
  distort: {
    label: 'Distort',
    color: '#dc2626',
    dataType: 'distort',
    inputs: 1,
    outputs: 1,
    compile: { type: 'custom' } as const,
  },

  // === Routing nodes ===
  orbit: {
    label: 'Orbit',
    color: '#7c3aed',
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
    color: '#6d28d9',
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
    color: '#5b21b6',
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
    color: '#4c1d95',
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
    color: '#fb923c',
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
    color: '#f97316',
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
    color: '#f472b6',
    dataType: 'bank',
    inputs: 1,
    outputs: 1,
    textInput: { placeholder: 'RolandTR808', dataKey: 'bank' },
    compile: { type: 'custom' } as const,
  },

  // === Pattern generator nodes ===
  irand: {
    label: 'Irand',
    color: '#06b6d4',
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
    color: '#14b8a6',
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
    color: '#8b5cf6',
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
    color: '#ec4899',
    dataType: 'scale',
    inputs: 1,
    outputs: 1,
    modeOutput: true,
    textInput: { placeholder: 'c:minor', dataKey: 'scale' },
    compile: { type: 'custom' } as const,
  },

  // === Variable nodes ===
  setVar: {
    label: 'Set',
    color: '#8b5cf6',
    dataType: 'var',
    inputs: 1,
    outputs: 0,
    textInput: { placeholder: 'var name', dataKey: 'name' },
    compile: { type: 'custom' } as const,
  },
  getVar: {
    label: 'Get',
    color: '#a78bfa',
    dataType: 'var',
    inputs: 0,
    outputs: 1,
    textInput: { placeholder: 'var name', dataKey: 'name' },
    compile: { type: 'custom' } as const,
  },

  // === Special nodes ===
  slider: {
    label: 'Slider',
    color: '#f59e0b',
    dataType: 'standaloneSlider',
    inputs: 0,
    outputs: 1,
    className: 'w-46',
    sliderOnly: true,
    slider: {
      value: 50,
      min: 0,
      max: 100,
      step: 1,
      defaultMode: 'slider' as const,
    },
    compile: { type: 'custom' } as const,
  },
  value: {
    label: 'Value',
    color: '#fbbf24',
    dataType: 'value',
    inputs: 0,
    outputs: 1,
    compile: { type: 'custom' } as const,
  },
  array: {
    label: 'Array',
    color: '#818cf8',
    dataType: 'array',
    inputs: 1,
    outputs: 1,
    dynamicInputs: true,
    compile: { type: 'custom' } as const,
  },
  code: {
    label: 'Code',
    color: '#34d399',
    dataType: 'code',
    inputs: 1,
    outputs: 1,
    codeEditor: { placeholder: 'note("c3 e3 g3")' },
    compile: { type: 'custom' } as const,
  },
} as const satisfies Record<string, NodeDefinition>;

export type NodeType = keyof typeof nodeDefinitions;

// Helper to get definition with proper typing
export function getNodeDefinition(type: string): NodeDefinition | undefined {
  return nodeDefinitions[type as NodeType];
}
