import { useEffect, useState } from 'react';

interface IntroScreenProps {
  onDismiss: () => void;
}

export function IntroScreen({ onDismiss }: IntroScreenProps) {
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setBlink(b => !b), 600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onKey() { onDismiss(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  return (
    <div
      onClick={onDismiss}
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
      <div style={{
        fontFamily: "'Courier New', monospace",
        fontSize: '42px',
        fontWeight: 'bold',
        color: '#A78BFA',
        textShadow: '0 0 20px #8B5CF6',
        opacity: blink ? 1 : 0,
        transition: 'opacity 0.1s',
        marginBottom: '24px',
      }}>
        PRESS ANY KEY
      </div>

      <img
        src="/ibd-screen.png"
        alt="Intent Based Development flow"
        style={{
          maxWidth: '85%',
          maxHeight: '75vh',
          borderRadius: '12px',
          boxShadow: '0 0 40px rgba(139,92,246,0.4)',
        }}
      />
    </div>
  );
}
