import type { NodeTypes } from '@xyflow/react';
import { generatedNodes } from './createNode';

// Custom nodes with complex UI that can't be generated
import { ValueNode } from './ValueNode';
import { DistortNode } from './DistortNode';

export const nodeTypes: NodeTypes = {
  // Generated nodes from definitions (includes slider, array, code, setVar, getVar, bank, scale)
  ...generatedNodes,

  // Custom nodes with complex UI
  value: ValueNode,
  distort: DistortNode,
};

export * from './types';
export {
  nodeDefinitions,
  getDefaultData,
  getNodeOptions,
  getNodeCategories,
  getShortcutMap,
  type NodeType,
  type NodeOption,
  type NodeCategory,
} from './nodeDefinitions';
