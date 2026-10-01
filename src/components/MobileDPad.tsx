import './MobileDPad.css';
import type { Direction } from '../game/entities/player';

const isTouchDevice = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;

const BUTTONS: { dir: Direction; label: string }[] = [
  { dir: 'UL', label: '↖' },
  { dir: 'UR', label: '↗' },
  { dir: 'DL', label: '↙' },
  { dir: 'DR', label: '↘' },
];

interface MobileDPadProps {
  onDirection: (dir: Direction) => void;
}

export function MobileDPad({ onDirection }: MobileDPadProps) {
  if (!isTouchDevice) return null;

  return (
    <div className="dpad">
      {BUTTONS.map(({ dir, label }) => (
        <button
          key={dir}
          className="dpad-btn"
          onPointerDown={(e) => {
            e.preventDefault();
            onDirection(dir);
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
