# Tic Tac Toe Frontend

This React app provides a playable Tic Tac Toe UI and communicates with the FastAPI backend via REST.

## Configure

Set the backend URL via environment variable:

- Local development: copy `.env.example` to `.env` at repo root or within the `tic_tac_toe_frontend` folder depending on your setup.

```
REACT_APP_BACKEND_URL=http://localhost:8000
```

If not set, it defaults to `http://localhost:8000`.

## Expected Backend Endpoints

- POST /games -> start new game
  Body: { "player_x": "Player X", "player_o": "Player O" }
  Response: { game_id, board, next_player, status, winner? }

- GET /games/{game_id} -> get game state
  Response: { game_id, board, next_player, status, winner? }

- POST /games/{game_id}/moves -> make move
  Body: { "row": number, "col": number }
  Response: { game_id, board, next_player, status, winner? }

The `board` is expected to be a 3x3 array with values '', 'X', or 'O'.
