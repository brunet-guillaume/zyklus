import type { NodeTypes } from '@xyflow/react';
import { PatternNode } from './PatternNode';
import { NoteNode } from './NoteNode';
import { TransformNode } from './TransformNode';
import { EffectNode } from './EffectNode';
import { OutputNode } from './OutputNode';
import { PickNode } from './PickNode';
import { ValueNode } from './ValueNode';
import { ArrayNode } from './ArrayNode';

export const nodeTypes: NodeTypes = {
  pattern: PatternNode,
  note: NoteNode,
  transform: TransformNode,
  effect: EffectNode,
  output: OutputNode,
  pick: PickNode,
  value: ValueNode,
  array: ArrayNode,
};

export * from './types';
