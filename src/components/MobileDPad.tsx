import type { Direction } from '../game/entities/player';

const IS_TOUCH = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;

interface MobileDPadProps {
  onDirection: (dir: Direction) => void;
}

export function MobileDPad({ onDirection }: MobileDPadProps) {
  if (!IS_TOUCH) return null;

  function press(dir: Direction) {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      onDirection(dir);
    };
  }

  return (
    <div className="dpad-container">
      <div className="dpad-grid">
        <button className="dpad-btn" onPointerDown={press('UL')}>↖</button>
        <button className="dpad-btn" onPointerDown={press('UR')}>↗</button>
        <button className="dpad-btn" onPointerDown={press('DL')}>↙</button>
        <button className="dpad-btn" onPointerDown={press('DR')}>↘</button>
      </div>
    </div>
  );
}
