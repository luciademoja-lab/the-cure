# Elayra — app mobile (Expo SDK 58)

App iOS/Android/web che parla con lo stesso backend della web app (`the-cure/apps/backend`).

- `src/app/` — solo rotte: `sign-in`, e dentro `(app)/` le schede **Elayra** (chat) e **Diario**
- `src/screens/` — il contenuto delle schermate
- `src/ctx.tsx` — sessione (login con Supabase)
- `src/lib/api.ts` — chiamate al backend, compresa la risposta di Elayra in streaming

## Avvio

```bash
npm install
npx expo start
```

Il file `.env` contiene già l'indirizzo del progetto Supabase. Controlla `EXPO_PUBLIC_API_URL`:

- simulatore iOS o browser sullo stesso Mac: `http://localhost:3001`
- telefono vero con Expo Go: l'IP del Mac in rete locale, es. `http://192.168.1.20:3001`
- dopo il deploy: l'indirizzo pubblico del backend

Il backend deve essere acceso (`cd ../backend && npm run dev`).

## Stato

Il codice supera il controllo dei tipi sulle parti nuove e l'export web (`npx expo export --platform web`).
Non è ancora stato provato su un telefono o simulatore.
