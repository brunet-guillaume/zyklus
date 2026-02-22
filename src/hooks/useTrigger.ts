import { useState, useEffect, useCallback, useRef } from 'react';

export interface TriggerLocation {
  start: number;
  end: number;
}

export interface TriggerState {
  isTriggered: boolean;
  locations?: TriggerLocation[];
  triggeredType?: string;
  triggeredChildId?: string;
}

export function useTrigger(nodeId: string): TriggerState {
  const [state, setState] = useState<TriggerState>({ isTriggered: false });
  const timeoutRef = useRef<number | null>(null);

  const trigger = useCallback(
    (
      locations?: TriggerLocation[],
      triggeredType?: string,
      triggeredChildId?: string
    ) => {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setState({
        isTriggered: true,
        locations,
        triggeredType,
        triggeredChildId,
      });

      // Reset after animation duration
      timeoutRef.current = window.setTimeout(() => {
        setState({ isTriggered: false });
      }, 150);
    },
    []
  );

  useEffect(() => {
    const handleTrigger = (event: Event) => {
      const customEvent = event as CustomEvent<{
        nodeId: string;
        locations?: TriggerLocation[];
        triggeredType?: string;
        triggeredChildId?: string;
      }>;
      if (customEvent.detail?.nodeId === nodeId) {
        trigger(
          customEvent.detail.locations,
          customEvent.detail.triggeredType,
          customEvent.detail.triggeredChildId
        );
      }
    };

    window.addEventListener('zyklus:trigger', handleTrigger);
    return () => {
      window.removeEventListener('zyklus:trigger', handleTrigger);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [trigger, nodeId]);

  return state;
}
