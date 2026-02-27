import type { Edge } from '@xyflow/react';
import type { AppNode } from '../nodes/types';
import type { ValueStartMap } from '../audio/compiler';

// Centralized Window interface declarations
declare global {
  interface Window {
    // Audio engine (using any for Hap to avoid circular deps)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    __zyklusTrigger: (hap?: any) => void;

    // Compiler state
    __zyklusCpm?: number;
    __zyklusValueStarts?: ValueStartMap;
    __zyklusCompiledCode?: string;
    __zyklusVars?: Record<string, unknown>;

    // Editor state (for real-time access)
    __zyklusEdges?: Edge[];
    __zyklusNodes?: AppNode[];

    // Slider state (for real-time Strudel access)
    __zyklusSliders?: Record<string, number>;
    __zyklusSliderModes?: Record<string, boolean>;
    __zyklusInputModes?: Record<string, boolean>;
  }
}

export {};
