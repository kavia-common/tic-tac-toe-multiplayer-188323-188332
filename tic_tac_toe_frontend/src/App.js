import React, { useEffect, useMemo, useState, useCallback } from 'react';
import './App.css';
import { startGame, getGameState, makeMove } from './api';

// Simple components for the board and controls

function Square({ value, onClick, disabled, ariaLabel }) {
  return (
    <button
      className="ttt-square"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {value || ''}
    </button>
  );
}

function Board({ board, onCellClick, isMoveAllowed }) {
  return (
    <div className="ttt-board" role="grid" aria-label="Tic Tac Toe Board">
      {board.map((row, rIdx) => (
        <div className="ttt-row" role="row" key={`row-${rIdx}`}>
          {row.map((cell, cIdx) => (
            <Square
              key={`cell-${rIdx}-${cIdx}`}
              value={cell}
              ariaLabel={`Cell ${rIdx + 1}, ${cIdx + 1}, ${cell ? cell : 'empty'}`}
              onClick={() => onCellClick(rIdx, cIdx)}
              disabled={!isMoveAllowed(rIdx, cIdx)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  /**
   * React UI for playing Tic Tac Toe via the FastAPI backend.
   * Features:
   * - Start new game
   * - Make moves
   * - Poll backend for updates
   * - Show status and results
   */

  const [theme, setTheme] = useState('light');

  // Game state
  const [gameId, setGameId] = useState('');
  const [board, setBoard] = useState([
    ['', '', ''],
    ['', '', ''],
    ['', '', ''],
  ]);
  const [status, setStatus] = useState('idle'); // idle | in_progress | finished | error
  const [nextPlayer, setNextPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Setup theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Derived info text
  const statusText = useMemo(() => {
    if (status === 'idle') return 'Click "Start New Game" to begin.';
    if (status === 'in_progress') return `Next turn: ${nextPlayer}`;
    if (status === 'finished') {
      if (winner === 'draw' || winner === 'tie' || winner === null) return 'Game over: Draw!';
      return `Game over: ${winner} wins!`;
    }
    if (status === 'error') return 'Error communicating with server.';
    return '';
  }, [status, nextPlayer, winner]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Start a new game
  const handleStart = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await startGame('Player X', 'Player O');
      // Expecting fields: game_id, board, next_player, status, winner?
      setGameId(data.game_id || data.id || '');
      setBoard(data.board || [['', '', ''], ['', '', ''], ['', '', '']]);
      setNextPlayer(data.next_player || 'X');
      setStatus(data.status || 'in_progress');
      setWinner(typeof data.winner === 'undefined' ? null : data.winner);
    } catch (e) {
      setStatus('error');
      setErrorMsg(e?.message || 'Failed to start game');
    } finally {
      setLoading(false);
    }
  }, []);

  // Make a move
  const handleCellClick = useCallback(async (row, col) => {
    if (!gameId || status !== 'in_progress') return;
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await makeMove(gameId, row, col);
      setBoard(data.board || board);
      setNextPlayer(data.next_player || nextPlayer);
      setStatus(data.status || status);
      setWinner(typeof data.winner === 'undefined' ? null : data.winner);
    } catch (e) {
      // If backend rejects move, keep state and show error
      setErrorMsg(e?.message || 'Invalid move');
    } finally {
      setLoading(false);
    }
  }, [gameId, status, board, nextPlayer]);

  // Allow move only if cell empty and game is in progress
  const isMoveAllowed = useCallback((r, c) => {
    if (status !== 'in_progress') return false;
    return !board[r][c];
  }, [status, board]);

  // Polling for updates every 2s while in progress
  useEffect(() => {
    if (!gameId || status !== 'in_progress') return;
    let mounted = true;
    const id = setInterval(async () => {
      try {
        const data = await getGameState(gameId);
        if (!mounted) return;
        setBoard(data.board || board);
        setNextPlayer(data.next_player || nextPlayer);
        setStatus(data.status || status);
        setWinner(typeof data.winner === 'undefined' ? null : data.winner);
      } catch {
        // ignore transient errors during polling
      }
    }, 2000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, status]);

  return (
    <div className="App">
      <header className="App-header">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>

        <div className="ttt-container">
          <h1 className="ttt-title">Tic Tac Toe</h1>

          <div className="ttt-status" role="status" aria-live="polite">
            {statusText}
          </div>

          {errorMsg && (
            <div className="ttt-error" role="alert">
              {errorMsg}
            </div>
          )}

          <Board board={board} onCellClick={handleCellClick} isMoveAllowed={isMoveAllowed} />

          <div className="ttt-controls">
            <button className="ttt-btn" onClick={handleStart} disabled={loading}>
              {status === 'in_progress' ? 'Restart Game' : 'Start New Game'}
            </button>
            {gameId && (
              <span className="ttt-gameid" title="Game ID">
                Game: {gameId}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Inline minimal styles to extend template styles for the game */}
      <style>
        {`
        .ttt-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: var(--bg-primary);
          border-radius: 12px;
        }
        .ttt-title {
          margin: 0;
          font-size: 2rem;
          color: var(--text-primary);
        }
        .ttt-status {
          font-size: 1rem;
          color: var(--text-secondary);
        }
        .ttt-error {
          color: #EF4444;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 8px 12px;
          border-radius: 8px;
        }
        .ttt-board {
          display: grid;
          grid-template-rows: repeat(3, 1fr);
          gap: 8px;
          background: var(--bg-secondary);
          padding: 8px;
          border-radius: 12px;
        }
        .ttt-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .ttt-square {
          width: 80px;
          height: 80px;
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
          background: var(--bg-primary);
          border: 2px solid var(--border-color);
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.1s ease, background-color 0.2s ease, border-color 0.2s ease;
        }
        .ttt-square:hover:not(:disabled) {
          transform: translateY(-2px);
          border-color: var(--text-secondary);
        }
        .ttt-square:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .ttt-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 8px;
        }
        .ttt-btn {
          background-color: var(--button-bg);
          color: var(--button-text);
          border: none;
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .ttt-btn:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }
        .ttt-gameid {
          font-size: 0.9rem;
          color: var(--text-secondary);
          user-select: all;
        }

        @media (max-width: 480px) {
          .ttt-square {
            width: 70px;
            height: 70px;
            font-size: 1.8rem;
          }
        }
        `}
      </style>
    </div>
  );
}

export default App;
