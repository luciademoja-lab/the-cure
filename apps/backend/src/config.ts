import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3001),
  appUrl: (process.env.APP_URL || 'http://localhost:4173').replace(/\/$/, ''),

  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  /** Modello per i piani a pagamento (Elayra "piena"). */
  model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
  /** Modello economico: piano gratuito e lavori di sfondo (diario, valutazione Forgia). */
  lightModel: process.env.ANTHROPIC_LIGHT_MODEL || 'claude-haiku-5-5',

  supabaseUrl: (process.env.SUPABASE_URL || '').replace(/\/$/, ''),
  supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY || '',
  /** Chiave segreta del progetto: serve solo al server (webhook Stripe, messaggi di Elayra nelle stanze). */
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY || '',

  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',

  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:4173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  historyWindow: 30,
  maxMessageChars: 4000,
};
