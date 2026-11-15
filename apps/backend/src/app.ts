import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config';
import { aiService, ChatTurn } from './services/ai.service';
import { AuthedUser, db, getUserFromToken, HttpError } from './services/supabase';

type AuthedRequest = Request & { user: AuthedUser };
type Handler = (req: AuthedRequest, res: Response) => Promise<unknown>;

interface MessageRow {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  journaled: boolean;
  created_at: string;
}

interface EntryRow {
  id: string;
  mood: number;
  energy: string;
  sensation: string | null;
  content: string;
  light_points: number;
  created_at: string;
}

const toEntry = (r: EntryRow) => ({
  id: r.id,
  mood: r.mood,
  energy: r.energy,
  sensation: r.sensation || '',
  bodyFocus: r.sensation || '',
  content: r.content,
  tags: [],
  aiTags: [],
  lightPointsEarned: r.light_points,
  timestamp: r.created_at,
});

export function calculateLightPoints(contentLength: number): number {
  let points = 5;
  if (contentLength > 200) points += 3;
  if (contentLength > 500) points += 5;
  return Math.min(points, 20);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(
    cors({
      origin(origin, cb) {
        // Le app native (Expo) non mandano Origin; i browser devono essere in lista.
        if (!origin || config.allowedOrigins.includes(origin)) return cb(null, true);
        cb(null, false);
      },
    })
  );
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      elayra: config.anthropicApiKey ? 'connected' : 'missing_api_key',
      database: config.supabaseUrl && config.supabaseKey ? 'configured' : 'missing_config',
    });
  });

  const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
      if (!token) throw new HttpError(401, 'Accesso richiesto');
      (req as AuthedRequest).user = await getUserFromToken(token);
      next();
    } catch (e) {
      next(e);
    }
  };

  const route = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => {
    fn(req as AuthedRequest, res).catch(next);
  };

  // ── Chat con Elayra ────────────────────────────────────────────────────

  app.get(
    '/api/chat/history',
    requireAuth,
    route(async (req, res) => {
      const { data } = await db<MessageRow[]>(
        req.user,
        'chat_messages?select=id,role,content,journaled,created_at&order=created_at.desc&limit=60'
      );
      res.json({ messages: (data || []).reverse() });
    })
  );

  app.post(
    '/api/chat',
    requireAuth,
    route(async (req, res) => {
      const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
      if (!content) throw new HttpError(400, 'Il messaggio è vuoto');
      if (content.length > config.maxMessageChars) throw new HttpError(413, 'Il messaggio è troppo lungo');

      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { count } = await db(
        req.user,
        `chat_messages?select=id&role=eq.user&created_at=gte.${encodeURIComponent(since)}&limit=1`,
        { prefer: 'count=exact' }
      );
      if ((count ?? 0) >= config.dailyMessageLimit) {
        throw new HttpError(429, 'Per oggi ci siamo dette tanto. Torniamo a parlarci domani.');
      }

      const { data: recent } = await db<MessageRow[]>(
        req.user,
        `chat_messages?select=id,role,content,journaled,created_at&order=created_at.desc&limit=${config.historyWindow}`
      );
      const history: ChatTurn[] = (recent || []).reverse().map((m) => ({ role: m.role, content: m.content }));

      const { data: saved } = await db<MessageRow[]>(req.user, 'chat_messages', {
        method: 'POST',
        body: { role: 'user', content },
        prefer: 'return=representation',
      });

      res.status(200);
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();
      const send = (event: string, payload: unknown) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
      };
      send('user', { id: saved?.[0]?.id });

      const abort = new AbortController();
      res.on('close', () => {
        if (!res.writableEnded) abort.abort();
      });

      try {
        const reply = await aiService.streamElayraReply([...history, { role: 'user', content }], {
          nickname: req.user.nickname,
          hasHistory: history.length > 0,
          onDelta: (text) => send('delta', { text }),
          signal: abort.signal,
        });
        const { data: assistant } = await db<MessageRow[]>(req.user, 'chat_messages', {
          method: 'POST',
          body: { role: 'assistant', content: reply },
          prefer: 'return=representation',
        });
        send('done', { id: assistant?.[0]?.id, content: reply });
      } catch (e) {
        if (!abort.signal.aborted) {
          console.error('Chat error:', e instanceof Error ? e.message : e);
          const message =
            e instanceof HttpError ? e.message : 'In questo momento non riesco a risponderti. Riprova tra poco.';
          send('error', { message });
        }
      } finally {
        res.end();
      }
    })
  );

  // ── Journal ────────────────────────────────────────────────────────────

  app.get(
    '/api/journal',
    requireAuth,
    route(async (req, res) => {
      const { data } = await db<EntryRow[]>(req.user, 'journal_entries?select=*&order=created_at.desc&limit=200');
      res.json({ entries: (data || []).map(toEntry) });
    })
  );

  /** "Termina e salva": la conversazione non ancora archiviata diventa una pagina di diario. */
  app.post(
    '/api/journal/from-chat',
    requireAuth,
    route(async (req, res) => {
      const { data: pending } = await db<MessageRow[]>(
        req.user,
        'chat_messages?select=id,role,content,journaled,created_at&journaled=eq.false&order=created_at.asc&limit=200'
      );
      const turns = pending || [];
      const userText = turns.filter((m) => m.role === 'user').map((m) => m.content).join('\n\n');
      if (!userText.trim()) throw new HttpError(400, 'Non c’è ancora niente da salvare');

      let analysis;
      try {
        analysis = await aiService.analyzeChatToEntry(turns.map((m) => ({ role: m.role, content: m.content })));
      } catch (e) {
        console.error('Analyze error:', e instanceof Error ? e.message : e);
        analysis = { mood: 5, energy: 'moderate' as const, sensation: '', contentSummary: userText };
      }

      const { data: created } = await db<EntryRow[]>(req.user, 'journal_entries', {
        method: 'POST',
        body: {
          mood: analysis.mood,
          energy: analysis.energy,
          sensation: analysis.sensation,
          content: analysis.contentSummary,
          light_points: calculateLightPoints(userText.length),
        },
        prefer: 'return=representation',
      });
      const ids = turns.map((m) => m.id).join(',');
      await db(req.user, `chat_messages?id=in.(${ids})`, { method: 'PATCH', body: { journaled: true } });
      res.status(201).json({ entry: toEntry(created[0]) });
    })
  );

  app.delete(
    '/api/journal/:id',
    requireAuth,
    route(async (req, res) => {
      if (!UUID.test(req.params.id)) throw new HttpError(400, 'Identificativo non valido');
      await db(req.user, `journal_entries?id=eq.${req.params.id}`, { method: 'DELETE' });
      res.status(204).end();
    })
  );

  // ── Dati personali (GDPR): cancellazione della conversazione ───────────

  app.delete(
    '/api/chat/history',
    requireAuth,
    route(async (req, res) => {
      await db(req.user, `chat_messages?user_id=eq.${req.user.id}`, { method: 'DELETE' });
      res.status(204).end();
    })
  );

  app.use((_req, res) => res.status(404).json({ error: 'Non trovato' }));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) return res.end();
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    console.error('Unhandled error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Errore interno' });
  });

  return app;
}
