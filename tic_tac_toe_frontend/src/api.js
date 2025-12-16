//
// Lightweight API client for Tic Tac Toe backend
//

const DEFAULT_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

/**
 * Internal helper to build full URL from path.
 */
function url(path) {
  const base = DEFAULT_BASE_URL.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * Handle HTTP errors and parse JSON.
 */
async function handle(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// PUBLIC_INTERFACE
export async function startGame(playerX = 'Player X', playerO = 'Player O') {
  /**
   * Starts a new game on the backend.
   * Returns: { game_id, board, next_player, status, winner? }
   */
  const res = await fetch(url('/games'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_x: playerX, player_o: playerO })
  });
  return handle(res);
}

// PUBLIC_INTERFACE
export async function getGameState(gameId) {
  /**
   * Fetches current game state.
   * Returns: { game_id, board, next_player, status, winner? }
   */
  const res = await fetch(url(`/games/${encodeURIComponent(gameId)}`), {
    method: 'GET'
  });
  return handle(res);
}

// PUBLIC_INTERFACE
export async function makeMove(gameId, row, col) {
  /**
   * Makes a move on the backend.
   * Returns: updated game state { game_id, board, next_player, status, winner? }
   */
  const res = await fetch(url(`/games/${encodeURIComponent(gameId)}/moves`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ row, col })
  });
  return handle(res);
}
