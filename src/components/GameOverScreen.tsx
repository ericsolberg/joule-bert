import { useEffect } from 'react';

interface GameOverScreenProps {
  score: number;
  hiScore: number;
  onRestart: () => void;
}

export function GameOverScreen({ score, hiScore, onRestart }: GameOverScreenProps) {
  const isNewHigh = score >= hiScore && score > 0;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Enter' || e.code === 'Space') onRestart();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onRestart]);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(10,10,26,0.92)',
      zIndex: 20,
      userSelect: 'none',
    }}>
      <h1 style={{
        fontFamily: 'system-ui, sans-serif',
        fontSize: '56px',
        fontWeight: 900,
        color: '#F5F3FF',
        textShadow: '0 0 30px #DC2626',
        marginBottom: '24px',
        letterSpacing: '0.08em',
      }}>
        GAME OVER
      </h1>

      {isNewHigh && (
        <div style={{
          fontFamily: 'system-ui, sans-serif',
          fontSize: '20px',
          color: '#2DD4BF',
          marginBottom: '16px',
          textShadow: '0 0 20px #2DD4BF',
        }}>
          ✦ NEW HIGH SCORE! ✦
        </div>
      )}

      <div style={{
        fontFamily: "'Courier New', monospace",
        fontSize: '22px',
        color: '#A78BFA',
        marginBottom: '8px',
      }}>
        SCORE: {String(score).padStart(6, '0')}
      </div>

      <div style={{
        fontFamily: "'Courier New', monospace",
        fontSize: '16px',
        color: 'rgba(245,243,255,0.5)',
        marginBottom: '48px',
      }}>
        HI: {String(Math.max(score, hiScore)).padStart(6, '0')}
      </div>

      <button
        onClick={onRestart}
        style={{
          fontFamily: 'system-ui, sans-serif',
          fontSize: '20px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: '#0A0A1A',
          background: '#A78BFA',
          border: 'none',
          padding: '14px 40px',
          cursor: 'pointer',
          borderRadius: '4px',
          boxShadow: '0 0 20px rgba(167,139,250,0.5)',
        }}
      >
        PLAY AGAIN
      </button>

      <p style={{
        fontFamily: "'Courier New', monospace",
        fontSize: '12px',
        color: 'rgba(245,243,255,0.3)',
        marginTop: '16px',
      }}>
        or press Enter / Space
      </p>
    </div>
  );
}
