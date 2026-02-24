import type { NodeTypes } from '@xyflow/react';
import { generatedNodes } from './createNode';

// Custom nodes that need special handling (kept separate for now)
import { SliderNode } from './SliderNode';
import { ValueNode } from './ValueNode';
import { ArrayNode } from './ArrayNode';
import { CodeNode } from './CodeNode';

export const nodeTypes: NodeTypes = {
  // Generated nodes from definitions
  ...generatedNodes,

  // Custom nodes with special logic
  slider: SliderNode,
  value: ValueNode,
  array: ArrayNode,
  code: CodeNode,
};

export * from './types';
export { nodeDefinitions, type NodeType } from './nodeDefinitions';
