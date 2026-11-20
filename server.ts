import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import {
  createBattleshipGame,
  fireShot,
  lockPlayerFleet,
  projectOnlineView,
  validateCompleteFleet,
} from './src/battleship/engine';
import type { BattleshipGameState, PlacedShip } from './src/battleship/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

interface RoomRecord {
  code: string;
  state: BattleshipGameState;
  sockets: {
    p1: WebSocket | null;
    p2: WebSocket | null;
  };
  tokens: {
    p1: string;
    p2: string | null;
  };
  rematchVotes: Set<'p1' | 'p2'>;
  updatedAt: number;
}

const rooms = new Map<string, RoomRecord>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let tries = 0; tries < 40; tries++) {
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    if (!rooms.has(code)) return code;
  }
  return `NV${Date.now().toString().slice(-3)}`;
}

function generateSessionToken(): string {
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function sendJson(ws: WebSocket | null, payload: unknown): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastRoom(room: RoomRecord): void {
  room.updatedAt = Date.now();
  const votes = Array.from(room.rematchVotes);

  if (room.sockets.p1) {
    const viewP1 = projectOnlineView(
      room.state,
      room.code,
      'p1',
      Boolean(room.sockets.p2 && room.sockets.p2.readyState === WebSocket.OPEN),
      votes
    );
    sendJson(room.sockets.p1, { type: 'state', view: viewP1 });
  }

  if (room.sockets.p2) {
    const viewP2 = projectOnlineView(
      room.state,
      room.code,
      'p2',
      Boolean(room.sockets.p1 && room.sockets.p1.readyState === WebSocket.OPEN),
      votes
    );
    sendJson(room.sockets.p2, { type: 'state', view: viewP2 });
  }
}

// Cleanup stale rooms every 15 minutes
setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [code, room] of rooms.entries()) {
    if (room.updatedAt < cutoff) {
      rooms.delete(code);
    }
  }
}, 15 * 60 * 1000);

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, activeRooms: rooms.size });
  });

  app.get('/api/battleship/rooms/:code', (req, res) => {
    const code = String(req.params.code || '').toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) {
      res.status(404).json({ exists: false });
      return;
    }
    res.json({
      exists: true,
      code: room.code,
      hostName: room.state.players.p1.name,
      hasGuest: Boolean(room.tokens.p2),
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const urlPath = (request.url || '').split('?')[0];
    if (urlPath === '/ws/battleship') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws) => {
    let attachedRoomCode: string | null = null;
    let attachedRole: 'p1' | 'p2' | null = null;

    ws.on('message', (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }

      const type = String(msg.type || '');

      if (type === 'create_room') {
        const playerName = String(msg.playerName || 'Admiral 1').slice(0, 18).trim() || 'Admiral 1';
        const bonusShotOnHit = Boolean(msg.bonusShotOnHit);
        const code = generateRoomCode();
        const token = generateSessionToken();

        const state = createBattleshipGame({
          mode: 'online',
          difficulty: 'admiral',
          bonusShotOnHit,
          player1Name: playerName,
          player2Name: 'Waiting for Friend...',
        });

        const room: RoomRecord = {
          code,
          state,
          sockets: { p1: ws, p2: null },
          tokens: { p1: token, p2: null },
          rematchVotes: new Set(),
          updatedAt: Date.now(),
        };

        rooms.set(code, room);
        attachedRoomCode = code;
        attachedRole = 'p1';

        sendJson(ws, { type: 'joined', roomCode: code, role: 'p1', sessionToken: token });
        broadcastRoom(room);
        return;
      }

      if (type === 'join_room') {
        const code = String(msg.roomCode || '').toUpperCase().trim();
        const playerName = String(msg.playerName || 'Admiral 2').slice(0, 18).trim() || 'Admiral 2';
        const sessionToken = typeof msg.sessionToken === 'string' ? msg.sessionToken : '';

        const room = rooms.get(code);
        if (!room) {
          sendJson(ws, { type: 'error', message: `Room "${code}" not found. Check the callsign code.` });
          return;
        }

        // Reconnect existing seat via sessionToken
        if (sessionToken && sessionToken === room.tokens.p1) {
          room.sockets.p1 = ws;
          attachedRoomCode = code;
          attachedRole = 'p1';
          sendJson(ws, { type: 'joined', roomCode: code, role: 'p1', sessionToken });
          broadcastRoom(room);
          return;
        }
        if (sessionToken && sessionToken === room.tokens.p2) {
          room.sockets.p2 = ws;
          attachedRoomCode = code;
          attachedRole = 'p2';
          sendJson(ws, { type: 'joined', roomCode: code, role: 'p2', sessionToken });
          broadcastRoom(room);
          return;
        }

        // Claim open P2 seat (or reclaim if P2 disconnected)
        if (!room.tokens.p2 || !room.sockets.p2 || room.sockets.p2.readyState !== WebSocket.OPEN) {
          const newToken = generateSessionToken();
          room.tokens.p2 = newToken;
          room.sockets.p2 = ws;
          room.state = {
            ...room.state,
            phase: room.state.phase === 'lobby' ? 'deploy_p1' : room.state.phase,
            players: {
              ...room.state.players,
              p2: {
                ...room.state.players.p2,
                name: playerName,
              },
            },
            lastEventText: `${playerName} joined Room ${code}! Both Admirals, deploy your fleets.`,
          };
          attachedRoomCode = code;
          attachedRole = 'p2';
          sendJson(ws, { type: 'joined', roomCode: code, role: 'p2', sessionToken: newToken });
          broadcastRoom(room);
          return;
        }

        sendJson(ws, { type: 'error', message: `Room ${code} already has 2 active commanders.` });
        return;
      }

      if (!attachedRoomCode || !attachedRole) return;
      const room = rooms.get(attachedRoomCode);
      if (!room) return;

      if (type === 'lock_fleet') {
        const ships = Array.isArray(msg.ships) ? (msg.ships as PlacedShip[]) : [];
        if (!validateCompleteFleet(ships)) {
          sendJson(ws, { type: 'error', message: 'Invalid fleet layout. Place all 5 vessels inside the grid.' });
          return;
        }
        room.state = lockPlayerFleet(room.state, attachedRole, ships);
        broadcastRoom(room);
        return;
      }

      if (type === 'fire') {
        const row = Number(msg.row);
        const col = Number(msg.col);
        if (!Number.isInteger(row) || !Number.isInteger(col)) return;
        room.state = fireShot(room.state, attachedRole, row, col);
        broadcastRoom(room);
        return;
      }

      if (type === 'rematch') {
        room.rematchVotes.add(attachedRole);
        if (room.rematchVotes.has('p1') && room.rematchVotes.has('p2')) {
          const p1Name = room.state.players.p1.name;
          const p2Name = room.state.players.p2.name;
          room.state = createBattleshipGame({
            mode: 'online',
            difficulty: 'admiral',
            bonusShotOnHit: room.state.bonusShotOnHit,
            player1Name: p1Name,
            player2Name: p2Name,
          });
          room.state = {
            ...room.state,
            phase: 'deploy_p1',
            lastEventText: 'Rematch launched! Both Admirals, position your fleets.',
          };
          room.rematchVotes.clear();
        }
        broadcastRoom(room);
      }
    });

    ws.on('close', () => {
      if (!attachedRoomCode || !attachedRole) return;
      const room = rooms.get(attachedRoomCode);
      if (!room) return;
      if (room.sockets[attachedRole] === ws) {
        room.sockets[attachedRole] = null;
        broadcastRoom(room);
      }
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Tabletop Suite Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
