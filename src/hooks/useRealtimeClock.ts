import { useState, useEffect } from 'react';

/**
 * Custom hook for realtime clock display (updates every second)
 */
export function useRealtimeClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return now;
}
