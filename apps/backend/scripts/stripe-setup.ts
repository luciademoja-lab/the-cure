/**
 * Crea su Stripe i prodotti, i prezzi mensili e il coupon del 20% per due.
 * Non è obbligatorio: il server li crea da solo al primo acquisto. Serve per prepararli in anticipo.
 * Si può rilanciare: se qualcosa esiste già non lo duplica.
 *
 *   npm run stripe:setup
 */
import { config } from '../src/config';
import { PAID_PLANS, PLANS } from '../src/plans';
import { ensureDuoCoupon, priceIdFor } from '../src/services/billing';

async function main() {
  if (!config.stripeSecretKey) throw new Error('Metti STRIPE_SECRET_KEY nel file .env');
  const mode = config.stripeSecretKey.startsWith('sk_live') || config.stripeSecretKey.startsWith('rk_live') ? 'LIVE (soldi veri)' : 'TEST';
  console.log(`Stripe in modalità ${mode}\n`);
  for (const id of PAID_PLANS) console.log(`✓ ${PLANS[id].name}: ${await priceIdFor(id)}`);
  await ensureDuoCoupon();
  console.log('✓ Coupon per due pronto\nFatto.');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
