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

// Simple transform: input.method(paramValue)
const transform =
  (method: string): CompileFunction =>
  (ctx) => {
    const input = ctx.getInput('in-0');
    if (!input) return { code: '', sourceType: '', dataNodes: [] };
    return `${input.code}.${method}(${ctx.getParamValue()})`;
  };

// Transform without parameter: input.method()
const transformNoParam =
  (method: string): CompileFunction =>
  (ctx) => {
    const input = ctx.getInput('in-0');
    if (!input) return { code: '', sourceType: '', dataNodes: [] };
    return `${input.code}.${method}()`;
  };

// Transform with fixed argument: input.method("arg")
const transformFixed =
  (method: string, arg: string): CompileFunction =>
  (ctx) => {
    const input = ctx.getInput('in-0');
    if (!input) return { code: '', sourceType: '', dataNodes: [] };
    return `${input.code}.${method}("${arg}")`;
  };

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
}

export const nodeDefinitions = {
  // === Pattern/Source nodes ===
  sound: {
    label: 'Sound',
    color: '#ffa577',
    menuPath: 'Generators',
    dataType: 'simple',
    inputs: 1,
    outputs: 1,
    compile: (ctx) => {
      const input = ctx.getInput('in-0');
      return {
        code: input ? `${input.code}.s()` : '"bd".s()',
        sourceType: 'sound',
        dataNodes: ctx.allDataNodes(),
      };
    },
  },
  note: {
    label: 'Note',
    color: '#71d7ca',
    menuPath: 'Generators',
    dataType: 'simple',
    inputs: 1,
    outputs: 1,
    modeOutput: true,
    className: 'w-20',
    compile: (ctx) => {
      const input = ctx.getInput('in-0');
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
    menuPath: 'Transform',
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
    menuPath: 'Transform',
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
    menuPath: 'Transform',
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
    menuPath: 'Effects',
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
    menuPath: 'Effects',
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
    menuPath: 'Effects',
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
    menuPath: 'Effects',
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
    menuPath: 'Effects',
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
    menuPath: 'Effects',
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
    menuPath: 'Effects',
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
    menuPath: 'Effects',
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
    menuPath: 'Effects',
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
    menuPath: 'Effects',
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
    menuPath: 'Effects',
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
    menuPath: 'Effects',
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
    menuPath: 'Effects',
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
    menuPath: 'Effects',
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
    menuPath: 'Effects',
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
    menuPath: 'Effects',
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
      return {
        code: `${pattern.code}.ribbon(${offset.code}, ${cycles.code})`,
        sourceType: 'ribbon',
        dataNodes: ctx.allDataNodes(),
      };
    },
  },
  pick: {
    label: 'Pick',
    color: '#22d3ee',
    menuPath: 'Collections',
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
    dataType: 'simple',
    inputs: 2,
    outputs: 1,
    inputLabels: ['pattern', 'struct'],
    compile: (ctx) => {
      const pattern = ctx.getInput('in-0');
      const struct = ctx.getInput('in-1');
      if (!pattern || !struct)
        return { code: '', sourceType: '', dataNodes: [] };
      return {
        code: `${pattern.code}.struct(${struct.code})`,
        sourceType: 'struct',
        dataNodes: ctx.allDataNodes(),
      };
    },
  },

  // === Distortion ===
  distort: {
    label: 'Distort',
    color: '#dc2626',
    menuPath: 'Effects',
    dataType: 'distort',
    inputs: 1,
    outputs: 1,
    compile: (ctx) => {
      const input = ctx.getInput('in-0');
      if (!input) return { code: '', sourceType: '', dataNodes: [] };
      const amount = (ctx.data.amount as number) ?? 2;
      const postgain = (ctx.data.postgain as number) ?? 0.5;
      const mode = (ctx.data.mode as string) || '';
      const distortArg = mode
        ? `"${amount}:${postgain}:${mode}"`
        : `"${amount}:${postgain}"`;
      return `${input.code}.distort(${distortArg})`;
    },
  },

  // === Routing nodes ===
  orbit: {
    label: 'Orbit',
    color: '#7c3aed',
    menuPath: 'Routing',
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
    dataType: 'bank',
    inputs: 1,
    outputs: 1,
    textInput: { placeholder: 'RolandTR808', dataKey: 'bank' },
    defaultData: { bank: 'RolandTR808' },
    compile: (ctx) => {
      const input = ctx.getInput('in-0');
      if (!input) return { code: '', sourceType: '', dataNodes: [] };
      const bankName = (ctx.data.bank as string) || 'RolandTR808';
      return `${input.code}.bank("${bankName}")`;
    },
  },

  // === Pattern generator nodes ===
  irand: {
    label: 'Irand',
    color: '#06b6d4',
    menuPath: 'Sources',
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
    menuPath: 'Transform',
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
    menuPath: 'Transform',
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
    dataType: 'scale',
    inputs: 1,
    outputs: 1,
    modeOutput: true,
    textInput: { placeholder: 'c:minor', dataKey: 'scale' },
    compile: (ctx) => {
      const input = ctx.getInput('in-0');
      if (!input) return { code: '', sourceType: '', dataNodes: [] };
      const scaleName = (ctx.data.scale as string) || 'c:minor';
      return `${input.code}.scale("${scaleName}")`;
    },
  },

  // === Variable nodes ===
  setVar: {
    label: 'Set',
    color: '#8b5cf6',
    menuPath: 'Variables',
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
    dataType: 'value',
    inputs: 0,
    outputs: 1,
    defaultData: { value: 'c3' },
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
}

export interface NodeCategory {
  label: string;
  nodes: NodeOption[];
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
  return Object.entries(nodeDefinitions).map(([type, def]) => ({
    type,
    label: def.label,
  }));
}

/**
 * Get categorized node options (for ContextMenu)
 */
export function getNodeCategories(): NodeCategory[] {
  const categories = new Map<string, NodeOption[]>();

  // Group nodes by menuPath
  Object.entries(nodeDefinitions).forEach(([type, def]) => {
    const path = def.menuPath || 'Other';
    if (!categories.has(path)) {
      categories.set(path, []);
    }
    categories.get(path)!.push({ type, label: def.label });
  });

  // Sort categories by defined order
  return CATEGORY_ORDER.filter((cat) => categories.has(cat)).map((cat) => ({
    label: cat,
    nodes: categories.get(cat)!,
  }));
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
  return { ...sliderDefaults, ...(def.defaultData ?? {}) };
}
