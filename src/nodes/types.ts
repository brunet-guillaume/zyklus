import type { Node } from '@xyflow/react';

export type SoundNodeData = Record<string, never>;

export type NoteNodeData = Record<string, never>;

export type FastNodeData = {
  value: number;
};

export type SlowNodeData = {
  value: number;
};

export type RevNodeData = Record<string, never>;

export type GainNodeData = {
  value: number;
};

export type ReverbNodeData = {
  value: number;
};

export type DelayNodeData = {
  value: number;
};

export type LpfNodeData = {
  value: number;
};

export type OutputNodeData = {
  isPlaying: boolean;
};

export type PickNodeData = {
  values: string; // comma-separated values (e.g., "c3, e3, g3, c4")
  indices: string; // index pattern (e.g., "<0 1 2 3>")
};

export type ValueNodeData = {
  value: string; // single value (e.g., "c3" or "bd")
};

export type ArrayNodeData = {
  inputCount: number; // number of input handles
};

export type CodeNodeData = {
  code: string; // raw Strudel code
};

export type GroupNodeData = {
  label: string;
  expanded: boolean;
  inputCount?: number;
  outputCount?: number;
  // Stored bounds for centering collapsed node
  expandedWidth?: number;
  expandedHeight?: number;
  expandedOffsetX?: number;
  expandedOffsetY?: number;
  // Child node info for badges
  childTypes?: string[];
  childIds?: string[];
  // IDs of children connected to external outputs (for trigger color)
  outputChildIds?: string[];
  // Map input handle index to child type (for handle colors)
  inputHandleTypes?: string[];
  // Map input handle index to child ID (for trigger matching)
  inputHandleChildIds?: string[];
  // Map output handle index to child type (for edge colors and handle colors)
  outputHandleTypes?: string[];
  // Map output handle index to child ID (for trigger matching)
  outputHandleChildIds?: string[];
  // Map edge ID to child ID (for robust trigger matching)
  edgeToChildMap?: Record<string, string>;
  // Map edge ID to child type (for edge colors)
  edgeToTypeMap?: Record<string, string>;
};

export type SoundNode = Node<SoundNodeData, 'sound'>;
export type NoteNode = Node<NoteNodeData, 'note'>;
export type FastNode = Node<FastNodeData, 'fast'>;
export type SlowNode = Node<SlowNodeData, 'slow'>;
export type RevNode = Node<RevNodeData, 'rev'>;
export type GainNode = Node<GainNodeData, 'gain'>;
export type ReverbNode = Node<ReverbNodeData, 'reverb'>;
export type DelayNode = Node<DelayNodeData, 'delay'>;
export type LpfNode = Node<LpfNodeData, 'lpf'>;
export type OutputNode = Node<OutputNodeData, 'output'>;
export type PickNode = Node<PickNodeData, 'pick'>;
export type ValueNode = Node<ValueNodeData, 'value'>;
export type ArrayNode = Node<ArrayNodeData, 'array'>;
export type CodeNode = Node<CodeNodeData, 'code'>;
export type GroupNode = Node<GroupNodeData, 'group'>;

export type AppNode =
  | SoundNode
  | NoteNode
  | FastNode
  | SlowNode
  | RevNode
  | GainNode
  | ReverbNode
  | DelayNode
  | LpfNode
  | OutputNode
  | PickNode
  | ValueNode
  | ArrayNode
  | CodeNode
  | GroupNode;
