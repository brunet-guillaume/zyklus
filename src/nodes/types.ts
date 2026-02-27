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

// Export specific node types used by custom components
export type ValueNode = GeneratedNode<'value'>;
export type DistortNode = GeneratedNode<'distort'>;
