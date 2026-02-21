import type { Node } from '@xyflow/react';

export type PatternNodeData = {
  pattern: string;
};

export type TransformNodeData = {
  transform: 'fast' | 'slow' | 'rev' | 'stack';
  value?: number;
};

export type EffectNodeData = {
  effect: 'reverb' | 'delay' | 'gain';
  value: number;
};

export type OutputNodeData = {
  isPlaying: boolean;
};

export type PatternNode = Node<PatternNodeData, 'pattern'>;
export type TransformNode = Node<TransformNodeData, 'transform'>;
export type EffectNode = Node<EffectNodeData, 'effect'>;
export type OutputNode = Node<OutputNodeData, 'output'>;

export type AppNode = PatternNode | TransformNode | EffectNode | OutputNode;
