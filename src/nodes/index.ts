import type { NodeTypes } from '@xyflow/react';
import { SoundNode } from './SoundNode';
import { NoteNode } from './NoteNode';
import { FastNode } from './FastNode';
import { SlowNode } from './SlowNode';
import { RevNode } from './RevNode';
import { GainNode } from './GainNode';
import { ReverbNode } from './ReverbNode';
import { DelayNode } from './DelayNode';
import { LpfNode } from './LpfNode';
import { OutputNode } from './OutputNode';
import { PickNode } from './PickNode';
import { ValueNode } from './ValueNode';
import { ArrayNode } from './ArrayNode';
import { CodeNode } from './CodeNode';

export const nodeTypes: NodeTypes = {
  sound: SoundNode,
  note: NoteNode,
  fast: FastNode,
  slow: SlowNode,
  rev: RevNode,
  gain: GainNode,
  reverb: ReverbNode,
  delay: DelayNode,
  lpf: LpfNode,
  output: OutputNode,
  pick: PickNode,
  value: ValueNode,
  array: ArrayNode,
  code: CodeNode,
};

export * from './types';
