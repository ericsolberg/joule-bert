import { useEffect, useState, useMemo } from 'react';

interface StartScreenProps {
  onStart: () => void;
  hiScore: number;
}

export function StartScreen({ onStart, hiScore }: StartScreenProps) {
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setBlink(b => !b), 600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onKey() { onStart(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStart]);

  const stars = useMemo(() => {
    return Array.from({ length: 80 }, (_, i) => ({
      x: (Math.sin(i * 7.3) * 0.5 + 0.5) * 100,
      y: (Math.cos(i * 3.7) * 0.5 + 0.5) * 100,
      size: 0.5 + (i % 3) * 0.5,
      opacity: 0.2 + (i % 5) * 0.1,
    }));
  }, []);

  return (
    <div
      onClick={onStart}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A0A1A',
        zIndex: 20,
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {/* Starfield */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {stars.map((s, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            borderRadius: '50%',
            background: '#fff',
            opacity: s.opacity,
          }} />
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <img
          src="/joule.png"
          alt="Joule"
          width={82}
          height={100}
          style={{ marginBottom: '16px', filter: 'drop-shadow(0 0 24px #8B5CF6)' }}
        />

        <h1 style={{
          fontFamily: 'system-ui, sans-serif',
          fontSize: '64px',
          fontWeight: 900,
          letterSpacing: '0.05em',
          color: '#F5F3FF',
          textShadow: '0 0 40px #8B5CF6, 0 0 80px rgba(139,92,246,0.4)',
          marginBottom: '8px',
          lineHeight: 1,
        }}>
          JOULE*BERT
        </h1>

        <p style={{
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
          fontStyle: 'italic',
          color: 'rgba(245,243,255,0.6)',
          marginBottom: '32px',
        }}>
          A Q*Bert love letter for Joule Studio
        </p>

        {hiScore > 0 && (
          <p style={{
            fontFamily: "'Courier New', monospace",
            fontSize: '14px',
            color: '#2DD4BF',
            marginBottom: '24px',
          }}>
            HI-SCORE: {String(hiScore).padStart(6, '0')}
          </p>
        )}

        <div style={{
          fontFamily: "'Courier New', monospace",
          fontSize: '18px',
          color: '#A78BFA',
          opacity: blink ? 1 : 0,
          transition: 'opacity 0.1s',
        }}>
          PRESS ANY KEY TO PLAY
        </div>

        <p style={{
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          color: 'rgba(245,243,255,0.3)',
          marginTop: '48px',
        }}>
          Q/W/A/S or Arrow Keys · P to Pause
        </p>
      </div>
    </div>
  );
}
