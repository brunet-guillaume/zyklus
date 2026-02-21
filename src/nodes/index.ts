import type { NodeTypes } from '@xyflow/react';
import { PatternNode } from './PatternNode';
import { NoteNode } from './NoteNode';
import { TransformNode } from './TransformNode';
import { EffectNode } from './EffectNode';
import { OutputNode } from './OutputNode';

export const nodeTypes: NodeTypes = {
  pattern: PatternNode,
  note: NoteNode,
  transform: TransformNode,
  effect: EffectNode,
  output: OutputNode,
};

export * from './types';
