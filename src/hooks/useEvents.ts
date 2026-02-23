import { useEffect, useState, useMemo } from 'react';

export interface EventLocation {
  start: number;
  end: number;
  note?: string | number | null;
}

/**
 * Hook to listen for zyklus:events and return event locations
 */
export function useEvents(): EventLocation[] {
  const [events, setEvents] = useState<EventLocation[]>([]);

  useEffect(() => {
    const handleEvents = (event: Event) => {
      const customEvent = event as CustomEvent<{
        locations: Array<{
          start: number;
          end: number;
          note?: string | number | null;
        }>;
      }>;
      setEvents(customEvent.detail?.locations ?? []);
    };

    window.addEventListener('zyklus:events', handleEvents);
    return () => window.removeEventListener('zyklus:events', handleEvents);
  }, []);

  return events;
}

/**
 * Hook to get unique events (one per note)
 */
export function useUniqueEvents(): EventLocation[] {
  const events = useEvents();

  const uniqueEvents = useMemo(() => {
    const seen = new Set<string>();
    return events.filter((e) => {
      const key = String(e.note ?? `${e.start}-${e.end}`);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [events]);

  return uniqueEvents;
}
