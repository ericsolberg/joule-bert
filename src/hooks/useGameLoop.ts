import { useEffect, useRef } from 'react';

export function useGameLoop(
  update: (deltaMs: number, now: number) => void,
  render: () => void,
  active: boolean
) {
  const prevTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);
  const updateRef = useRef(update);
  const renderRef = useRef(render);

  updateRef.current = update;
  renderRef.current = render;

  useEffect(() => {
    if (!active) return;

    function tick(now: number) {
      const prev = prevTimeRef.current ?? now;
      const delta = Math.min(now - prev, 100);
      prevTimeRef.current = now;

      updateRef.current(delta, now);
      renderRef.current();

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      prevTimeRef.current = null;
    };
  }, [active]);
}
