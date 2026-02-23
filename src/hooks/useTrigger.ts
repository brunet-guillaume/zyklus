import { useState, useEffect, useRef } from 'react';

export interface TriggerState {
  isTriggered: boolean;
  triggeredType?: string;
  note?: string | number | null;
  timing?: { start: number; end: number };
}

export function useTrigger(nodeId: string): TriggerState {
  const [state, setState] = useState<TriggerState>({ isTriggered: false });
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleTrigger = (event: Event) => {
      const customEvent = event as CustomEvent<{
        nodeId: string;
        nodeType?: string;
        note?: string | number | null;
        timing?: { start: number; end: number };
      }>;

      if (customEvent.detail?.nodeId === nodeId) {
        // Clear previous timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        setState({
          isTriggered: true,
          triggeredType: customEvent.detail.nodeType,
          note: customEvent.detail.note,
          timing: customEvent.detail.timing,
        });

        // Reset after animation duration
        timeoutRef.current = window.setTimeout(() => {
          setState({ isTriggered: false });
        }, 150);
      }
    };

    window.addEventListener('zyklus:trigger', handleTrigger);
    return () => {
      window.removeEventListener('zyklus:trigger', handleTrigger);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [nodeId]);

  return state;
}
