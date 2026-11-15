import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3001),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
  supabaseUrl: (process.env.SUPABASE_URL || '').replace(/\/$/, ''),
  supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY || '',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:4173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  dailyMessageLimit: Number(process.env.DAILY_MESSAGE_LIMIT || 100),
  historyWindow: 30,
  maxMessageChars: 4000,
};
