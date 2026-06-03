interface HUDProps {
  score: number;
  hiScore: number;
  level: number;
  lives: number;
  showControls: boolean;
}

function JewelIcon() {
  return (
    <svg width="14" height="18" viewBox="0 0 14 18" style={{ display: 'inline-block', margin: '0 2px' }}>
      <polygon
        points="7,0 13,4 13,10 7,18 1,10 1,4"
        fill="#8B5CF6"
        stroke="#C4B5FD"
        strokeWidth="0.8"
      />
      <polygon points="7,0 11,5 7,7 3,5" fill="#C4B5FD" opacity="0.5" />
    </svg>
  );
}

export function HUD({ score, hiScore, level, lives, showControls }: HUDProps) {
  const padScore = String(score).padStart(6, '0');
  const padHi = String(hiScore).padStart(6, '0');
  const padLevel = String(level).padStart(2, '0');

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '80px',
      pointerEvents: 'none',
      zIndex: 10,
      padding: '8px 16px',
      userSelect: 'none',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px',
      }}>
        <span style={{ fontFamily: "'Courier New', monospace", fontSize: '14px', color: '#F5F3FF' }}>
          SCORE: {padScore}
        </span>
        <span style={{ fontFamily: "'Courier New', monospace", fontSize: '14px', color: '#F5F3FF' }}>
          LEVEL: {padLevel}
        </span>
        <span style={{ fontFamily: "'Courier New', monospace", fontSize: '14px', color: '#F5F3FF' }}>
          HI: {padHi}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
          <JewelIcon key={i} />
        ))}
      </div>

      {showControls && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Courier New', monospace",
          fontSize: '11px',
          color: 'rgba(245,243,255,0.5)',
          whiteSpace: 'nowrap',
        }}>
          Q/W/A/S or Arrow Keys to move &nbsp;|&nbsp; P / ESC to pause
        </div>
      )}
    </div>
  );
}
