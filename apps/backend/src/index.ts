import { config } from './config';
import { createApp } from './app';

const app = createApp();

// Su Vercel l'app viene esportata e servita come funzione; in locale si mette in ascolto.
if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`Elayra API in ascolto su http://localhost:${config.port}`);
    if (!config.anthropicApiKey) console.warn('⚠ ANTHROPIC_API_KEY mancante: Elayra non può rispondere.');
    if (!config.supabaseUrl) console.warn('⚠ SUPABASE_URL mancante: login e database non funzionano.');
  });
}

export default app;
