import type { NodeTypes } from '@xyflow/react';
import { generatedNodes } from './createNode';

// Custom nodes that need special handling (kept separate for now)
import { SliderNode } from './SliderNode';
import { ValueNode } from './ValueNode';
import { ArrayNode } from './ArrayNode';
import { CodeNode } from './CodeNode';
import { SetVarNode, GetVarNode } from './VarNodes';
import { BankNode } from './BankNode';
import { ScaleNode } from './ScaleNode';
import { DistortNode } from './DistortNode';

export const nodeTypes: NodeTypes = {
  // Generated nodes from definitions
  ...generatedNodes,

  // Custom nodes with special logic
  slider: SliderNode,
  value: ValueNode,
  array: ArrayNode,
  code: CodeNode,
  setVar: SetVarNode,
  getVar: GetVarNode,
  bank: BankNode,
  scale: ScaleNode,
  distort: DistortNode,
};

export * from './types';
export { nodeDefinitions, type NodeType } from './nodeDefinitions';
