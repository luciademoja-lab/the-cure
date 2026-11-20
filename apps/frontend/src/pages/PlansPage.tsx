import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from '../i18n/I18nProvider';
import { apiPost } from '../lib/api';
import { PlanId, useAccount } from '../contexts/AccountContext';

const tag = (locale: string) => (locale === 'it' ? 'it-IT' : 'en-GB');
const euroIn = (locale: string) => (cents: number) =>
  (cents / 100).toLocaleString(tag(locale), { style: 'currency', currency: 'EUR' });
const dateIn = (locale: string) => (iso: string) =>
  new Date(iso).toLocaleDateString(tag(locale), { day: 'numeric', month: 'long', year: 'numeric' });

/** Piani, uso del mese e abbonamento. Il pagamento avviene sulla pagina sicura di Stripe. */
export function PlansPage() {
  const { t, locale } = useTranslation();
  const euro = euroIn(locale);
  const date = dateIn(locale);
  const { account, refresh } = useAccount();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const outcome = params.get('checkout');

  // Dopo il pagamento Stripe avvisa il server in pochi secondi: ricarichiamo un paio di volte.
  useEffect(() => {
    if (outcome !== 'success') return;
    const timers = [2500, 7000].map((ms) => window.setTimeout(() => void refresh(), ms));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [outcome, refresh]);

  const go = async (key: string, path: string, body?: unknown) => {
    setBusy(key);
    setError('');
    try {
      const { url } = await apiPost<{ url: string }>(path, body);
      window.location.assign(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('chat.error.generic'));
      setBusy(null);
    }
  };

  if (!account) return null;
  const current = account.plan;
  const percent = Math.min(100, Math.round((account.usage.used / Math.max(1, account.usage.limit)) * 100));
  const hasSubscription = Boolean(account.subscription && ['active', 'trialing', 'past_due'].includes(account.subscription.status));

  return (
    <main className="page-shell plans-page">
      <h1>{t('plans.title')}</h1>
      <p className="forge-lead">{t('plans.lead')}</p>

      {outcome === 'success' && (
        <p className="plans-notice" role="status">
          {t('plans.success')}
        </p>
      )}
      {outcome === 'cancel' && (
        <p className="plans-notice" role="status">
          {t('plans.cancel')}
        </p>
      )}
      {error && (
        <p className="page-error" role="alert">
          {error}
        </p>
      )}

      <section className="card forge-card plans-usage">
        <p>
          {t('plans.current')} <strong>{t(`plan.name.${current}`)}</strong>
        </p>
        <div className="path-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={t('plans.usageLabel')}>
          <div className="path-bar-fill" style={{ width: `${percent}%` }} />
        </div>
        <p className="path-next">{t('plans.usage', { used: account.usage.used, limit: account.usage.limit })}</p>
        {account.subscription?.sponsored_by && <p className="path-next">{t('plans.sponsored')}</p>}
        {account.grants.map((g) => (
          <p key={`${g.plan}-${g.ends_at}`} className="path-next">
            {t('plans.grant', { plan: t(`plan.name.${g.plan}`), date: date(g.ends_at) })}
          </p>
        ))}
        {hasSubscription && !account.subscription?.sponsored_by && (
          <button type="button" className="cta-button secondary" disabled={busy !== null} onClick={() => go('portal', '/api/billing/portal')}>
            {t('plans.manage')}
          </button>
        )}
      </section>

      <ul className="plans-grid">
        {account.plans.map((plan) => {
          const isCurrent = plan.id === current;
          return (
            <li key={plan.id} className={`card plan-card ${isCurrent ? 'current' : ''}`}>
              <h2>{t(`plan.name.${plan.id}`)}</h2>
              <p className="plan-price">
                {plan.priceCents === 0 ? t('plans.free') : <>{euro(plan.priceCents)}<span>{t('plans.perMonth')}</span></>}
              </p>
              <ul className="plan-features">
                <li>{t('plans.messages', { count: plan.monthlyMessages })}</li>
                <li>{plan.tier === 'full' ? t('plans.modelFull') : t('plans.modelLight')}</li>
                <li className={plan.forgeRooms ? '' : 'off'}>{t('plans.rooms')}</li>
                <li className={plan.forgeElayra ? '' : 'off'}>{t('plans.roomsElayra')}</li>
              </ul>
              {isCurrent ? (
                <p className="plan-badge">{t('plans.yourPlan')}</p>
              ) : plan.id !== 'free' && !hasSubscription ? (
                <button
                  type="button"
                  className="cta-button primary"
                  disabled={busy !== null}
                  onClick={() => go(plan.id, '/api/billing/checkout', { plan: plan.id as PlanId })}
                >
                  {busy === plan.id ? t('plans.redirect') : t('plans.choose')}
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="path-how">{t('plans.duo')}</p>
      <p className="path-how">{t('plans.fairUse')}</p>
    </main>
  );
}
