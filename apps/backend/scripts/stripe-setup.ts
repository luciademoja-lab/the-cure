/**
 * Crea su Stripe i prodotti, i prezzi mensili e il coupon del 20% per due.
 * Si può rilanciare: se qualcosa esiste già non lo duplica.
 *
 *   npm run stripe:setup
 */
import Stripe from 'stripe';
import { config } from '../src/config';
import { DUO_COUPON_ID, DUO_PERCENT_OFF, PAID_PLANS, PLANS } from '../src/plans';

async function main() {
  if (!config.stripeSecretKey) throw new Error('Metti STRIPE_SECRET_KEY nel file .env');
  const stripe = new Stripe(config.stripeSecretKey);
  const mode = config.stripeSecretKey.startsWith('sk_live') ? 'LIVE (soldi veri)' : 'TEST';
  console.log(`Stripe in modalità ${mode}\n`);

  for (const id of PAID_PLANS) {
    const plan = PLANS[id];
    const lookup = plan.stripeLookupKey as string;
    const existing = await stripe.prices.list({ lookup_keys: [lookup], limit: 1 });
    if (existing.data[0]) {
      console.log(`✓ ${plan.name}: già presente (${existing.data[0].id})`);
      continue;
    }
    const product = await stripe.products.create({
      name: `Elayra — ${plan.name}`,
      metadata: { elayra_plan: id },
    });
    const price = await stripe.prices.create({
      product: product.id,
      currency: 'eur',
      unit_amount: plan.priceCents,
      recurring: { interval: 'month' },
      lookup_key: lookup,
      tax_behavior: 'inclusive',
    });
    console.log(`+ ${plan.name}: creato ${price.id} (${(plan.priceCents / 100).toFixed(2)} €/mese)`);
  }

  try {
    await stripe.coupons.retrieve(DUO_COUPON_ID);
    console.log(`✓ Coupon ${DUO_COUPON_ID}: già presente`);
  } catch {
    await stripe.coupons.create({
      id: DUO_COUPON_ID,
      name: `Abbonamento per due −${DUO_PERCENT_OFF}%`,
      percent_off: DUO_PERCENT_OFF,
      duration: 'forever',
    });
    console.log(`+ Coupon ${DUO_COUPON_ID}: creato`);
  }
  console.log('\nFatto.');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
