import type { Node } from '@xyflow/react';

export type PatternNodeData = {
  pattern: string;
};

export type NoteNodeData = {
  notes: string;
};

export type TransformNodeData = {
  transform: 'fast' | 'slow' | 'rev';
  value?: number;
};

export type EffectNodeData = {
  effect: 'room' | 'delay' | 'gain' | 'lpf';
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

export type PatternNode = Node<PatternNodeData, 'pattern'>;
export type NoteNode = Node<NoteNodeData, 'note'>;
export type TransformNode = Node<TransformNodeData, 'transform'>;
export type EffectNode = Node<EffectNodeData, 'effect'>;
export type OutputNode = Node<OutputNodeData, 'output'>;
export type PickNode = Node<PickNodeData, 'pick'>;
export type ValueNode = Node<ValueNodeData, 'value'>;
export type ArrayNode = Node<ArrayNodeData, 'array'>;

export type AppNode =
  | PatternNode
  | NoteNode
  | TransformNode
  | EffectNode
  | OutputNode
  | PickNode
  | ValueNode
  | ArrayNode;
