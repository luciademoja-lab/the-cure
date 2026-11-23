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

  /** Email transazionali (per ora solo il codice del secondo passaggio). La chiave resta solo sul server. */
  resendApiKey: process.env.RESEND_API_KEY || '',
  mailFrom: process.env.MAIL_FROM || 'Elayra <accesso@elayra.app>',

  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  // Secretary Liria: dove arrivano i brief e il codice sconto del 5% (Part time in su).
  liriaEmail: process.env.LIRIA_EMAIL || 'Liria@SecretaryLiria.com',
  liriaDiscountCode: process.env.LIRIA_DISCOUNT_CODE || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',

  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:4173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  /**
   * Tetto di sicurezza: quanto possono costare in un giorno (dollari, UTC) le risposte di Elayra
   * a chi usa il piano gratuito. Superato il tetto, il piano gratuito riprende il giorno dopo; i piani a pagamento mai.
   * 0 lo spegne.
   */
  freeDailyBudgetUsd: Number(process.env.AI_FREE_DAILY_BUDGET_USD ?? 10),
  historyWindow: 30,
  maxMessageChars: 4000,
};
