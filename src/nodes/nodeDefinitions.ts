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

// === Compilation Types ===

// Node info for trigger chain
export type NodeInfo = { id: string; type: string };

// Build result from compilation
export type BuildResult = {
  code: string;
  sourceType: string;
  dataNodes: NodeInfo[];
};

// Input data for compilation
export interface CompileInput {
  handle: string;
  code: string;
  sourceType: string;
  dataNodes: NodeInfo[];
}

// Context passed to compile functions
export interface CompileContext {
  nodeId: string;
  nodeType: string;
  data: Record<string, unknown>;
  inputs: CompileInput[];
  includeTriggers: boolean;
  // Helper functions
  getInput: (handle: string) => CompileInput | undefined;
  getParamValue: () => string | number;
  makeTrigger: () => string;
  allDataNodes: () => NodeInfo[];
}

// Compile function type - can return full result or just code string
export type CompileFunction = (ctx: CompileContext) => BuildResult | string;

// Global compile function (for cpm, setVar - inserted at start)
export type GlobalCompileFunction = (ctx: CompileContext) => string | null;

// Marker format for value nodes (invisible markers around node ID)
export const MARKER_START = '\u0002';
export const MARKER_END = '\u0003';

// === Helper functions for compile ===

// Helper to wrap code in comment if node is disabled
const maybeComment = (code: string, enabled: boolean) =>
  enabled ? code : `/*${code}*/`;

// Simple transform: input.method(paramValue)
const transform =
  (method: string): CompileFunction =>
  (ctx) => {
    const input = ctx.getInput('in-0');
    if (!input) return { code: '', sourceType: '', dataNodes: [] };
    const enabled = ctx.data.enabled !== false;
    const part = `.${method}(${ctx.getParamValue()})`;
    return `${input.code}${maybeComment(part, enabled)}`;
  };

// Transform without parameter: input.method()
const transformNoParam =
  (method: string): CompileFunction =>
  (ctx) => {
    const input = ctx.getInput('in-0');
    if (!input) return { code: '', sourceType: '', dataNodes: [] };
    const enabled = ctx.data.enabled !== false;
    const part = `.${method}()`;
    return `${input.code}${maybeComment(part, enabled)}`;
  };

// Transform with fixed argument: input.method("arg")
const transformFixed =
  (method: string, arg: string): CompileFunction =>
  (ctx) => {
    const input = ctx.getInput('in-0');
    if (!input) return { code: '', sourceType: '', dataNodes: [] };
    const enabled = ctx.data.enabled !== false;
    const part = `.${method}("${arg}")`;
    return `${input.code}${maybeComment(part, enabled)}`;
  };

// === Field definitions for multi-field nodes (like Distort) ===
export interface FieldDefinition {
  key: string; // Key in data (e.g., 'amount')
  label: string; // Display label (e.g., 'Amount')
  type: 'number' | 'select';
  // For type 'number':
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  // For type 'select':
  options?: { value: string; label: string }[];
  defaultOption?: string;
}

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

  // === Default data for new nodes ===
  defaultData?: Record<string, unknown>;

  // === Menu ===
  menuPath?: string; // Category path for context menu (e.g. "Effects", "Transform")
  description?: string; // Tooltip description
  shortcut?: string; // Keyboard shortcut (single letter)

  // === Compilation ===
  // Main compile function - builds code for this node
  compile: CompileFunction;
  // Global compile function - for nodes that insert code at start (cpm, setVar)
  compileGlobal?: GlobalCompileFunction;

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
  // Highlightable text input with real-time character highlighting (for Value node)
  highlightable?: {
    dataKey: string; // Key in data (e.g., 'value')
    placeholder: string; // Placeholder text
  };
  // Multi-field form (for Distort node and similar)
  fields?: FieldDefinition[];
}

export const nodeDefinitions = {
  // === Pattern/Source nodes ===
  sound: {
    label: 'Sound',
    color: '#ffa577',
    menuPath: 'Generators',
    description: 'Play a sample from the input pattern',
    shortcut: 's',
    dataType: 'simple',
    inputs: 1,
    outputs: 1,
    compile: (ctx) => {
      const input = ctx.getInput('in-0');
      const enabled = ctx.data.enabled !== false;
      const part = '.s()';
      return {
        code: input
          ? `${input.code}${maybeComment(part, enabled)}`
          : '"bd".s()',
        sourceType: 'sound',
        dataNodes: ctx.allDataNodes(),
      };
    },
  },
  note: {
    label: 'Note',
    color: '#71d7ca',
    menuPath: 'Generators',
    description: 'Play a melodic note pattern',
    shortcut: 'n',
    dataType: 'simple',
    inputs: 1,
    outputs: 1,
    modeOutput: true,
    className: 'w-20',
    compile: (ctx) => {
      const input = ctx.getInput('in-0');
      const enabled = ctx.data.enabled !== false;
      if (!enabled && input) return input.code;
      return {
        code: input ? `note(${input.code})` : 'note("c3")',
        sourceType: 'note',
        dataNodes: ctx.allDataNodes(),
      };
    },
  },

  // === Transform nodes ===
  fast: {
    label: 'Fast',
    color: '#60a5fa',
    menuPath: 'Transform/Time',
    description: 'Speed up the pattern by a factor',
    shortcut: 'f',
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
    compile: transform('fast'),
  },
  slow: {
    label: 'Slow',
    color: '#a78bfa',
    menuPath: 'Transform/Time',
    description: 'Slow down the pattern by a factor',
    shortcut: 'w',
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
    compile: transform('slow'),
  },
  rev: {
    label: 'Rev',
    color: '#f472b6',
    menuPath: 'Transform/Time',
    description: 'Reverse the pattern',
    shortcut: 'r',
    dataType: 'simple',
    inputs: 1,
    outputs: 1,
    modeOutput: true,
    compile: transformNoParam('rev'),
  },

  // === Synth nodes ===
  supersaw: {
    label: 'Supersaw',
    color: '#e879f9',
    menuPath: 'Generators',
    description: 'Detuned sawtooth synth sound',
    shortcut: 'ss',
    dataType: 'simple',
    inputs: 1,
    outputs: 1,
    modeOutput: true,
    className: 'w-20',
    compile: transformFixed('sound', 'supersaw'),
  },

  // === Effect nodes ===
  gain: {
    label: 'Gain',
    color: '#4ade80',
    menuPath: 'Effects/Volume',
    description: 'Adjust the volume level',
    shortcut: 'g',
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
    compile: transform('gain'),
  },
  reverb: {
    label: 'Reverb',
    color: '#22c55e',
    menuPath: 'Effects/Space',
    description: 'Add reverb/room effect',
    shortcut: 'rb',
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
    compile: transform('room'), // Strudel uses .room() for reverb
  },
  delay: {
    label: 'Delay',
    color: '#16a34a',
    menuPath: 'Effects/Space',
    description: 'Add echo/delay effect',
    shortcut: 'd',
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
    compile: transform('delay'),
  },
  lpf: {
    label: 'Low-pass',
    color: '#15803d',
    menuPath: 'Effects/Filter',
    description: 'Low-pass filter cutoff frequency',
    shortcut: 'l',
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
    compile: transform('lpf'),
  },
  lpenv: {
    label: 'LP Env',
    color: '#166534',
    menuPath: 'Effects/Filter',
    description: 'Filter envelope depth',
    shortcut: 'le',
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
    compile: transform('lpenv'),
  },
  lpq: {
    label: 'LP Q',
    color: '#047857',
    menuPath: 'Effects/Filter',
    description: 'Filter resonance/Q factor',
    shortcut: 'lq',
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
    compile: transform('lpq'),
  },
  lpa: {
    label: 'LP Attack',
    color: '#0d9488',
    menuPath: 'Effects/Filter',
    description: 'Filter envelope attack time',
    shortcut: 'la',
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
    compile: transform('lpa'),
  },
  lps: {
    label: 'LP Sustain',
    color: '#0891b2',
    menuPath: 'Effects/Filter',
    description: 'Filter envelope sustain level',
    shortcut: 'ls',
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
    compile: transform('lps'),
  },
  lpr: {
    label: 'LP Release',
    color: '#0e7490',
    menuPath: 'Effects/Filter',
    description: 'Filter envelope release time',
    shortcut: 'lr',
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
    compile: transform('lpr'),
  },
  room: {
    label: 'Room',
    color: '#059669',
    menuPath: 'Effects/Space',
    description: 'Room size for reverb effect',
    shortcut: 'rm',
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
    compile: transform('room'),
  },

  // === ADSR Envelope nodes ===
  attack: {
    label: 'Attack',
    color: '#f43f5e',
    menuPath: 'Effects/Envelope',
    description: 'Amplitude attack time',
    shortcut: 'at',
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
    compile: transform('attack'),
  },
  sustain: {
    label: 'Sustain',
    color: '#ec4899',
    menuPath: 'Effects/Envelope',
    description: 'Amplitude sustain level',
    shortcut: 'su',
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
    compile: transform('sustain'),
  },
  release: {
    label: 'Release',
    color: '#d946ef',
    menuPath: 'Effects/Envelope',
    description: 'Amplitude release time',
    shortcut: 're',
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
    compile: transform('release'),
  },

  // === Parameter nodes ===
  postgain: {
    label: 'Postgain',
    color: '#84cc16',
    menuPath: 'Effects/Volume',
    description: 'Output gain after effects',
    shortcut: 'pg',
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
    compile: transform('postgain'),
  },
  pcurve: {
    label: 'Pcurve',
    color: '#06b6d4',
    menuPath: 'Effects/Envelope',
    description: 'Envelope curve shape',
    shortcut: 'pc',
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
    compile: transform('pcurve'),
  },
  pdecay: {
    label: 'Pdecay',
    color: '#0891b2',
    menuPath: 'Effects/Envelope',
    description: 'Pitch envelope decay time',
    shortcut: 'pd',
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
    compile: transform('pdecay'),
  },

  // === Structural nodes ===
  ribbon: {
    label: 'Ribbon',
    color: '#f43f5e',
    menuPath: 'Collections',
    description: 'Offset pattern by cycles',
    shortcut: 'ri',
    dataType: 'simple',
    inputs: 3,
    outputs: 1,
    inputLabels: ['pattern', 'offset', 'cycles'],
    compile: (ctx) => {
      const pattern = ctx.getInput('in-0');
      const offset = ctx.getInput('in-1');
      const cycles = ctx.getInput('in-2');
      if (!pattern || !offset || !cycles)
        return { code: '', sourceType: '', dataNodes: [] };
      const enabled = ctx.data.enabled !== false;
      const part = `.ribbon(${offset.code}, ${cycles.code})`;
      return {
        code: `${pattern.code}${maybeComment(part, enabled)}`,
        sourceType: 'ribbon',
        dataNodes: ctx.allDataNodes(),
      };
    },
  },
  pick: {
    label: 'Pick',
    color: '#22d3ee',
    menuPath: 'Collections',
    description: 'Pick values by index pattern',
    shortcut: 'pk',
    dataType: 'simple',
    inputs: 2,
    outputs: 1,
    inputLabels: ['values', 'indices'],
    defaultData: { values: 'c3, e3, g3, c4', indices: '<0 1 2 3>' },
    compile: (ctx) => {
      const values = ctx.getInput('in-0');
      const indices = ctx.getInput('in-1');
      if (!values || !indices)
        return { code: '', sourceType: '', dataNodes: [] };
      const enabled = ctx.data.enabled !== false;
      // pick is a source combinator, bypass returns first input
      if (!enabled) return values.code;
      return {
        code: `pick(${values.code}, ${indices.code})`,
        sourceType: 'pick',
        dataNodes: ctx.allDataNodes(),
      };
    },
  },
  struct: {
    label: 'Struct',
    color: '#14b8a6',
    menuPath: 'Collections',
    description: 'Apply rhythmic structure to pattern',
    shortcut: 'st',
    dataType: 'simple',
    inputs: 2,
    outputs: 1,
    inputLabels: ['pattern', 'struct'],
    compile: (ctx) => {
      const pattern = ctx.getInput('in-0');
      const struct = ctx.getInput('in-1');
      if (!pattern || !struct)
        return { code: '', sourceType: '', dataNodes: [] };
      const enabled = ctx.data.enabled !== false;
      const part = `.struct(${struct.code})`;
      return {
        code: `${pattern.code}${maybeComment(part, enabled)}`,
        sourceType: 'struct',
        dataNodes: ctx.allDataNodes(),
      };
    },
  },

  // === Distortion ===
  distort: {
    label: 'Distort',
    color: '#dc2626',
    menuPath: 'Effects/Distortion',
    description: 'Add distortion/saturation effect',
    shortcut: 'di',
    dataType: 'distort',
    inputs: 1,
    outputs: 1,
    defaultData: { amount: 2, postgain: 0.5, mode: '' },
    fields: [
      {
        key: 'amount',
        label: 'Amount',
        type: 'number',
        min: 0,
        defaultValue: 2,
      },
      {
        key: 'postgain',
        label: 'Post',
        type: 'number',
        min: 0,
        max: 1,
        defaultValue: 0.5,
      },
      {
        key: 'mode',
        label: 'Mode',
        type: 'select',
        defaultOption: '',
        options: [
          { value: '', label: 'default' },
          { value: 'scurve', label: 'scurve' },
          { value: 'soft', label: 'soft' },
          { value: 'hard', label: 'hard' },
          { value: 'cubic', label: 'cubic' },
          { value: 'diode', label: 'diode' },
          { value: 'asym', label: 'asym' },
          { value: 'fold', label: 'fold' },
          { value: 'sinefold', label: 'sinefold' },
          { value: 'chebyshev', label: 'chebyshev' },
        ],
      },
    ],
    compile: (ctx) => {
      const input = ctx.getInput('in-0');
      if (!input) return { code: '', sourceType: '', dataNodes: [] };
      const enabled = ctx.data.enabled !== false;
      const amount = (ctx.data.amount as number) ?? 2;
      const postgain = (ctx.data.postgain as number) ?? 0.5;
      const mode = (ctx.data.mode as string) || '';
      const distortArg = mode
        ? `"${amount}:${postgain}:${mode}"`
        : `"${amount}:${postgain}"`;
      const part = `.distort(${distortArg})`;
      return `${input.code}${maybeComment(part, enabled)}`;
    },
  },

  // === Routing nodes ===
  orbit: {
    label: 'Orbit',
    color: '#7c3aed',
    menuPath: 'Routing',
    description: 'Route to effect bus/channel',
    shortcut: 'or',
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
    compile: transform('orbit'),
  },
  duckorbit: {
    label: 'Duck',
    color: '#6d28d9',
    menuPath: 'Routing',
    description: 'Sidechain duck target orbit',
    shortcut: 'do',
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
    compile: transform('duckorbit'),
  },
  duckattack: {
    label: 'Duck Att',
    color: '#5b21b6',
    menuPath: 'Routing',
    description: 'Sidechain duck attack time',
    shortcut: 'da',
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
    compile: transform('duckattack'),
  },
  duckdepth: {
    label: 'Duck Depth',
    color: '#4c1d95',
    menuPath: 'Routing',
    description: 'Sidechain duck amount',
    shortcut: 'dd',
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
    compile: transform('duckdepth'),
  },

  // === Output node ===
  output: {
    label: 'Output',
    color: '#fb923c',
    menuPath: 'Output',
    description: 'Audio output - plays the pattern',
    shortcut: 'o',
    dataType: 'output',
    inputs: 1,
    outputs: 0,
    modeOutput: true,
    className: 'w-20',
    defaultData: { isPlaying: false },
    compile: (ctx) => {
      const input = ctx.getInput('in-0');
      if (!input) return { code: '', sourceType: '', dataNodes: [] };
      return {
        code: `${input.code}${ctx.makeTrigger()}`,
        sourceType: input.sourceType,
        dataNodes: [],
      };
    },
  },

  // === Global nodes (standalone, inserted at start) ===
  cpm: {
    label: 'CPM',
    color: '#f97316',
    menuPath: 'Global',
    description: 'Cycles per minute (tempo)',
    shortcut: 'cp',
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
    compile: () => ({ code: '', sourceType: '', dataNodes: [] }),
    compileGlobal: (ctx) => {
      const value = ctx.getParamValue();
      // Store CPM globally for animation duration calculations
      if (typeof value === 'number') {
        window.__zyklusCpm = value;
      }
      return `setCpm(${value})`;
    },
  },

  // === Bank node ===
  bank: {
    label: 'Bank',
    color: '#f472b6',
    menuPath: 'Generators',
    description: 'Sample bank/kit selection',
    shortcut: 'bk',
    dataType: 'bank',
    inputs: 1,
    outputs: 1,
    textInput: { placeholder: 'RolandTR808', dataKey: 'bank' },
    defaultData: { bank: 'RolandTR808' },
    compile: (ctx) => {
      const input = ctx.getInput('in-0');
      if (!input) return { code: '', sourceType: '', dataNodes: [] };
      const enabled = ctx.data.enabled !== false;
      const bankName = (ctx.data.bank as string) || 'RolandTR808';
      const part = `.bank("${bankName}")`;
      return `${input.code}${maybeComment(part, enabled)}`;
    },
  },

  // === Pattern generator nodes ===
  irand: {
    label: 'Irand',
    color: '#06b6d4',
    menuPath: 'Sources',
    description: 'Random integer generator',
    shortcut: 'ir',
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
    compile: (ctx) => ({
      code: `irand(${ctx.getParamValue()})`,
      sourceType: 'irand',
      dataNodes: [],
    }),
  },
  sub: {
    label: 'Sub',
    color: '#14b8a6',
    menuPath: 'Transform/Modify',
    description: 'Subtract value from pattern',
    shortcut: 'sb',
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
    compile: transform('sub'),
  },
  seg: {
    label: 'Seg',
    color: '#8b5cf6',
    menuPath: 'Transform/Modify',
    description: 'Segment pattern into steps',
    shortcut: 'sg',
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
    compile: transform('seg'),
  },
  scale: {
    label: 'Scale',
    color: '#ec4899',
    menuPath: 'Generators',
    description: 'Apply musical scale to pattern',
    shortcut: 'sc',
    dataType: 'scale',
    inputs: 1,
    outputs: 1,
    modeOutput: true,
    //textInput: { placeholder: 'c:minor', dataKey: 'scale' },
    highlightable: {
      dataKey: 'scale',
      placeholder: 'c:minor',
    },
    compile: (ctx) => {
      const input = ctx.getInput('in-0');
      if (!input) return { code: '', sourceType: '', dataNodes: [] };
      const enabled = ctx.data.enabled !== false;
      const scaleName = (ctx.data.scale as string) || 'c:minor';
      const part = `.scale(${MARKER_START}${ctx.nodeId}${MARKER_END}"${scaleName}")`;
      return {
        code: `${input.code}${maybeComment(part, enabled)}`,
        sourceType: input.sourceType,
        dataNodes: [...input.dataNodes, { id: ctx.nodeId, type: 'scale' }],
      };
    },
  },

  // === Variable nodes ===
  setVar: {
    label: 'Set',
    color: '#8b5cf6',
    menuPath: 'Variables',
    description: 'Store pattern in a variable',
    shortcut: 'sv',
    dataType: 'var',
    inputs: 1,
    outputs: 0,
    textInput: { placeholder: 'var name', dataKey: 'name' },
    defaultData: { name: '' },
    compile: () => ({ code: '', sourceType: '', dataNodes: [] }),
    compileGlobal: (ctx) => {
      const varName = (ctx.data.name as string) || 'unnamed';
      const input = ctx.getInput('in-0');
      if (!input) return null;
      return `(window.__zyklusVars = window.__zyklusVars || {}, window.__zyklusVars['${varName}'] = ${input.code})`;
    },
  },
  getVar: {
    label: 'Get',
    color: '#a78bfa',
    menuPath: 'Variables',
    description: 'Retrieve pattern from variable',
    shortcut: 'gv',
    dataType: 'var',
    inputs: 0,
    outputs: 1,
    textInput: { placeholder: 'var name', dataKey: 'name' },
    defaultData: { name: '' },
    compile: (ctx) => {
      const varName = (ctx.data.name as string) || 'unnamed';
      return {
        code: `window.__zyklusVars?.['${varName}']`,
        sourceType: 'var',
        dataNodes: [],
      };
    },
  },

  // === Special nodes ===
  slider: {
    label: 'Slider',
    color: '#f59e0b',
    menuPath: 'Sources',
    description: 'Real-time controllable value',
    shortcut: 'sl',
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
    compile: (ctx) => ({
      code: `signal(() => window.__zyklusSliders?.['${ctx.nodeId}'] ?? ${(ctx.data.value as number) ?? 50})`,
      sourceType: 'slider',
      dataNodes: [{ id: ctx.nodeId, type: 'slider' }],
    }),
  },
  value: {
    label: 'Value',
    color: '#fbbf24',
    menuPath: 'Sources',
    description: 'Text pattern value (notes, samples...)',
    shortcut: 'v',
    dataType: 'value',
    inputs: 0,
    outputs: 1,
    defaultData: { value: 'c3' },
    highlightable: {
      dataKey: 'value',
      placeholder: 'c3',
    },
    compile: (ctx) => ({
      // Marker before quote: \x02id\x03"content"
      code: `${MARKER_START}${ctx.nodeId}${MARKER_END}"${ctx.data.value}"`,
      sourceType: 'value',
      dataNodes: [{ id: ctx.nodeId, type: 'value' }],
    }),
  },
  array: {
    label: 'Array',
    color: '#818cf8',
    menuPath: 'Collections',
    description: 'Combine multiple values into an array',
    shortcut: 'a',
    dataType: 'array',
    inputs: 1,
    outputs: 1,
    dynamicInputs: true,
    defaultData: { inputCount: 2 },
    compile: (ctx) => {
      const sorted = [...ctx.inputs].sort((a, b) => {
        const aIdx = parseInt(a.handle.split('-')[1] || '0');
        const bIdx = parseInt(b.handle.split('-')[1] || '0');
        return aIdx - bIdx;
      });
      return {
        code: `[${sorted.map((s) => s.code).join(', ')}]`,
        sourceType: 'array',
        dataNodes: ctx.allDataNodes(),
      };
    },
  },
  code: {
    label: 'Code',
    color: '#34d399',
    menuPath: 'Sources',
    description: 'Write custom Strudel code',
    shortcut: 'c',
    dataType: 'code',
    inputs: 1,
    outputs: 1,
    codeEditor: { placeholder: 'note("c3 e3 g3")' },
    defaultData: { code: 'c3 e3 g3' },
    compile: (ctx) => ({
      code: `(${ctx.data.code})`,
      sourceType: 'code',
      dataNodes: ctx.allDataNodes(),
    }),
  },
} satisfies Record<string, NodeDefinition>;

export type NodeType = keyof typeof nodeDefinitions;

// Helper to get definition with proper typing
export function getNodeDefinition(type: string): NodeDefinition | undefined {
  return nodeDefinitions[type as NodeType];
}

// === Menu generation helpers ===

export interface NodeOption {
  type: string;
  label: string;
  description?: string;
  shortcut?: string;
}

export interface NodeSubcategory {
  label: string;
  nodes: NodeOption[];
}

export interface NodeCategory {
  label: string;
  nodes: NodeOption[]; // Direct nodes (no subcategory)
  subcategories: NodeSubcategory[]; // Nested subcategories
}

// Order of categories in the context menu
const CATEGORY_ORDER = [
  'Sources',
  'Generators',
  'Collections',
  'Transform',
  'Effects',
  'Routing',
  'Output',
  'Global',
  'Variables',
];

/**
 * Get flat list of all node options (for NodePalette search)
 */
export function getNodeOptions(): NodeOption[] {
  return Object.entries(nodeDefinitions).map(([type, def]) => {
    const d = def as NodeDefinition;
    return {
      type,
      label: d.label,
      description: d.description,
      shortcut: d.shortcut,
    };
  });
}

/**
 * Get categorized node options (for ContextMenu)
 * Supports nested paths like "Effects/Filter"
 */
export function getNodeCategories(): NodeCategory[] {
  // Build nested structure: category -> subcategory -> nodes
  const tree = new Map<
    string,
    { direct: NodeOption[]; subs: Map<string, NodeOption[]> }
  >();

  // Group nodes by menuPath
  Object.entries(nodeDefinitions).forEach(([type, def]) => {
    const d = def as NodeDefinition;
    const path = d.menuPath || 'Other';
    const parts = path.split('/');
    const category = parts[0];
    const subcategory = parts[1];

    if (!tree.has(category)) {
      tree.set(category, { direct: [], subs: new Map() });
    }

    const node: NodeOption = {
      type,
      label: d.label,
      description: d.description,
      shortcut: d.shortcut,
    };

    if (subcategory) {
      const subs = tree.get(category)!.subs;
      if (!subs.has(subcategory)) {
        subs.set(subcategory, []);
      }
      subs.get(subcategory)!.push(node);
    } else {
      tree.get(category)!.direct.push(node);
    }
  });

  // Convert to array sorted by CATEGORY_ORDER
  return CATEGORY_ORDER.filter((cat) => tree.has(cat)).map((cat) => {
    const data = tree.get(cat)!;
    return {
      label: cat,
      nodes: data.direct,
      subcategories: Array.from(data.subs.entries()).map(([label, nodes]) => ({
        label,
        nodes,
      })),
    };
  });
}

/**
 * Get map of keyboard shortcuts to node types
 */
export function getShortcutMap(): Map<string, string> {
  const map = new Map<string, string>();
  Object.entries(nodeDefinitions).forEach(([type, def]) => {
    const d = def as NodeDefinition;
    if (d.shortcut) {
      map.set(d.shortcut.toLowerCase(), type);
    }
  });
  return map;
}

/**
 * Get default data for a new node of the given type
 * Merges slider defaults with any custom defaultData
 */
export function getDefaultData(type: string): Record<string, unknown> {
  const def = getNodeDefinition(type);
  if (!def) return {};

  // Start with slider defaults if present
  const sliderDefaults = def.slider
    ? {
        value: def.slider.value,
        min: def.slider.min,
        max: def.slider.max,
        step: def.slider.step,
      }
    : {};

  // Merge with custom defaultData
  return { ...sliderDefaults, ...(def.defaultData ?? {}), enabled: true };
}
