export function PauseScreen() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(10,10,26,0.75)',
      zIndex: 15,
      pointerEvents: 'none',
      userSelect: 'none',
    }}>
      <h2 style={{
        fontFamily: 'system-ui, sans-serif',
        fontSize: '48px',
        fontWeight: 900,
        color: '#F5F3FF',
        textShadow: '0 0 25px #8B5CF6',
        letterSpacing: '0.1em',
        marginBottom: '16px',
      }}>
        PAUSED
      </h2>
      <p style={{
        fontFamily: "'Courier New', monospace",
        fontSize: '14px',
        color: 'rgba(245,243,255,0.5)',
      }}>
        Press P or ESC to resume
      </p>
    </div>
  );
}
