# Elayra — configurazione (da fare una volta)

## 1. Database

Lo schema nuovo è in `supabase/migrations/004_mfa_plans_sky.sql` (2FA, piani, archivio, cielo).
Si applica da Claude (che chiede conferma) oppure incollandolo in Supabase → SQL Editor → Run.

## 2. Chiave segreta di Supabase (solo backend)

Supabase → Project Settings → API Keys → **Secret keys** → copia la chiave `sb_secret_...`
e mettila in `apps/backend/.env`:

```
SUPABASE_SECRET_KEY=sb_secret_...
```

Non va mai nel frontend né su GitHub.

## 3. Accesso con Google

1. Google Cloud Console → APIs & Services → **OAuth consent screen**: crea la schermata (tipo "External", nome Elayra, tua email).
2. APIs & Services → **Credentials** → Create credentials → **OAuth client ID** → tipo "Web application".
   In "Authorized redirect URIs" aggiungi:
   `https://qnuppsbvherudhywgiqp.supabase.co/auth/v1/callback`
3. Copia Client ID e Client secret.
4. Supabase → Authentication → **Sign In / Providers** → Google → attiva e incolla i due valori.
5. Supabase → Authentication → **URL Configuration** → in "Redirect URLs" aggiungi `http://localhost:4173/**`
   (e più avanti l'indirizzo pubblico, es. `https://elayra.app/**`).

## 4. Verifica in due passaggi

È già attiva nei progetti Supabase. L'app la rende obbligatoria: senza il codice dell'app di
autenticazione il server e il database non rispondono.

Se una persona perde il telefono: Supabase → Authentication → Users → apri l'utente → elimina il
fattore MFA. Al prossimo accesso ne configurerà uno nuovo.

## 5. Stripe

Lavora prima in **modalità test** (interruttore "Test mode" in alto nella dashboard).

1. Stripe → Developers → API keys → copia la chiave segreta `sk_test_...` in `apps/backend/.env`:
   `STRIPE_SECRET_KEY=sk_test_...`
2. Crea prodotti, prezzi e coupon:
   ```
   cd apps/backend
   npm install
   npm run stripe:setup
   ```
3. Stripe → Settings → Billing → **Customer portal** → salva la configurazione (serve per "Gestisci abbonamento").
4. Webhook in locale: installa la Stripe CLI (`brew install stripe/stripe-cli/stripe`), poi
   ```
   stripe login
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```
   Copia il valore `whsec_...` che stampa in `STRIPE_WEBHOOK_SECRET`, poi riavvia il backend.
5. Prova un pagamento con la carta di test `4242 4242 4242 4242`, data futura qualsiasi, CVC qualsiasi.

Quando andrai online: ripeti i punti 1–3 in modalità live (`sk_live_...`) e crea il webhook dalla
dashboard (Developers → Webhooks) verso `https://<backend>/api/stripe/webhook` con gli eventi
`checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`,
`customer.subscription.deleted`.

## 6. Verifica

`GET http://localhost:3001/api/health` deve rispondere con tutto `configured` / `connected`.
