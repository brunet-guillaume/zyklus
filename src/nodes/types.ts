import type { Node } from '@xyflow/react';
import type { nodeDefinitions } from './nodeDefinitions';

// === Base data types ===

// All nodes have enabled property
type BaseNodeData = {
  enabled?: boolean;
};

// For nodes without any state
export type SimpleNodeData = BaseNodeData;

// For nodes with slider support (shared by many nodes)
export type SliderNodeData = BaseNodeData & {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  isSlider?: boolean;
  isInput?: boolean;
  expanded?: boolean;
};

// === Special node data types ===

export type OutputNodeData = BaseNodeData & {
  isPlaying: boolean;
};

export type ValueNodeData = BaseNodeData & {
  value: string;
};

export type ArrayNodeData = BaseNodeData & {
  inputCount: number;
};

export type CodeNodeData = BaseNodeData & {
  code: string;
};

export type PickNodeData = BaseNodeData & {
  values: string;
  indices: string;
};

// Standalone slider (different from slider-enabled nodes)
export type StandaloneSliderNodeData = BaseNodeData & {
  min?: number;
  max?: number;
  value?: number;
  step?: number;
  expanded?: boolean;
};

// Variable nodes
export type VarNodeData = BaseNodeData & {
  name: string;
};

// Bank node
export type BankNodeData = BaseNodeData & {
  bank: string;
};

// Scale node
export type ScaleNodeData = BaseNodeData & {
  scale: string;
};

// Distort node
export type DistortNodeData = BaseNodeData & {
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
