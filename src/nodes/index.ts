import type { NodeTypes } from '@xyflow/react';
import { PatternNode } from './PatternNode';
import { TransformNode } from './TransformNode';
import { EffectNode } from './EffectNode';
import { OutputNode } from './OutputNode';

export const nodeTypes: NodeTypes = {
  pattern: PatternNode,
  transform: TransformNode,
  effect: EffectNode,
  output: OutputNode,
};

export * from './types';
