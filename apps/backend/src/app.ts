import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config';
import { aiService, ChatTurn } from './services/ai.service';
import { adminDb, AuthedUser, db, dbErrorText, getUserFromToken, HttpError } from './services/supabase';
import { activeSubscription, createCheckout, createPortal, createReportCheckout, handleWebhook, REPORT_PRICE_CENTS } from './services/billing';
import { isPlanId, PLANS, PlanId, startOfMonthUtc } from './plans';
import { buildProgress, LEVELS, RITUAL_LIGHT_POINTS } from './levels';
import { currentLocale, localeMiddleware, translateError } from './locale';
import { cardsForPrompt, describeCards, drawSpread } from './tarot';
import { availablePeriods, periodEndExclusive, ReportPeriod, resolvePeriod } from './reports';
import {
  cleanDiscovered,
  DiscoveryFacts,
  discoveryContext,
  FIRST_REPORT_DAYS,
  isPageKey,
  MONTH_REPORT_DAYS,
  PAGE_KEYS,
  visiblePages,
} from './discovery';
import { forgeInvitation, FORGE_AREAS, sanitizeDraft, shouldCheckForge } from './forge';

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

interface RitualRow {
  kind: 'morning' | 'evening';
  day: string;
  response: string;
  light_points: number;
}

interface ForgeProfileRow {
  topic: string;
  summary: string;
  areas: string[];
  project_type: string;
  style: string;
  status: 'draft' | 'active' | 'declined';
}

interface ForgeMatchRow {
  id: string;
  topic: string;
  my_status: string;
  their_status: string;
  is_open: boolean;
  other_nickname: string | null;
  other_summary: string | null;
  created_at: string;
}

interface ForgeMessageRow {
  id: string;
  sender_id: string | null;
  role: 'user' | 'elayra';
  content: string;
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
  app.use(localeMiddleware);
  // Il webhook di Stripe deve ricevere il corpo così com'è per verificarne la firma: va prima di express.json.
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json', limit: '1mb' }), (req, res, next) => {
    handleWebhook(req.body as Buffer, req.headers['stripe-signature'] as string | undefined)
      .then((type) => res.json({ received: true, type }))
      .catch(next);
  });

  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      elayra: config.anthropicApiKey ? 'connected' : 'missing_api_key',
      database: config.supabaseUrl && config.supabaseKey ? 'configured' : 'missing_config',
      serverKey: config.supabaseSecretKey ? 'configured' : 'missing',
      payments: config.stripeSecretKey && config.stripeWebhookSecret ? 'configured' : 'missing_config',
    });
  });

  const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
      if (!token) throw new HttpError(401, 'Accesso richiesto');
      const user = await getUserFromToken(token);
      // 2FA obbligatoria: senza il codice dell'autenticatore il server non risponde.
      if (user.aal !== 'aal2') throw new HttpError(403, 'Serve il codice dell’app di autenticazione');
      (req as AuthedRequest).user = user;
      next();
    } catch (e) {
      next(e);
    }
  };

  const route = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => {
    fn(req as AuthedRequest, res).catch(next);
  };

  // ── Account: piano, uso del mese, profilo ──────────────────────────────

  const loadAccount = async (user: AuthedUser) => {
    const [plan, usage, profile] = await Promise.all([
      db<string>(user, 'rpc/effective_plan', { method: 'POST', body: { uid: user.id } }),
      db(user, `ai_usage?select=id&created_at=gte.${encodeURIComponent(startOfMonthUtc())}&limit=1`, {
        prefer: 'count=exact',
      }),
      db<{
        nickname: string | null;
        referral_code: string | null;
        onboarded_at: string | null;
        avatar_kind: string | null;
        avatar_path: string | null;
        elayra_notes: string | null;
      }[]>(user, 'profiles?select=nickname,referral_code,onboarded_at,avatar_kind,avatar_path,elayra_notes'),
    ]);
    const planId: PlanId = isPlanId(plan.data) ? plan.data : 'free';
    const p = profile.data?.[0];
    return {
      plan: PLANS[planId],
      used: usage.count ?? 0,
      nickname: p?.nickname || user.nickname || '',
      referralCode: p?.referral_code || null,
      onboarded: Boolean(p?.onboarded_at),
      avatarKind: p?.avatar_kind || null,
      avatarPath: p?.avatar_path || null,
      elayraNotes: p?.elayra_notes || '',
    };
  };

  const requireQuota = (account: Awaited<ReturnType<typeof loadAccount>>) => {
    if (account.used >= account.plan.monthlyMessages) {
      throw new HttpError(
        429,
        `Questo mese hai usato tutte le ${account.plan.monthlyMessages} risposte di Elayra del piano ${account.plan.name}. ` +
          'Puoi passare a un piano più ampio dalla pagina Piani, oppure ritrovarci il mese prossimo.'
      );
    }
  };

  const recordUsage = (user: AuthedUser, kind: 'chat' | 'forge', model: string) =>
    db(user, 'ai_usage', { method: 'POST', body: { kind, model } }).catch((e) =>
      console.error('Usage record error:', e instanceof Error ? e.message : e)
    );

  // ── Scoperta dell'app: il menu si accende pagina per pagina ─────────────

  const loadDiscovery = async (user: AuthedUser): Promise<DiscoveryFacts> => {
    const [profile, entries, tarot, days, rituals] = await Promise.all([
      db<{ discovered_pages: string[] | null }[]>(user, 'profiles?select=discovered_pages'),
      db(user, 'journal_entries?select=id&limit=1', { prefer: 'count=exact' }),
      db<{ id: string }[]>(user, 'tarot_readings?select=id&reading=neq.&limit=1'),
      db<{ day: string }[]>(user, 'rpc/my_active_days', { method: 'POST', body: {} }),
      db(user, 'rituals?select=id&limit=1', { prefer: 'count=exact' }),
    ]);
    return {
      rituals: rituals.count ?? 0,
      discovered: cleanDiscovered(profile.data?.[0]?.discovered_pages),
      journalEntries: entries.count ?? 0,
      hasTarotReading: Boolean(tarot.data?.length),
      activeDays: days.data?.length ?? 0,
    };
  };

  app.get(
    '/api/discovery',
    requireAuth,
    route(async (req, res) => {
      const facts = await loadDiscovery(req.user);
      res.json({ pages: PAGE_KEYS, visible: visiblePages(facts) });
    })
  );

  // Visitare una pagina la fa entrare nel menu.
  app.post(
    '/api/discovery',
    requireAuth,
    route(async (req, res) => {
      const page = req.body?.page;
      if (!isPageKey(page)) throw new HttpError(400, 'Pagina non valida');
      const { data } = await db<{ discovered_pages: string[] | null }[]>(req.user, 'profiles?select=discovered_pages');
      const current = cleanDiscovered(data?.[0]?.discovered_pages);
      if (!current.includes(page)) {
        const next = PAGE_KEYS.filter((k) => k === page || current.includes(k));
        await adminDb(`profiles?id=eq.${req.user.id}`, { method: 'PATCH', body: { discovered_pages: next } });
      }
      const facts = await loadDiscovery(req.user);
      res.json({ pages: PAGE_KEYS, visible: visiblePages(facts) });
    })
  );

  app.get(
    '/api/me',
    requireAuth,
    route(async (req, res) => {
      const account = await loadAccount(req.user);
      const { data: sub } = await db<{ plan: string; status: string; current_period_end: string | null; sponsored_by: string | null }[]>(
        req.user,
        'subscriptions?select=plan,status,current_period_end,sponsored_by'
      );
      const { data: grants } = await db<{ plan: string; ends_at: string; source: string }[]>(
        req.user,
        `plan_grants?select=plan,ends_at,source&ends_at=gte.${encodeURIComponent(new Date().toISOString())}&order=ends_at.desc`
      );
      res.json({
        nickname: account.nickname,
        onboarded: account.onboarded,
        referralCode: account.referralCode,
        avatarKind: account.avatarKind,
        avatarPath: account.avatarPath,
        elayraNotes: account.elayraNotes,
        plan: account.plan.id,
        usage: { used: account.used, limit: account.plan.monthlyMessages },
        subscription: sub?.[0] || null,
        grants: grants || [],
        plans: Object.values(PLANS).map(({ stripeLookupKey: _k, ...p }) => p),
      });
    })
  );

  // Profilo: nome, avatar (punto, cerchio, triangolo) oppure foto già caricata nella propria cartella.
  app.post(
    '/api/profile',
    requireAuth,
    route(async (req, res) => {
      const body = req.body || {};
      const patch: Record<string, string | null> = {};
      if (body.nickname !== undefined) {
        const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : '';
        if (nickname.length < 2 || nickname.length > 40) throw new HttpError(400, 'Il nome deve avere tra 2 e 40 caratteri');
        patch.nickname = nickname;
      }
      if (body.avatarKind !== undefined) {
        const kind = body.avatarKind;
        if (kind !== null && !['point', 'circle', 'triangle', 'image'].includes(kind)) {
          throw new HttpError(400, 'Avatar non valido');
        }
        patch.avatar_kind = kind;
        if (kind === 'image') {
          const path = typeof body.avatarPath === 'string' ? body.avatarPath : '';
          if (!path.startsWith(`${req.user.id}/`) || path.includes('..') || path.length > 200) {
            throw new HttpError(400, 'Immagine non valida');
          }
          patch.avatar_path = path;
        } else {
          patch.avatar_path = null;
        }
      }
      if (body.elayraNotes !== undefined) {
        if (body.elayraNotes !== null && typeof body.elayraNotes !== 'string') throw new HttpError(400, 'Testo non valido');
        const notes = (body.elayraNotes || '').trim();
        if (notes.length > 6000) throw new HttpError(413, 'Puoi scrivere fino a 6000 caratteri');
        patch.elayra_notes = notes || null;
      }
      if (Object.keys(patch).length === 0) throw new HttpError(400, 'Niente da cambiare');
      await db(req.user, `profiles?id=eq.${req.user.id}`, { method: 'PATCH', body: patch });
      res.status(204).end();
    })
  );

  app.post(
    '/api/onboarding',
    requireAuth,
    route(async (req, res) => {
      const nickname = typeof req.body?.nickname === 'string' ? req.body.nickname.trim() : '';
      const age = Number(req.body?.age);
      const referral = typeof req.body?.referralCode === 'string' ? req.body.referralCode.trim().slice(0, 16) : '';
      if (nickname.length < 2) throw new HttpError(400, 'Scrivi come vuoi essere chiamata o chiamato');
      if (!Number.isInteger(age) || age < 18 || age > 120) throw new HttpError(400, 'Per usare Elayra devi avere almeno 18 anni');
      if (req.body?.consent !== true) {
        throw new HttpError(400, 'Per continuare serve il tuo consenso a termini e privacy');
      }
      await db(req.user, 'rpc/complete_onboarding', {
        method: 'POST',
        body: { p_nickname: nickname, p_age: age, p_referral: referral || null },
      });
      // Il consenso esplicito (art. 9 GDPR) resta registrato con la data.
      await adminDb(`profiles?id=eq.${req.user.id}`, { method: 'PATCH', body: { consented_at: new Date().toISOString() } });
      res.status(204).end();
    })
  );

  app.post(
    '/api/referral/regenerate',
    requireAuth,
    route(async (req, res) => {
      const { data } = await db<string>(req.user, 'rpc/regenerate_referral_code', { method: 'POST', body: {} });
      res.json({ referralCode: data });
    })
  );

  // ── Pagamenti ──────────────────────────────────────────────────────────

  /** Trova l'altra persona di una stanza aperta della Forgia, dopo aver verificato che chi chiede ne fa parte. */
  const roomPartner = async (user: AuthedUser, matchId: string) => {
    const { data: mine } = await db<ForgeMatchRow[]>(user, 'rpc/forge_my_matches', { method: 'POST', body: {} });
    const match = (mine || []).find((m) => m.id === matchId);
    if (!match || !match.is_open) throw new HttpError(404, 'Questa stanza non è aperta');
    const { data } = await adminDb<{ user_a: string; user_b: string; topic: string }[]>(
      `forge_matches?select=user_a,user_b,topic&id=eq.${matchId}`
    );
    const row = data?.[0];
    if (!row) throw new HttpError(404, 'Questa stanza non è aperta');
    return { partnerId: row.user_a === user.id ? row.user_b : row.user_a, match };
  };

  app.post(
    '/api/billing/checkout',
    requireAuth,
    route(async (req, res) => {
      const plan = req.body?.plan;
      if (!isPlanId(plan) || plan === 'free') throw new HttpError(400, 'Piano non valido');
      const sponsorMatchId = typeof req.body?.sponsorMatchId === 'string' ? req.body.sponsorMatchId : '';
      if (await activeSubscription(req.user.id)) {
        throw new HttpError(409, 'Hai già un abbonamento: puoi cambiarlo da “Gestisci abbonamento”.');
      }
      let sponsoredUserId: string | undefined;
      if (sponsorMatchId) {
        if (!UUID.test(sponsorMatchId)) throw new HttpError(400, 'Identificativo non valido');
        sponsoredUserId = (await roomPartner(req.user, sponsorMatchId)).partnerId;
        if (await activeSubscription(sponsoredUserId)) {
          throw new HttpError(409, 'L’altra persona ha già un abbonamento.');
        }
      }
      const url = await createCheckout({ userId: req.user.id, email: req.user.email, plan, sponsoredUserId });
      res.json({ url });
    })
  );

  app.post(
    '/api/billing/portal',
    requireAuth,
    route(async (req, res) => {
      res.json({ url: await createPortal(req.user.id) });
    })
  );

  // ── Forgia: quando proporla ────────────────────────────────────────────

  const createForgeDraft = async (user: AuthedUser, turns: ChatTurn[]): Promise<string | null> => {
    const draft = await aiService.assessForge(turns);
    if (!draft) return null;
    await db(user, 'forge_profiles?on_conflict=user_id', {
      method: 'POST',
      body: { ...draft, status: 'draft', updated_at: new Date().toISOString() },
      prefer: 'resolution=merge-duplicates',
    });
    const invite = forgeInvitation(draft.topic);
    await db(user, 'chat_messages', { method: 'POST', body: { role: 'assistant', content: invite, journaled: true } });
    return invite;
  };

  const maybeProposeForge = async (user: AuthedUser, turns: ChatTurn[]): Promise<string | null> => {
    const { count } = await db(user, 'chat_messages?select=id&role=eq.user&limit=1', { prefer: 'count=exact' });
    if (!shouldCheckForge(count ?? 0)) return null;
    // Se un profilo esiste già (bozza, attivo o rifiutato) Elayra non insiste.
    const { data: existing } = await db<{ status: string }[]>(user, 'forge_profiles?select=status');
    if (existing && existing.length > 0) return null;
    return createForgeDraft(user, turns);
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

      const account = await loadAccount(req.user);
      requireQuota(account);
      const model = account.plan.tier === 'full' ? config.model : config.lightModel;
      // Dove si trova la persona nella scoperta dell'app: se manca, Elayra risponde lo stesso.
      const discovery = await loadDiscovery(req.user)
        .then(discoveryContext)
        .catch(() => undefined);

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
          nickname: account.nickname,
          hasHistory: history.length > 0,
          personalNotes: account.elayraNotes,
          discovery,
          onDelta: (text) => send('delta', { text }),
          onReset: () => send('reset', {}),
          signal: abort.signal,
          model,
        });
        await recordUsage(req.user, 'chat', model);
        const { data: assistant } = await db<MessageRow[]>(req.user, 'chat_messages', {
          method: 'POST',
          body: { role: 'assistant', content: reply },
          prefer: 'return=representation',
        });
        send('done', { id: assistant?.[0]?.id, content: reply });

        // Ogni tanto Elayra valuta se c'è un progetto da portare nella Forgia. Un errore qui non rovina la chat.
        try {
          const invite = await maybeProposeForge(req.user, [...history, { role: 'user', content }]);
          if (invite) send('elayra', { content: invite });
        } catch (e) {
          console.error('Forge check error:', e instanceof Error ? e.message : e);
        }
      } catch (e) {
        if (!abort.signal.aborted) {
          console.error('Chat error:', e instanceof Error ? e.message : e);
          // Senza risposta il messaggio non resta in sospeso: riprovando non si accumulano doppioni.
          if (saved?.[0]?.id) {
            await db(req.user, `chat_messages?id=eq.${saved[0].id}`, { method: 'DELETE' }).catch(() => undefined);
          }
          const message =
            translateError(e instanceof HttpError ? e.message : 'In questo momento non riesco a risponderti. Riprova tra poco.');
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

  // ── Rituali del mattino e della sera ───────────────────────────────────

  /** Accetta solo una data YYYY-MM-DD vicina a oggi (il "giorno" dipende dal fuso dell'utente). */
  const parseDay = (value: unknown): string => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new HttpError(400, 'Data non valida');
    const diff = Math.abs(Date.parse(`${value}T12:00:00Z`) - Date.now());
    if (Number.isNaN(diff) || diff > 36 * 3600 * 1000) throw new HttpError(400, 'Data non valida');
    return value;
  };

  app.get(
    '/api/rituals',
    requireAuth,
    route(async (req, res) => {
      const day = parseDay(req.query.day);
      const { data } = await db<RitualRow[]>(req.user, `rituals?select=kind,day,response,light_points&day=eq.${day}`);
      const find = (kind: string) => (data || []).find((r) => r.kind === kind) || null;
      res.json({ day, morning: find('morning'), evening: find('evening') });
    })
  );

  app.post(
    '/api/rituals',
    requireAuth,
    route(async (req, res) => {
      const day = parseDay(req.body?.day);
      const kind = req.body?.kind;
      if (kind !== 'morning' && kind !== 'evening') throw new HttpError(400, 'Rituale non valido');
      const response = typeof req.body?.response === 'string' ? req.body.response.trim() : '';
      if (!response) throw new HttpError(400, 'Scrivi almeno una parola');
      if (response.length > config.maxMessageChars) throw new HttpError(413, 'Il testo è troppo lungo');

      const { data: existing } = await db<RitualRow[]>(
        req.user,
        `rituals?select=kind,day,response,light_points&day=eq.${day}&kind=eq.${kind}`
      );
      if (existing && existing.length > 0) throw new HttpError(409, 'Per oggi questo rituale è già fatto');

      const { data } = await db<RitualRow[]>(req.user, 'rituals', {
        method: 'POST',
        body: { kind, day, response, light_points: RITUAL_LIGHT_POINTS },
        prefer: 'return=representation',
      });
      res.status(201).json({ ritual: data[0] });
    })
  );

  // ── Il Percorso: punti luce e livelli ──────────────────────────────────

  const loadProgress = async (user: AuthedUser) => {
    const [entries, rituals, reflections] = await Promise.all([
      db<{ light_points: number }[]>(user, 'journal_entries?select=light_points&limit=5000'),
      db<{ light_points: number }[]>(user, 'rituals?select=light_points&limit=5000'),
      db<{ level: number; response: string }[]>(user, 'level_reflections?select=level,response'),
    ]);
    const sum = (rows: { light_points: number }[] | null) => (rows || []).reduce((t, r) => t + (r.light_points || 0), 0);
    const responses = new Map((reflections.data || []).map((r) => [r.level, r.response]));
    return buildProgress(sum(entries.data) + sum(rituals.data), responses);
  };

  app.get(
    '/api/progress',
    requireAuth,
    route(async (req, res) => {
      res.json(await loadProgress(req.user));
    })
  );

  app.post(
    '/api/progress/reflections',
    requireAuth,
    route(async (req, res) => {
      const level = Number(req.body?.level);
      const definition = LEVELS.find((l) => l.level === level);
      if (!definition) throw new HttpError(400, 'Livello non valido');
      const response = typeof req.body?.response === 'string' ? req.body.response.trim() : '';
      if (!response) throw new HttpError(400, 'Scrivi almeno una parola');
      if (response.length > config.maxMessageChars) throw new HttpError(413, 'Il testo è troppo lungo');

      const progress = await loadProgress(req.user);
      if (progress.lightPoints < definition.threshold) throw new HttpError(403, 'Questo livello non è ancora aperto');

      await db(req.user, 'level_reflections?on_conflict=user_id,level', {
        method: 'POST',
        body: { level, response, updated_at: new Date().toISOString() },
        prefer: 'resolution=merge-duplicates',
      });
      res.status(201).json({ level, response });
    })
  );

  // ── Forgia ─────────────────────────────────────────────────────────────

  const forgeState = async (user: AuthedUser) => {
    const [profile, matches] = await Promise.all([
      db<ForgeProfileRow[]>(user, 'forge_profiles?select=topic,summary,areas,project_type,style,status'),
      db<ForgeMatchRow[]>(user, 'rpc/forge_my_matches', { method: 'POST', body: {} }),
    ]);
    return { profile: profile.data?.[0] || null, matches: matches.data || [], areas: FORGE_AREAS };
  };

  app.get(
    '/api/forge',
    requireAuth,
    route(async (req, res) => {
      res.json(await forgeState(req.user));
    })
  );

  /** La persona chiede a Elayra di preparare la bozza senza aspettare l'invito. */
  app.post(
    '/api/forge/draft',
    requireAuth,
    route(async (req, res) => {
      const { data: recent } = await db<MessageRow[]>(
        req.user,
        'chat_messages?select=id,role,content,journaled,created_at&role=eq.user&order=created_at.desc&limit=40'
      );
      const turns: ChatTurn[] = (recent || []).reverse().map((m) => ({ role: m.role, content: m.content }));
      if (turns.length < 3) throw new HttpError(400, 'Parla ancora un po’ con Elayra: non ho abbastanza per capire a cosa stai lavorando.');
      const invite = await createForgeDraft(req.user, turns);
      if (!invite) throw new HttpError(404, 'Nelle nostre conversazioni non ho ancora trovato un progetto. Raccontamelo in chat.');
      res.status(201).json(await forgeState(req.user));
    })
  );

  /** Accettare (con eventuali correzioni), rifiutare o lasciare la Forgia. Niente è condiviso prima del sì. */
  app.post(
    '/api/forge/profile',
    requireAuth,
    route(async (req, res) => {
      const action = req.body?.action;
      const { data: rows } = await db<ForgeProfileRow[]>(req.user, 'forge_profiles?select=topic,summary,areas,project_type,style,status');
      const current = rows?.[0];
      if (!current) throw new HttpError(404, 'Non c’è ancora un invito alla Forgia');

      if (action === 'decline') {
        await db(req.user, `forge_profiles?user_id=eq.${req.user.id}`, {
          method: 'PATCH',
          body: { status: 'declined', updated_at: new Date().toISOString() },
        });
      } else if (action === 'accept') {
        const draft = sanitizeDraft({
          ...current,
          topic: typeof req.body?.topic === 'string' ? req.body.topic : current.topic,
          summary: typeof req.body?.summary === 'string' ? req.body.summary : current.summary,
          areas: Array.isArray(req.body?.areas) ? req.body.areas : current.areas,
        });
        if (!draft) throw new HttpError(400, 'Servono un titolo, una descrizione e almeno un’area');
        await db(req.user, `forge_profiles?user_id=eq.${req.user.id}`, {
          method: 'PATCH',
          body: { ...draft, status: 'active', updated_at: new Date().toISOString() },
        });
        await db(req.user, 'rpc/forge_find_matches', { method: 'POST', body: {} });
      } else {
        throw new HttpError(400, 'Azione non valida');
      }
      res.json(await forgeState(req.user));
    })
  );

  app.post(
    '/api/forge/matches/search',
    requireAuth,
    route(async (req, res) => {
      const { data: found } = await db<number>(req.user, 'rpc/forge_find_matches', { method: 'POST', body: {} });
      res.json({ ...(await forgeState(req.user)), found: typeof found === 'number' ? found : 0 });
    })
  );

  app.post(
    '/api/forge/matches/:id/respond',
    requireAuth,
    route(async (req, res) => {
      if (!UUID.test(req.params.id)) throw new HttpError(400, 'Identificativo non valido');
      if (typeof req.body?.accept !== 'boolean') throw new HttpError(400, 'Risposta non valida');
      await db(req.user, 'rpc/forge_respond', { method: 'POST', body: { p_match: req.params.id, p_accept: req.body.accept } });
      res.json(await forgeState(req.user));
    })
  );

  app.get(
    '/api/forge/matches/:id/messages',
    requireAuth,
    route(async (req, res) => {
      if (!UUID.test(req.params.id)) throw new HttpError(400, 'Identificativo non valido');
      const { data } = await db<ForgeMessageRow[]>(
        req.user,
        `forge_messages?select=id,sender_id,role,content,created_at&match_id=eq.${req.params.id}&order=created_at.desc&limit=200`
      );
      res.json({
        messages: (data || []).reverse().map((m) => ({
          id: m.id,
          from: m.role === 'elayra' ? 'elayra' : m.sender_id === req.user.id ? 'me' : 'them',
          content: m.content,
          createdAt: m.created_at,
        })),
      });
    })
  );

  app.post(
    '/api/forge/matches/:id/messages',
    requireAuth,
    route(async (req, res) => {
      if (!UUID.test(req.params.id)) throw new HttpError(400, 'Identificativo non valido');
      const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
      if (!content) throw new HttpError(400, 'Il messaggio è vuoto');
      if (content.length > config.maxMessageChars) throw new HttpError(413, 'Il messaggio è troppo lungo');
      const account = await loadAccount(req.user);
      if (!account.plan.forgeRooms) {
        throw new HttpError(402, 'Per scrivere nelle stanze della Forgia serve almeno il piano Forgia (2,99 €/mese).');
      }
      // Se la stanza non è aperta per entrambi, le regole del database rifiutano la scrittura.
      const { data } = await db<ForgeMessageRow[]>(req.user, 'forge_messages', {
        method: 'POST',
        body: { match_id: req.params.id, sender_id: req.user.id, role: 'user', content },
        prefer: 'return=representation',
      }).catch(() => {
        throw new HttpError(403, 'Questa stanza non è aperta');
      });
      res.status(201).json({ message: { id: data[0].id, from: 'me', content, createdAt: data[0].created_at } });
    })
  );

  /** Elayra entra nella stanza: legge gli ultimi messaggi e risponde a chi l'ha chiamata. */
  app.post(
    '/api/forge/matches/:id/elayra',
    requireAuth,
    route(async (req, res) => {
      if (!UUID.test(req.params.id)) throw new HttpError(400, 'Identificativo non valido');
      const request = typeof req.body?.request === 'string' ? req.body.request.trim() : '';
      if (!request) throw new HttpError(400, 'Scrivi cosa chiedere a Elayra');
      if (request.length > config.maxMessageChars) throw new HttpError(413, 'La richiesta è troppo lunga');

      const account = await loadAccount(req.user);
      if (!account.plan.forgeElayra) {
        throw new HttpError(402, 'Per avere Elayra nelle stanze serve il piano Part time o superiore.');
      }
      requireQuota(account);
      const { match } = await roomPartner(req.user, req.params.id);

      const { data: recent } = await db<ForgeMessageRow[]>(
        req.user,
        `forge_messages?select=id,sender_id,role,content,created_at&match_id=eq.${req.params.id}&order=created_at.desc&limit=60`
      );
      const me = account.nickname || 'Io';
      const other = match.other_nickname || 'L’altra persona';
      const transcript = (recent || []).reverse().map((m) => ({
        from: m.role === 'elayra' ? 'Elayra' : m.sender_id === req.user.id ? me : other,
        content: m.content,
      }));

      // La domanda resta nella stanza, visibile a entrambi, poi arriva la risposta di Elayra.
      await adminDb('forge_messages', {
        method: 'POST',
        body: { match_id: req.params.id, sender_id: req.user.id, role: 'user', content: `@Elayra ${request}` },
      });
      const reply = await aiService.forgeRoomAssist({ topic: match.topic, transcript, request, caller: me });
      await recordUsage(req.user, 'forge', config.model);
      const { data } = await adminDb<ForgeMessageRow[]>('forge_messages', {
        method: 'POST',
        body: { match_id: req.params.id, sender_id: null, role: 'elayra', content: reply || '…' },
        prefer: 'return=representation',
      });
      res.status(201).json({ message: { id: data[0].id, from: 'elayra', content: data[0].content, createdAt: data[0].created_at } });
    })
  );

  // ── Secretary Liria: la softwarehouse della Forgia ─────────────────────

  app.get(
    '/api/forge/liria',
    requireAuth,
    route(async (req, res) => {
      const account = await loadAccount(req.user);
      const eligible = Boolean(account.plan.forgeElayra);
      res.json({
        eligible,
        email: config.liriaEmail,
        // Il codice sconto si vede solo dal piano Part time in su.
        discountCode: eligible ? config.liriaDiscountCode || null : null,
      });
    })
  );

  // Elayra mette in ordine la stanza in un brief per Liria; la persona lo legge e lo corregge prima di inviarlo.
  app.post(
    '/api/forge/matches/:id/liria/brief',
    requireAuth,
    route(async (req, res) => {
      if (!UUID.test(req.params.id)) throw new HttpError(400, 'Identificativo non valido');
      const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim().slice(0, 2000) : '';
      const account = await loadAccount(req.user);
      if (!account.plan.forgeElayra) {
        throw new HttpError(402, 'Il brief per Liria è incluso dal piano Part time in su.');
      }
      requireQuota(account);
      const { match } = await roomPartner(req.user, req.params.id);
      const { data: recent } = await db<ForgeMessageRow[]>(
        req.user,
        `forge_messages?select=id,sender_id,role,content,created_at&match_id=eq.${req.params.id}&order=created_at.desc&limit=120`
      );
      const me = account.nickname || 'Io';
      const other = match.other_nickname || 'L’altra persona';
      const transcript = (recent || []).reverse().map((m) => ({
        from: m.role === 'elayra' ? 'Elayra' : m.sender_id === req.user.id ? me : other,
        content: m.content,
      }));
      const brief = await aiService.liriaBrief({ topic: match.topic, transcript, notes });
      await recordUsage(req.user, 'forge', config.model);
      res.json({ brief, email: config.liriaEmail, subject: `Elayra · ${match.topic}`.slice(0, 120) });
    })
  );

  // Il brief confermato resta nella stanza, così anche l'altra persona sa cosa è stato chiesto a Liria.
  app.post(
    '/api/forge/matches/:id/liria/confirm',
    requireAuth,
    route(async (req, res) => {
      if (!UUID.test(req.params.id)) throw new HttpError(400, 'Identificativo non valido');
      const brief = typeof req.body?.brief === 'string' ? req.body.brief.trim() : '';
      if (!brief) throw new HttpError(400, 'Il brief è vuoto');
      if (brief.length > 8000) throw new HttpError(413, 'Il brief è troppo lungo');
      const account = await loadAccount(req.user);
      if (!account.plan.forgeElayra) throw new HttpError(402, 'Il brief per Liria è incluso dal piano Part time in su.');
      await roomPartner(req.user, req.params.id);
      const who = account.nickname || 'Una di voi';
      await adminDb('forge_messages', {
        method: 'POST',
        body: {
          match_id: req.params.id,
          sender_id: null,
          role: 'elayra',
          content: `${who} ha confermato questo brief per Secretary Liria:\n\n${brief}`,
        },
      });
      res.status(201).json({ ok: true });
    })
  );

  // ── Collettivo: il cielo delle costellazioni ───────────────────────────

  app.get(
    '/api/sky',
    requireAuth,
    route(async (req, res) => {
      const { data } = await db(req.user, 'rpc/sky_state', { method: 'POST', body: {} });
      res.json(data);
    })
  );

  app.post(
    '/api/sky/claim',
    requireAuth,
    route(async (req, res) => {
      const id = typeof req.body?.constellation === 'string' ? req.body.constellation : '';
      if (!/^[A-Za-z]{2,4}$/.test(id)) throw new HttpError(400, 'Costellazione non valida');
      try {
        const { data } = await db(req.user, 'rpc/claim_constellation', { method: 'POST', body: { p_id: id } });
        res.status(201).json(data);
      } catch (e) {
        const detail = dbErrorText(e);
        if (detail.includes('not enough stars')) throw new HttpError(409, 'Non hai ancora abbastanza stelle per questa costellazione');
        if (detail.includes('already claimed')) throw new HttpError(409, 'Questa costellazione l’hai già reclamata');
        if (detail.includes('unknown constellation')) throw new HttpError(400, 'Costellazione non valida');
        throw e;
      }
    })
  );

  // ── Tarocchi: una lettura in regalo per chi completa le due pratiche del giorno ─

  /** Apre una risposta in streaming (Server-Sent Events) e la chiude se il browser se ne va. */
  const openStream = (res: Response) => {
    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();
    const abort = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) abort.abort();
    });
    const send = (event: string, payload: unknown) => res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
    return { send, signal: abort.signal, aborted: () => abort.signal.aborted };
  };

  type TarotRow = { id: string; day: string; cards: unknown; reading: string; created_at: string };
  const tarotView = (r: TarotRow) => ({ day: r.day, cards: describeCards(r.cards), reading: r.reading, createdAt: r.created_at });

  const tarotOptOut = async (user: AuthedUser) => {
    const { data } = await db<{ tarot_opt_out: boolean | null }[]>(user, 'profiles?select=tarot_opt_out');
    return Boolean(data?.[0]?.tarot_opt_out);
  };

  const ritualsOfDay = async (user: AuthedUser, day: string) => {
    const { data } = await db<RitualRow[]>(user, `rituals?select=kind,day,response,light_points&day=eq.${day}`);
    const find = (kind: string) => (data || []).find((r) => r.kind === kind) || null;
    return { morning: find('morning'), evening: find('evening') };
  };

  app.get(
    '/api/tarot',
    requireAuth,
    route(async (req, res) => {
      const day = parseDay(req.query.day);
      const [optOut, rituals, readings] = await Promise.all([
        tarotOptOut(req.user),
        ritualsOfDay(req.user, day),
        db<TarotRow[]>(req.user, `tarot_readings?select=id,day,cards,reading,created_at&day=eq.${day}`),
      ]);
      const row = readings.data?.[0];
      res.json({
        day,
        optOut,
        eligible: Boolean(rituals.morning && rituals.evening),
        reading: row && row.reading ? tarotView(row) : null,
      });
    })
  );

  app.get(
    '/api/tarot/readings',
    requireAuth,
    route(async (req, res) => {
      const { data } = await db<TarotRow[]>(
        req.user,
        "tarot_readings?select=id,day,cards,reading,created_at&reading=neq.&order=day.desc&limit=60"
      );
      res.json({ readings: (data || []).map(tarotView), optOut: await tarotOptOut(req.user) });
    })
  );

  app.post(
    '/api/tarot/settings',
    requireAuth,
    route(async (req, res) => {
      if (typeof req.body?.optOut !== 'boolean') throw new HttpError(400, 'Azione non valida');
      await db(req.user, `profiles?id=eq.${req.user.id}`, { method: 'PATCH', body: { tarot_opt_out: req.body.optOut } });
      res.json({ optOut: req.body.optOut });
    })
  );

  app.post(
    '/api/tarot/reading',
    requireAuth,
    route(async (req, res) => {
      const day = parseDay(req.body?.day);
      const rituals = await ritualsOfDay(req.user, day);
      if (!rituals.morning || !rituals.evening) {
        throw new HttpError(403, 'La lettura si apre quando completi entrambe le pratiche del giorno');
      }
      const { data: existing } = await db<TarotRow[]>(
        req.user,
        `tarot_readings?select=id,day,cards,reading,created_at&day=eq.${day}`
      );
      let row = existing?.[0];
      const stream = openStream(res);

      // Già letta: la si rimostra così com'è.
      if (row && row.reading) {
        const view = tarotView(row);
        stream.send('cards', { cards: view.cards });
        stream.send('done', view);
        return res.end();
      }

      try {
        // Le carte si estraggono una volta sola e restano quelle, anche se la lettura va ripetuta.
        if (!row) {
          const { data: inserted } = await adminDb<TarotRow[]>('tarot_readings?on_conflict=user_id,day', {
            method: 'POST',
            body: { user_id: req.user.id, day, cards: drawSpread(), reading: '', locale: currentLocale() },
            prefer: 'return=representation,resolution=merge-duplicates',
          });
          row = inserted[0];
        }
        const cards = describeCards(row.cards);
        stream.send('cards', { cards });

        const account = await loadAccount(req.user);
        const reading = await aiService.streamTarotReading({
          cards: cardsForPrompt(cards),
          nickname: account.nickname,
          morning: rituals.morning.response,
          evening: rituals.evening.response,
          onDelta: (text) => stream.send('delta', { text }),
          onReset: () => stream.send('reset', {}),
          signal: stream.signal,
          model: account.plan.tier === 'full' ? config.model : config.lightModel,
        });
        const { data: saved } = await adminDb<TarotRow[]>(`tarot_readings?id=eq.${row.id}`, {
          method: 'PATCH',
          body: { reading },
          prefer: 'return=representation',
        });
        stream.send('done', tarotView(saved?.[0] || { ...row, reading }));
      } catch (e) {
        if (!stream.aborted()) {
          console.error('Tarot error:', e instanceof Error ? e.message : e);
          stream.send('error', {
            message: translateError(e instanceof HttpError ? e.message : 'In questo momento non riesco a risponderti. Riprova tra poco.'),
          });
        }
      } finally {
        res.end();
      }
    })
  );

  // ── Report mensile di Elayra ───────────────────────────────────────────

  type ReportRow = { month: string; period: string; content: string; created_at: string };

  /** Chiave di un report salvato: 'first30' oppure 'AAAA-MM'. */
  const reportKey = (r: { month: string; period: string }) => (r.period === 'first30' ? 'first30' : r.month.slice(0, 7));

  const reportBasics = async (user: AuthedUser) => {
    const [days, reports] = await Promise.all([
      db<{ day: string }[]>(user, 'rpc/my_active_days', { method: 'POST', body: {} }),
      db<ReportRow[]>(user, 'monthly_reports?select=month,period,content,created_at&order=month.desc'),
    ]);
    const activeDays = (days.data || []).map((d) => String(d.day).slice(0, 10));
    const byKey = new Map((reports.data || []).map((r) => [reportKey(r), r]));
    const withReport = new Set([...byKey.keys()].filter((k) => k !== 'first30'));
    return { activeDays, byKey, withReport };
  };

  /** Il report è incluso nei piani a pagamento; con il piano gratuito si compra uno per uno. */
  const reportAccess = async (user: AuthedUser, period: ReportPeriod) => {
    const account = await loadAccount(user);
    if (account.plan.id !== 'free') return { allowed: true, included: true, account };
    const { data } = await db<{ id: string }[]>(
      user,
      `report_purchases?select=id&month=eq.${period.monthStart}&period=eq.${period.kind}&limit=1`
    );
    return { allowed: Boolean(data?.length), included: false, account };
  };

  const periodFromBody = async (user: AuthedUser, body: { period?: unknown; month?: unknown }) => {
    const basics = await reportBasics(user);
    const id = body?.period ?? body?.month;
    const period = resolvePeriod(id, basics.activeDays, basics.withReport);
    if (!period) throw new HttpError(404, 'Questo report non è ancora disponibile');
    return { period, basics };
  };

  app.get(
    '/api/reports',
    requireAuth,
    route(async (req, res) => {
      const [account, basics] = await Promise.all([loadAccount(req.user), reportBasics(req.user)]);
      const included = account.plan.id !== 'free';
      const { data: purchases } = await db<{ month: string; period: string }[]>(req.user, 'report_purchases?select=month,period');
      const paid = new Set((purchases || []).map((p) => reportKey(p)));
      const periods = availablePeriods(basics.activeDays, basics.withReport);
      res.json({
        included,
        priceCents: REPORT_PRICE_CENTS,
        activeDays: basics.activeDays.length,
        firstNeeded: FIRST_REPORT_DAYS,
        monthNeeded: MONTH_REPORT_DAYS,
        periods: periods.map((p) => {
          const r = basics.byKey.get(p.id);
          return {
            id: p.id,
            kind: p.kind,
            from: p.from,
            to: p.to,
            unlocked: included || paid.has(p.id),
            report: r ? { content: r.content, createdAt: r.created_at } : null,
          };
        }),
      });
    })
  );

  app.post(
    '/api/reports/checkout',
    requireAuth,
    route(async (req, res) => {
      const { period } = await periodFromBody(req.user, req.body);
      const access = await reportAccess(req.user, period);
      if (access.allowed) throw new HttpError(409, 'Questo report è già tuo');
      res.json({
        url: await createReportCheckout({ userId: req.user.id, email: req.user.email, month: period.monthStart, period: period.kind }),
      });
    })
  );

  app.post(
    '/api/reports/generate',
    requireAuth,
    route(async (req, res) => {
      const { period, basics } = await periodFromBody(req.user, req.body);
      const existing = basics.byKey.get(period.id);
      if (existing) {
        const stream = openStream(res);
        stream.send('done', { content: existing.content, createdAt: existing.created_at });
        return res.end();
      }
      const access = await reportAccess(req.user, period);
      if (!access.allowed) throw new HttpError(402, 'Questo report si sblocca con 0,99 € o con un piano a pagamento');

      const monthStart = period.from;
      const end = periodEndExclusive(period);
      const [entries, rituals, readings] = await Promise.all([
        db<{ mood: number; energy: string; sensation: string | null; content: string; created_at: string }[]>(
          req.user,
          `journal_entries?select=mood,energy,sensation,content,created_at&created_at=gte.${monthStart}&created_at=lt.${end}&order=created_at.asc&limit=300`
        ),
        db<RitualRow[]>(req.user, `rituals?select=kind,day,response,light_points&day=gte.${monthStart}&day=lt.${end}&order=day.asc&limit=300`),
        db<TarotRow[]>(
          req.user,
          `tarot_readings?select=id,day,cards,reading,created_at&day=gte.${monthStart}&day=lt.${end}&reading=neq.&order=day.asc&limit=90`
        ),
      ]);
      const clip = (text: string, n: number) => (text.length > n ? `${text.slice(0, n)}…` : text);
      const entriesText = (entries.data || [])
        .map((e) => `[${e.created_at.slice(0, 10)}] umore ${e.mood}/10, energia ${e.energy}${e.sensation ? `, corpo: ${e.sensation}` : ''}: ${clip(e.content, 700)}`)
        .join('\n')
        .slice(0, 30000);
      const ritualsText = (rituals.data || [])
        .map((r) => `[${r.day}] ${r.kind === 'morning' ? 'mattino' : 'sera'}: ${clip(r.response, 400)}`)
        .join('\n')
        .slice(0, 12000);
      const readingsText = (readings.data || [])
        .map((r) => {
          const cards = describeCards(r.cards)
            .map((c) => `${c.name.it}${c.reversed ? ' (capovolta)' : ''}`)
            .join(', ');
          return `[${r.day}] carte: ${cards}. Lettura: ${clip(r.reading, 900)}`;
        })
        .join('\n')
        .slice(0, 20000);
      if (!entriesText && !ritualsText && !readingsText) {
        throw new HttpError(404, 'In questo mese non c’è ancora niente da raccontare: scrivi nel diario o fai le pratiche, poi torna qui');
      }

      const tagLocale = currentLocale() === 'en' ? 'en-GB' : 'it-IT';
      const fmt = (d: string, opts: Intl.DateTimeFormatOptions) =>
        new Date(`${d}T12:00:00Z`).toLocaleDateString(tagLocale, { ...opts, timeZone: 'UTC' });
      const monthLabel =
        period.kind === 'first30'
          ? `i primi 30 giorni di uso, dal ${fmt(period.from, { day: 'numeric', month: 'long', year: 'numeric' })} al ${fmt(period.to, {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}`
          : fmt(period.from, { month: 'long', year: 'numeric' });
      const stream = openStream(res);
      try {
        const content = await aiService.streamMonthlyReport({
          monthLabel,
          period: period.kind,
          nickname: access.account.nickname,
          entries: entriesText,
          rituals: ritualsText,
          readings: readingsText,
          onDelta: (text) => stream.send('delta', { text }),
          onReset: () => stream.send('reset', {}),
          signal: stream.signal,
        });
        const { data: saved } = await adminDb<ReportRow[]>('monthly_reports?on_conflict=user_id,period,month', {
          method: 'POST',
          body: { user_id: req.user.id, month: period.monthStart, period: period.kind, content, locale: currentLocale() },
          prefer: 'return=representation,resolution=merge-duplicates',
        });
        stream.send('done', { content, createdAt: saved?.[0]?.created_at || new Date().toISOString() });
      } catch (e) {
        if (!stream.aborted()) {
          console.error('Report error:', e instanceof Error ? e.message : e);
          stream.send('error', {
            message: translateError(e instanceof HttpError ? e.message : 'In questo momento non riesco a risponderti. Riprova tra poco.'),
          });
        }
      } finally {
        res.end();
      }
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
    // Gli errori di Stripe hanno un tipo che inizia con "Stripe": si dice che il pagamento non è partito.
    const type = (err as { type?: unknown })?.type;
    if (typeof type === 'string' && type.startsWith('Stripe')) {
      return res.status(502).json({ error: 'Il pagamento non è partito. Riprova tra poco o scrivici a write@elayra.app.' });
    }
    res.status(500).json({ error: 'Errore interno' });
  });

  return app;
}
