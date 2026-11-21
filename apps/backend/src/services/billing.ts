import Stripe from 'stripe';
import { config } from '../config';
import { DUO_COUPON_ID, DUO_PERCENT_OFF, isPlanId, PLANS, PlanId } from '../plans';
import { adminDb, HttpError } from './supabase';

let client: Stripe | null = null;
export function stripe(): Stripe {
  if (!config.stripeSecretKey) throw new HttpError(503, 'I pagamenti non sono ancora attivi: manca STRIPE_SECRET_KEY sul server');
  if (!client) client = new Stripe(config.stripeSecretKey);
  return client;
}

/**
 * Il prezzo mensile del piano su Stripe. Se non c'è ancora (primo acquisto dopo aver messo le chiavi),
 * lo crea: prodotto + prezzo con la lookup key del piano. Rilanciarlo non duplica nulla.
 */
export async function priceIdFor(plan: PlanId): Promise<string> {
  const def = PLANS[plan];
  const key = def.stripeLookupKey;
  if (!key) throw new HttpError(400, 'Questo piano non si acquista');
  const prices = await stripe().prices.list({ lookup_keys: [key], active: true, limit: 1 });
  if (prices.data[0]) return prices.data[0].id;
  const product = await stripe().products.create({ name: `Elayra — ${def.name}`, metadata: { elayra_plan: plan } });
  const price = await stripe().prices.create(
    {
      product: product.id,
      currency: 'eur',
      unit_amount: def.priceCents,
      recurring: { interval: 'month' },
      lookup_key: key,
      transfer_lookup_key: true,
      tax_behavior: 'inclusive',
    },
    { idempotencyKey: `elayra-price-${key}-${def.priceCents}` }
  );
  return price.id;
}

/** Il coupon del 20% per chi paga per due; creato la prima volta che serve. */
export async function ensureDuoCoupon(): Promise<void> {
  try {
    await stripe().coupons.retrieve(DUO_COUPON_ID);
  } catch {
    try {
      await stripe().coupons.create({
        id: DUO_COUPON_ID,
        name: `Abbonamento per due −${DUO_PERCENT_OFF}%`,
        percent_off: DUO_PERCENT_OFF,
        duration: 'forever',
      });
    } catch (e) {
      // Creato nel frattempo da un'altra richiesta: va bene.
      if (!(e instanceof Stripe.errors.StripeError && e.code === 'resource_already_exists')) throw e;
    }
  }
}

export async function customerIdFor(userId: string): Promise<string | null> {
  const { data } = await adminDb<{ stripe_customer_id: string }[]>(
    `billing_customers?select=stripe_customer_id&user_id=eq.${userId}`
  );
  return data?.[0]?.stripe_customer_id || null;
}

export async function activeSubscription(userId: string): Promise<{ plan: string; status: string } | null> {
  const { data } = await adminDb<{ plan: string; status: string }[]>(
    `subscriptions?select=plan,status&user_id=eq.${userId}&status=in.(active,trialing,past_due)`
  );
  return data?.[0] || null;
}

/** Pagina di pagamento Stripe. Con `sponsoredUserId` paga due abbonamenti (sé + l'altra persona) con il 20% di sconto. */
export async function createCheckout(opts: {
  userId: string;
  email?: string;
  plan: PlanId;
  sponsoredUserId?: string;
}): Promise<string> {
  const price = await priceIdFor(opts.plan);
  if (opts.sponsoredUserId) await ensureDuoCoupon();
  const customer = await customerIdFor(opts.userId);
  const metadata: Record<string, string> = { user_id: opts.userId, plan: opts.plan };
  if (opts.sponsoredUserId) metadata.sponsored_user_id = opts.sponsoredUserId;

  const session = await stripe().checkout.sessions.create({
    mode: 'subscription',
    client_reference_id: opts.userId,
    ...(customer ? { customer } : opts.email ? { customer_email: opts.email } : {}),
    line_items: [{ price, quantity: opts.sponsoredUserId ? 2 : 1 }],
    ...(opts.sponsoredUserId ? { discounts: [{ coupon: DUO_COUPON_ID }] } : {}),
    subscription_data: { metadata },
    metadata,
    success_url: `${config.appUrl}/plans?checkout=success`,
    cancel_url: `${config.appUrl}/plans?checkout=cancel`,
  });
  if (!session.url) throw new HttpError(502, 'Stripe non ha restituito la pagina di pagamento');
  return session.url;
}

/** Prezzo del report mensile per chi ha il piano gratuito. */
export const REPORT_PRICE_CENTS = 99;

/** Pagamento singolo (non un abbonamento) per il report di un mese. */
export async function createReportCheckout(opts: { userId: string; email?: string; month: string }): Promise<string> {
  const customer = await customerIdFor(opts.userId);
  const metadata = { user_id: opts.userId, kind: 'report', month: opts.month };
  const session = await stripe().checkout.sessions.create({
    mode: 'payment',
    client_reference_id: opts.userId,
    ...(customer ? { customer } : opts.email ? { customer_email: opts.email } : {}),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: REPORT_PRICE_CENTS,
          product_data: { name: `Elayra — Report ${opts.month.slice(0, 7)}` },
        },
      },
    ],
    metadata,
    payment_intent_data: { metadata },
    success_url: `${config.appUrl}/tarot?report=${opts.month.slice(0, 7)}&checkout=success`,
    cancel_url: `${config.appUrl}/tarot?checkout=cancel`,
  });
  if (!session.url) throw new HttpError(502, 'Stripe non ha restituito la pagina di pagamento');
  return session.url;
}

/** Registra un report pagato. Rilanciarlo con la stessa sessione non duplica nulla. */
export async function recordReportPurchase(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.user_id;
  const month = session.metadata?.month;
  if (!userId || !month || !/^\d{4}-\d{2}-01$/.test(month) || session.payment_status !== 'paid') return;
  await adminDb('report_purchases?on_conflict=stripe_session_id', {
    method: 'POST',
    body: { user_id: userId, month, stripe_session_id: session.id },
    prefer: 'resolution=ignore-duplicates',
  });
}

export async function createPortal(userId: string): Promise<string> {
  const customer = await customerIdFor(userId);
  if (!customer) throw new HttpError(404, 'Non hai ancora un abbonamento');
  const session = await stripe().billingPortal.sessions.create({ customer, return_url: `${config.appUrl}/plans` });
  return session.url;
}

function periodEnd(sub: Stripe.Subscription): string | null {
  const legacy = (sub as unknown as { current_period_end?: number }).current_period_end;
  const fromItem = sub.items?.data?.[0]?.current_period_end;
  const seconds = typeof fromItem === 'number' ? fromItem : legacy;
  return typeof seconds === 'number' ? new Date(seconds * 1000).toISOString() : null;
}

/** Copia lo stato di un abbonamento Stripe nel database (per chi paga ed eventualmente per la persona regalata). */
export async function syncSubscription(sub: Stripe.Subscription): Promise<void> {
  const userId = sub.metadata?.user_id;
  const plan = sub.metadata?.plan;
  if (!userId || !isPlanId(plan) || plan === 'free') {
    console.warn('Stripe subscription without Elayra metadata', sub.id);
    return;
  }
  const customer = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  await adminDb('billing_customers?on_conflict=user_id', {
    method: 'POST',
    body: { user_id: userId, stripe_customer_id: customer },
    prefer: 'resolution=merge-duplicates',
  });

  const base = {
    plan,
    status: sub.status,
    stripe_subscription_id: sub.id,
    current_period_end: periodEnd(sub),
    updated_at: new Date().toISOString(),
  };
  const rows: Record<string, unknown>[] = [{ user_id: userId, sponsored_by: null, ...base }];
  const sponsored = sub.metadata?.sponsored_user_id;
  if (sponsored) rows.push({ user_id: sponsored, sponsored_by: userId, ...base });

  await adminDb('subscriptions?on_conflict=user_id', {
    method: 'POST',
    body: rows,
    prefer: 'resolution=merge-duplicates',
  });
}

/** Riceve gli eventi di Stripe. Verifica la firma: senza, chiunque potrebbe regalarsi un abbonamento. */
export async function handleWebhook(rawBody: Buffer, signature: string | undefined): Promise<string> {
  if (!config.stripeWebhookSecret) throw new HttpError(503, 'Manca STRIPE_WEBHOOK_SECRET sul server');
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(rawBody, signature || '', config.stripeWebhookSecret);
  } catch {
    throw new HttpError(400, 'Firma Stripe non valida');
  }

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.kind === 'report') {
        await recordReportPurchase(session);
        break;
      }
      const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
      if (subId) await syncSubscription(await stripe().subscriptions.retrieve(subId));
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    default:
      break;
  }
  return event.type;
}
