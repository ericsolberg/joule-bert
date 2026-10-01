import { useState, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { StartScreen } from './components/StartScreen';
import { IntroScreen } from './components/IntroScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { useLocalStorage } from './hooks/useLocalStorage';
import { soundManager } from './audio/soundManager';

type AppPhase = 'intro' | 'title' | 'playing' | 'gameover';

export default function App() {
  const [appPhase, setAppPhase] = useState<AppPhase>('intro');
  const [finalScore, setFinalScore] = useState(0);
  const [hiScore, setHiScoreState] = useLocalStorage<number>('joule-bert:hiscore', 0);
  const [gameKey, setGameKey] = useState(0);

  const handleStart = useCallback(() => {
    soundManager.unlock();
    setAppPhase('playing');
  }, []);

  const handleGameOver = useCallback((score: number) => {
    setFinalScore(score);
    if (score > hiScore) {
      setHiScoreState(score);
    }
    setAppPhase('gameover');
  }, [hiScore, setHiScoreState]);

  const handleRestart = useCallback(() => {
    soundManager.unlock();
    setGameKey(k => k + 1);
    setAppPhase('playing');
  }, []);

  const handleHiScoreUpdate = useCallback((score: number) => {
    if (score > hiScore) {
      setHiScoreState(score);
    }
  }, [hiScore, setHiScoreState]);

  return (
    <div className="app-root">
      {appPhase === 'intro' && (
        <IntroScreen onDismiss={() => { soundManager.unlock(); setAppPhase('title'); }} />
      )}

      {appPhase === 'title' && (
        <StartScreen onStart={handleStart} hiScore={hiScore} />
      )}

      {appPhase === 'playing' && (
        <GameCanvas
          key={gameKey}
          hiScore={hiScore}
          onHiScoreUpdate={handleHiScoreUpdate}
          onGameOver={handleGameOver}
        />
      )}

      {appPhase === 'gameover' && (
        <GameOverScreen
          score={finalScore}
          hiScore={Math.max(finalScore, hiScore)}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
