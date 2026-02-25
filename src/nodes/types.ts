import type { Node } from '@xyflow/react';

// === Base data types ===

// For nodes without any state
export type SimpleNodeData = Record<string, never>;

// For nodes with slider support (shared by 14 nodes)
export type SliderNodeData = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  isSlider?: boolean;
  isInput?: boolean;
  expanded?: boolean;
};

// === Special node data types ===

export type OutputNodeData = {
  isPlaying: boolean;
};

export type ValueNodeData = {
  value: string;
};

export type ArrayNodeData = {
  inputCount: number;
};

export type CodeNodeData = {
  code: string;
};

export type PickNodeData = {
  values: string;
  indices: string;
};

// Standalone slider (different from slider-enabled nodes)
export type StandaloneSliderNodeData = {
  min?: number;
  max?: number;
  value?: number;
  step?: number;
  expanded?: boolean;
};

// Variable nodes
export type VarNodeData = {
  name: string;
};

// Bank node
export type BankNodeData = {
  bank: string;
};

// === Node type definitions ===

// Simple nodes (no data)
export type SoundNode = Node<SimpleNodeData, 'sound'>;
export type NoteNode = Node<SimpleNodeData, 'note'>;
export type RevNode = Node<SimpleNodeData, 'rev'>;
export type SupersawNode = Node<SimpleNodeData, 'supersaw'>;
export type StructNode = Node<SimpleNodeData, 'struct'>;
export type PickNode = Node<SimpleNodeData, 'pick'>;

// Slider nodes (all use SliderNodeData)
export type FastNode = Node<SliderNodeData, 'fast'>;
export type SlowNode = Node<SliderNodeData, 'slow'>;
export type GainNode = Node<SliderNodeData, 'gain'>;
export type ReverbNode = Node<SliderNodeData, 'reverb'>;
export type DelayNode = Node<SliderNodeData, 'delay'>;
export type LpfNode = Node<SliderNodeData, 'lpf'>;
export type LpEnvNode = Node<SliderNodeData, 'lpenv'>;
export type RoomNode = Node<SliderNodeData, 'room'>;
export type AttackNode = Node<SliderNodeData, 'attack'>;
export type SustainNode = Node<SliderNodeData, 'sustain'>;
export type ReleaseNode = Node<SliderNodeData, 'release'>;
export type PostgainNode = Node<SliderNodeData, 'postgain'>;
export type PcurveNode = Node<SliderNodeData, 'pcurve'>;
export type PdecayNode = Node<SliderNodeData, 'pdecay'>;

// Special nodes
export type OutputNode = Node<OutputNodeData, 'output'>;
export type SliderNode = Node<StandaloneSliderNodeData, 'slider'>;
export type ValueNode = Node<ValueNodeData, 'value'>;
export type ArrayNode = Node<ArrayNodeData, 'array'>;
export type CodeNode = Node<CodeNodeData, 'code'>;

// Global nodes (standalone)
export type CpmNode = Node<SliderNodeData, 'cpm'>;

// Variable nodes
export type SetVarNode = Node<VarNodeData, 'setVar'>;
export type GetVarNode = Node<VarNodeData, 'getVar'>;

// Bank node
export type BankNode = Node<BankNodeData, 'bank'>;

// === Union type for all nodes ===

export type AppNode =
  // Simple nodes
  | SoundNode
  | NoteNode
  | RevNode
  | SupersawNode
  | StructNode
  | PickNode
  // Slider nodes
  | FastNode
  | SlowNode
  | GainNode
  | ReverbNode
  | DelayNode
  | LpfNode
  | LpEnvNode
  | RoomNode
  | AttackNode
  | SustainNode
  | ReleaseNode
  | PostgainNode
  | PcurveNode
  | PdecayNode
  // Special nodes
  | OutputNode
  | SliderNode
  | ValueNode
  | ArrayNode
  | CodeNode
  // Global nodes
  | CpmNode
  // Variable nodes
  | SetVarNode
  | GetVarNode
  // Bank node
  | BankNode;

// === Legacy exports for backwards compatibility ===
// (can be removed once all code is migrated)

export type SoundNodeData = SimpleNodeData;
export type NoteNodeData = SimpleNodeData;
export type RevNodeData = SimpleNodeData;
export type SupersawNodeData = SimpleNodeData;
export type StructNodeData = SimpleNodeData;
export type FastNodeData = SliderNodeData;
export type SlowNodeData = SliderNodeData;
export type GainNodeData = SliderNodeData;
export type ReverbNodeData = SliderNodeData;
export type DelayNodeData = SliderNodeData;
export type LpfNodeData = SliderNodeData;
export type LpEnvNodeData = SliderNodeData;
export type RoomNodeData = SliderNodeData;
export type AttackNodeData = SliderNodeData;
export type SustainNodeData = SliderNodeData;
export type ReleaseNodeData = SliderNodeData;
export type PostgainNodeData = SliderNodeData;
export type PcurveNodeData = SliderNodeData;
export type PdecayNodeData = SliderNodeData;
export type SliderNodeData2 = StandaloneSliderNodeData;
