import { useEffect, useRef, useCallback } from 'react';
import type { Direction } from '../game/entities/player';

const KEY_DIRECTION_MAP: Record<string, Direction> = {
  KeyQ: 'UL',
  KeyW: 'UR',
  KeyA: 'DL',
  KeyS: 'DR',
  ArrowLeft: 'UL',
  ArrowUp: 'UR',
  ArrowDown: 'DL',
  ArrowRight: 'DR',
};

interface GameInput {
  consumeDirection: () => Direction | null;
  consumePause: () => boolean;
}

export function useGameInput(): GameInput {
  const directionQueue = useRef<Direction | null>(null);
  const pauseQueued = useRef(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code.startsWith('Arrow')) e.preventDefault();

      const dir = KEY_DIRECTION_MAP[e.code];
      if (dir) {
        directionQueue.current = dir;
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        pauseQueued.current = true;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const consumeDirection = useCallback((): Direction | null => {
    const dir = directionQueue.current;
    directionQueue.current = null;
    return dir;
  }, []);

  const consumePause = useCallback((): boolean => {
    const p = pauseQueued.current;
    pauseQueued.current = false;
    return p;
  }, []);

  return { consumeDirection, consumePause };
}
