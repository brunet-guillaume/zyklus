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

export type PatternNode = Node<PatternNodeData, 'pattern'>;
export type NoteNode = Node<NoteNodeData, 'note'>;
export type TransformNode = Node<TransformNodeData, 'transform'>;
export type EffectNode = Node<EffectNodeData, 'effect'>;
export type OutputNode = Node<OutputNodeData, 'output'>;

export type AppNode =
  | PatternNode
  | NoteNode
  | TransformNode
  | EffectNode
  | OutputNode;
