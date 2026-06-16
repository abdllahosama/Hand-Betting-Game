import { AnimatePresence } from 'framer-motion';
import { useGame } from './state/useGame';
import { Landing } from './components/Landing';
import { Game } from './components/Game';
import { GameOver } from './components/GameOver';

/**
 * App shell + screen router. The current screen is derived from game state by
 * `useGame`, so this component simply renders the matching screen and animates
 * transitions between them.
 */
export default function App() {
  const { screen, game, leaderboard, isHighScore, newGame, bet, exit, submitScore } = useGame();

  return (
    <div className="felt-bg min-h-screen w-full text-white">
      <AnimatePresence mode="wait">
        {screen === 'landing' && (
          <Landing key="landing" leaderboard={leaderboard} onNewGame={newGame} />
        )}

        {screen === 'playing' && game && (
          <Game key="playing" game={game} onBet={bet} onExit={exit} />
        )}

        {screen === 'gameover' && game && (
          <GameOver
            key="gameover"
            game={game}
            isHighScore={isHighScore}
            leaderboard={leaderboard}
            onSubmitScore={submitScore}
            onPlayAgain={newGame}
            onExit={exit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
