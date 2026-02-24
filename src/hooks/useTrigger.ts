import { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    __zyklusCpm?: number;
  }
}

export interface TriggerEvent {
  nodeType?: string;
  note?: string | number | null;
  timing?: { start: number; end: number };
  location?: { start: number; end: number };
  hap?: unknown;
  duration: number;
}

export interface TriggerState {
  isTriggered: boolean;
  // All active trigger events (for multiple simultaneous triggers)
  activeEvents: TriggerEvent[];
}

export function useTrigger(nodeId: string): TriggerState {
  const [state, setState] = useState<TriggerState>({
    isTriggered: false,
    activeEvents: [],
  });
  const activeEventsRef = useRef<
    Map<string, { event: TriggerEvent; timeout: number }>
  >(new Map());

  useEffect(() => {
    const activeEvents = activeEventsRef.current;

    const handleTrigger = (event: Event) => {
      const customEvent = event as CustomEvent<{
        nodeId: string;
        nodeType?: string;
        note?: string | number | null;
        timing?: { start: number; end: number };
        location?: { start: number; end: number };
        hap?: unknown;
      }>;

      if (customEvent.detail?.nodeId === nodeId) {
        const timing = customEvent.detail.timing;

        // Calculate duration in ms from timing (default 60 cpm = 1 cycle per second)
        const cpm = window.__zyklusCpm ?? 60;
        const duration = timing
          ? (timing.end - timing.start) * (60000 / cpm)
          : 150;

        const triggerEvent: TriggerEvent = {
          nodeType: customEvent.detail.nodeType,
          note: customEvent.detail.note,
          timing,
          location: customEvent.detail.location,
          hap: customEvent.detail.hap,
          duration,
        };

        // Create a unique key for this trigger (based on note, timing, and location)
        const loc = triggerEvent.location;
        const key = `${triggerEvent.note}-${timing?.start ?? Date.now()}-${loc?.start}-${loc?.end}`;

        // Clear existing timeout for this key if any
        const existing = activeEvents.get(key);
        if (existing) {
          clearTimeout(existing.timeout);
        }

        // Add this event to active set
        activeEvents.set(key, {
          event: triggerEvent,
          timeout: window.setTimeout(() => {
            activeEvents.delete(key);
            const allEvents = Array.from(activeEvents.values()).map(
              (v) => v.event
            );
            setState({
              isTriggered: allEvents.length > 0,
              activeEvents: allEvents,
            });
          }, duration),
        });

        const allEvents = Array.from(activeEvents.values()).map((v) => v.event);
        setState({ isTriggered: true, activeEvents: allEvents });
      }
    };

    window.addEventListener('zyklus:trigger', handleTrigger);
    return () => {
      window.removeEventListener('zyklus:trigger', handleTrigger);
      activeEvents.forEach((v) => clearTimeout(v.timeout));
      activeEvents.clear();
    };
  }, [nodeId]);

  return state;
}
