import type { NodeTypes } from '@xyflow/react';
import { generatedNodes } from './createNode';

// All nodes are now generated from definitions
export const nodeTypes: NodeTypes = generatedNodes;

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
