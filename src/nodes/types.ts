import type { Node } from '@xyflow/react';
import type { nodeDefinitions } from './nodeDefinitions';

// === Base data types ===

// For nodes without any state
export type SimpleNodeData = Record<string, never>;

// For nodes with slider support (shared by many nodes)
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

// Scale node
export type ScaleNodeData = {
  scale: string;
};

// Distort node
export type DistortNodeData = {
  amount: number;
  postgain: number;
  mode: string;
};

// === Data type mapping ===
// Maps DataTypeKey to actual data types

export type DataTypeMap = {
  simple: SimpleNodeData;
  slider: SliderNodeData;
  output: OutputNodeData;
  value: ValueNodeData;
  array: ArrayNodeData;
  code: CodeNodeData;
  var: VarNodeData;
  bank: BankNodeData;
  scale: ScaleNodeData;
  distort: DistortNodeData;
  standaloneSlider: StandaloneSliderNodeData;
};

// === Auto-generated node types from definitions ===

// Extract node types from definitions
export type NodeType = keyof typeof nodeDefinitions;

// Helper type to get data type for a node type
type NodeDataType<T extends NodeType> =
  DataTypeMap[(typeof nodeDefinitions)[T]['dataType']];

// Generate individual node types
export type GeneratedNode<T extends NodeType> = Node<NodeDataType<T>, T>;

// === Union type for all nodes (auto-generated) ===

export type AppNode = {
  [K in NodeType]: Node<NodeDataType<K>, K>;
}[NodeType];

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

// Legacy individual node types (kept for compatibility)
export type SoundNode = GeneratedNode<'sound'>;
export type NoteNode = GeneratedNode<'note'>;
export type RevNode = GeneratedNode<'rev'>;
export type SupersawNode = GeneratedNode<'supersaw'>;
export type StructNode = GeneratedNode<'struct'>;
export type PickNode = GeneratedNode<'pick'>;
export type RibbonNode = GeneratedNode<'ribbon'>;
export type FastNode = GeneratedNode<'fast'>;
export type SlowNode = GeneratedNode<'slow'>;
export type GainNode = GeneratedNode<'gain'>;
export type ReverbNode = GeneratedNode<'reverb'>;
export type DelayNode = GeneratedNode<'delay'>;
export type LpfNode = GeneratedNode<'lpf'>;
export type LpEnvNode = GeneratedNode<'lpenv'>;
export type LpqNode = GeneratedNode<'lpq'>;
export type LpaNode = GeneratedNode<'lpa'>;
export type LpsNode = GeneratedNode<'lps'>;
export type LprNode = GeneratedNode<'lpr'>;
export type RoomNode = GeneratedNode<'room'>;
export type AttackNode = GeneratedNode<'attack'>;
export type SustainNode = GeneratedNode<'sustain'>;
export type ReleaseNode = GeneratedNode<'release'>;
export type PostgainNode = GeneratedNode<'postgain'>;
export type PcurveNode = GeneratedNode<'pcurve'>;
export type PdecayNode = GeneratedNode<'pdecay'>;
export type IrandNode = GeneratedNode<'irand'>;
export type SubNode = GeneratedNode<'sub'>;
export type SegNode = GeneratedNode<'seg'>;
export type ScaleNode = GeneratedNode<'scale'>;
export type DistortNode = GeneratedNode<'distort'>;
export type OrbitNode = GeneratedNode<'orbit'>;
export type DuckorbitNode = GeneratedNode<'duckorbit'>;
export type DuckattackNode = GeneratedNode<'duckattack'>;
export type DuckdepthNode = GeneratedNode<'duckdepth'>;
export type OutputNode = GeneratedNode<'output'>;
export type SliderNode = GeneratedNode<'slider'>;
export type ValueNode = GeneratedNode<'value'>;
export type ArrayNode = GeneratedNode<'array'>;
export type CodeNode = GeneratedNode<'code'>;
export type CpmNode = GeneratedNode<'cpm'>;
export type SetVarNode = GeneratedNode<'setVar'>;
export type GetVarNode = GeneratedNode<'getVar'>;
export type BankNode = GeneratedNode<'bank'>;
