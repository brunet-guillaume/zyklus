import type { NodeTypes } from '@xyflow/react';
import { SoundNode } from './SoundNode';
import { NoteNode } from './NoteNode';
import { FastNode } from './FastNode';
import { SlowNode } from './SlowNode';
import { RevNode } from './RevNode';
import { SupersawNode } from './SupersawNode';
import { SliderNode } from './SliderNode';
import { GainNode } from './GainNode';
import { ReverbNode } from './ReverbNode';
import { DelayNode } from './DelayNode';
import { LpfNode } from './LpfNode';
import { LpEnvNode } from './LpEnvNode';
import { RoomNode } from './RoomNode';
import { AttackNode } from './AttackNode';
import { SustainNode } from './SustainNode';
import { ReleaseNode } from './ReleaseNode';
import { PostgainNode } from './PostgainNode';
import { PcurveNode } from './PcurveNode';
import { PdecayNode } from './PdecayNode';
import { OutputNode } from './OutputNode';
import { PickNode } from './PickNode';
import { StructNode } from './StructNode';
import { ValueNode } from './ValueNode';
import { ArrayNode } from './ArrayNode';
import { CodeNode } from './CodeNode';

export const nodeTypes: NodeTypes = {
  sound: SoundNode,
  note: NoteNode,
  fast: FastNode,
  slow: SlowNode,
  rev: RevNode,
  supersaw: SupersawNode,
  slider: SliderNode,
  gain: GainNode,
  reverb: ReverbNode,
  delay: DelayNode,
  lpf: LpfNode,
  lpenv: LpEnvNode,
  room: RoomNode,
  attack: AttackNode,
  sustain: SustainNode,
  release: ReleaseNode,
  postgain: PostgainNode,
  pcurve: PcurveNode,
  pdecay: PdecayNode,
  output: OutputNode,
  pick: PickNode,
  struct: StructNode,
  value: ValueNode,
  array: ArrayNode,
  code: CodeNode,
};

export * from './types';
