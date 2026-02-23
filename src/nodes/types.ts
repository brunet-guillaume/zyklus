import type { Node } from '@xyflow/react';

export type SoundNodeData = Record<string, never>;

export type NoteNodeData = Record<string, never>;

export type FastNodeData = {
  value: number;
};

export type SlowNodeData = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  isSlider?: boolean;
  expanded?: boolean;
};

export type RevNodeData = Record<string, never>;

export type SupersawNodeData = Record<string, never>;

export type SliderNodeData = {
  min?: number;
  max?: number;
  value?: number;
  step?: number;
};

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
  min?: number;
  max?: number;
  step?: number;
  isSlider?: boolean;
  expanded?: boolean;
};

export type LpEnvNodeData = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  isSlider?: boolean;
  expanded?: boolean;
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

export type SoundNode = Node<SoundNodeData, 'sound'>;
export type NoteNode = Node<NoteNodeData, 'note'>;
export type FastNode = Node<FastNodeData, 'fast'>;
export type SlowNode = Node<SlowNodeData, 'slow'>;
export type RevNode = Node<RevNodeData, 'rev'>;
export type SupersawNode = Node<SupersawNodeData, 'supersaw'>;
export type SliderNode = Node<SliderNodeData, 'slider'>;
export type GainNode = Node<GainNodeData, 'gain'>;
export type ReverbNode = Node<ReverbNodeData, 'reverb'>;
export type DelayNode = Node<DelayNodeData, 'delay'>;
export type LpfNode = Node<LpfNodeData, 'lpf'>;
export type LpEnvNode = Node<LpEnvNodeData, 'lpenv'>;
export type OutputNode = Node<OutputNodeData, 'output'>;
export type PickNode = Node<PickNodeData, 'pick'>;
export type ValueNode = Node<ValueNodeData, 'value'>;
export type ArrayNode = Node<ArrayNodeData, 'array'>;
export type CodeNode = Node<CodeNodeData, 'code'>;

export type AppNode =
  | SoundNode
  | NoteNode
  | FastNode
  | SlowNode
  | RevNode
  | SupersawNode
  | SliderNode
  | GainNode
  | ReverbNode
  | DelayNode
  | LpfNode
  | LpEnvNode
  | OutputNode
  | PickNode
  | ValueNode
  | ArrayNode
  | CodeNode;
