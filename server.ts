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

  // Cached proxy for real Wikipedia/Wikimedia Commons & Internet Archive images (90s Nostalgia Jeopardy!)
  interface CachedMediaEntry {
    contentType: string;
    buffer: Buffer;
    cachedAt: number;
  }
  const mediaCache = new Map<string, CachedMediaEntry>();
  const MEDIA_USER_AGENT = 'TabletopSuite90sJeopardy/1.0 (https://localhost:3000)';

  app.get('/api/nostalgia-media', async (req, res) => {
    const source = req.query.source === 'archive' ? 'archive' : 'wiki';
    const rawId = String(req.query.id || '').trim();
    if (
      !rawId ||
      rawId.length > 180 ||
      rawId.includes('..') ||
      !/^[\p{L}\p{N}_().,'&%:\-/ !?–—]+$/u.test(rawId)
    ) {
      res.status(400).json({ error: 'Invalid media identifier' });
      return;
    }

    const cacheKey = `${source}:${rawId}`;
    const existing = mediaCache.get(cacheKey);
    if (existing && Date.now() - existing.cachedAt < 6 * 60 * 60 * 1000) {
      res.setHeader('Content-Type', existing.contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(existing.buffer);
      return;
    }

    try {
      let imageUrl: string | null = null;
      if (source === 'archive') {
        imageUrl = `https://archive.org/services/img/${encodeURIComponent(rawId)}`;
      } else {
        let decodedTitle = rawId;
        try {
          decodedTitle = decodeURIComponent(rawId);
        } catch {
          decodedTitle = rawId;
        }
        const normalizedTitle = decodedTitle.replace(/ /g, '_');
        const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(normalizedTitle)}`;
        const summaryRes = await fetch(summaryUrl, {
          headers: { 'User-Agent': MEDIA_USER_AGENT, Accept: 'application/json' },
          signal: AbortSignal.timeout(5500),
        });
        if (summaryRes.ok) {
          const data = (await summaryRes.json()) as {
            thumbnail?: { source?: string };
            originalimage?: { source?: string };
          };
          imageUrl = data.thumbnail?.source || data.originalimage?.source || null;
        }

        // Fallback to MediaWiki pageimages query if REST summary had no thumbnail
        if (!imageUrl) {
          const queryUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(decodedTitle)}&prop=pageimages&format=json&pithumbsize=640&redirects=1`;
          const qRes = await fetch(queryUrl, {
            headers: { 'User-Agent': MEDIA_USER_AGENT, Accept: 'application/json' },
            signal: AbortSignal.timeout(5500),
          });
          if (qRes.ok) {
            const qData = (await qRes.json()) as {
              query?: { pages?: Record<string, { thumbnail?: { source?: string } }> };
            };
            const pages = qData.query?.pages ? Object.values(qData.query.pages) : [];
            imageUrl = pages[0]?.thumbnail?.source || null;
          }
        }
      }

      if (!imageUrl) {
        res.status(404).json({ error: 'Image not found' });
        return;
      }

      const imgRes = await fetch(imageUrl, {
        headers: { 'User-Agent': MEDIA_USER_AGENT },
        redirect: 'follow',
        signal: AbortSignal.timeout(6500),
      });

      if (!imgRes.ok) {
        res.status(404).json({ error: 'Upstream image unavailable' });
        return;
      }

      const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
      if (!contentType.startsWith('image/')) {
        res.status(404).json({ error: 'Upstream response was not an image' });
        return;
      }

      const arrayBuf = await imgRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      if (buffer.length > 0 && buffer.length < 4 * 1024 * 1024) {
        if (mediaCache.size > 120) {
          const oldestKey = mediaCache.keys().next().value;
          if (oldestKey) mediaCache.delete(oldestKey);
        }
        mediaCache.set(cacheKey, { contentType, buffer, cachedAt: Date.now() });
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buffer);
    } catch {
      res.status(502).json({ error: 'Media fetch failed' });
    }
  });

  // Streaming proxy for real Internet Archive 1990s MP4 videos with full HTTP Range support
  interface CachedVideoResolution {
    downloadUrl: string;
    resolvedAt: number;
  }
  const videoUrlCache = new Map<string, CachedVideoResolution>();

  app.get('/api/nostalgia-video', async (req, res) => {
    const rawId = String(req.query.id || '').trim();
    const rawFile = String(req.query.file || '').trim();
    if (!rawId || rawId.length > 160 || !/^[A-Za-z0-9_.\-]+$/.test(rawId)) {
      res.status(400).json({ error: 'Invalid archive video identifier' });
      return;
    }
    if (rawFile && (rawFile.length > 220 || rawFile.includes('..') || rawFile.includes('/') || rawFile.includes('\\'))) {
      res.status(400).json({ error: 'Invalid video filename' });
      return;
    }

    const cacheKey = `${rawId}:${rawFile}`;
    let targetUrl: string | null = null;
    const cached = videoUrlCache.get(cacheKey);
    if (cached && Date.now() - cached.resolvedAt < 6 * 60 * 60 * 1000) {
      targetUrl = cached.downloadUrl;
    }

    try {
      if (!targetUrl) {
        let filename = rawFile;
        if (!filename) {
          const metaRes = await fetch(
            `https://archive.org/metadata/${encodeURIComponent(rawId)}/files`,
            {
              headers: { 'User-Agent': MEDIA_USER_AGENT, Accept: 'application/json' },
              signal: AbortSignal.timeout(6000),
            }
          );
          if (metaRes.ok) {
            const metaJson = (await metaRes.json()) as {
              result?: Array<{ name?: string; size?: string | number }>;
            };
            const mp4 = (metaJson.result || []).find(
              (f) => f.name && f.name.toLowerCase().endsWith('.mp4') && Number(f.size || 0) > 10000
            );
            if (mp4?.name) filename = mp4.name;
          }
        }

        if (!filename) {
          res.status(404).json({ error: 'Archive MP4 file not found' });
          return;
        }
        targetUrl = `https://archive.org/download/${encodeURIComponent(rawId)}/${encodeURIComponent(filename)}`;
      }

      const upstreamHeaders: Record<string, string> = {
        'User-Agent': MEDIA_USER_AGENT,
      };
      if (typeof req.headers.range === 'string') {
        upstreamHeaders.Range = req.headers.range;
      }

      const upstream = await fetch(targetUrl, {
        headers: upstreamHeaders,
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      });

      if (!upstream.ok && upstream.status !== 206) {
        videoUrlCache.delete(cacheKey);
        res.status(upstream.status === 404 ? 404 : 502).json({ error: 'Archive video unavailable' });
        return;
      }

      // Cache final resolved mirror URL so subsequent Range chunks skip the 302 hop
      if (upstream.url && upstream.url.startsWith('https://')) {
        if (videoUrlCache.size > 120) {
          const first = videoUrlCache.keys().next().value;
          if (first) videoUrlCache.delete(first);
        }
        videoUrlCache.set(cacheKey, { downloadUrl: upstream.url, resolvedAt: Date.now() });
      }

      res.status(upstream.status);
      const ct = upstream.headers.get('content-type') || 'video/mp4';
      res.setHeader('Content-Type', ct.includes('video') ? ct : 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=86400');

      const contentLength = upstream.headers.get('content-length');
      if (contentLength) res.setHeader('Content-Length', contentLength);
      const contentRange = upstream.headers.get('content-range');
      if (contentRange) res.setHeader('Content-Range', contentRange);

      if (!upstream.body) {
        res.end();
        return;
      }

      const { Readable } = await import('node:stream');
      const nodeStream = Readable.fromWeb(
        upstream.body as unknown as import('node:stream/web').ReadableStream
      );
      req.on('close', () => {
        nodeStream.destroy();
      });
      nodeStream.on('error', () => {
        if (!res.headersSent) {
          res.status(502).end();
        } else {
          res.end();
        }
      });
      nodeStream.pipe(res);
    } catch {
      if (!res.headersSent) {
        res.status(502).json({ error: 'Archive video stream failed' });
      } else {
        res.end();
      }
    }
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
