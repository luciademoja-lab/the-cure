# Elayra — app (versione collegata a Claude)

Questa cartella contiene la versione viva dell'app. La cartella `src/` alla radice del repo è la vecchia copia senza backend.

```
apps/backend    API Express: chat con Elayra (Claude), diario, verifica del login
apps/frontend   Web app React/Vite: login, finestra di chat, diario
supabase/       Schema del database (da applicare al progetto Supabase)
```

## Come funziona la chat

1. La persona scrive nella finestra di chat (pagina Journal).
2. Il frontend manda il messaggio a `POST /api/chat` con il token di sessione.
3. Il backend verifica il token con Supabase, salva il messaggio, recupera gli ultimi 30 messaggi
   e chiama Claude con la voce di Elayra (`apps/backend/src/elayra.prompt.ts`).
4. La risposta arriva in streaming e viene salvata: riaprendo l'app la conversazione è ancora lì.
5. "Termina e salva" trasforma la conversazione in una pagina di diario (`POST /api/journal/from-chat`).

## Avvio in locale

```bash
# backend
cd apps/backend
cp .env.example .env      # poi riempi ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev               # http://localhost:3001

# frontend (altro terminale)
cd apps/frontend
cp .env.example .env      # poi riempi VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev               # http://localhost:4173
```

`GET /api/health` dice se la chiave di Claude e il database sono configurati.

## API (la stessa per web ed Expo)

Tutte le rotte tranne `/api/health` vogliono `Authorization: Bearer <access_token Supabase>`.

| Metodo | Rotta | Cosa fa |
|---|---|---|
| GET | `/api/health` | Stato della configurazione |
| GET | `/api/chat/history` | Ultimi 60 messaggi |
| POST | `/api/chat` `{content}` | Risposta di Elayra in streaming (SSE: `delta`, `done`, `error`) |
| DELETE | `/api/chat/history` | Cancella tutta la conversazione |
| GET | `/api/journal` | Pagine di diario |
| POST | `/api/journal/from-chat` | Conversazione → pagina di diario |
| DELETE | `/api/journal/:id` | Cancella una pagina |

## Test

```bash
cd apps/backend && npm test     # 12 test: auth, chat, limiti, diario
cd apps/frontend && npm test
```
