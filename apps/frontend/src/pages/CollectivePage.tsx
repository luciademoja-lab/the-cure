import { useEffect, useMemo, useRef, useState } from 'react';
import { geoPath } from 'd3-geo';
import { useTranslation } from '../i18n/I18nProvider';
import { apiGet, apiPost } from '../lib/api';
import { useAccount } from '../contexts/AccountContext';
import {
  claimable,
  Constellation,
  CONSTELLATIONS,
  constellationLines,
  displayName,
  figurePath,
  graticule,
  nextTarget,
  REWARD_MIN_STARS,
  rotationTo,
  skyProjection,
} from '../lib/sky';

type SkyState = {
  claims: Record<string, number>;
  mine: string[];
  availableStars: number;
  invited: number;
  usedStars: number;
  people: number;
  myCode: string | null;
};

const SIZE = 640;

/**
 * Il Collettivo: il cielo vero, con le costellazioni dove stanno guardando dalla Terra.
 * Si accendono quelle già reclamate; le stelle di chi guarda (le persone invitate) formano
 * la prima costellazione in ordine alfabetico che si può reclamare.
 */
export function CollectivePage() {
  const { t, locale } = useTranslation();
  const { refresh } = useAccount();
  const [sky, setSky] = useState<SkyState | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [rotation, setRotation] = useState<[number, number]>(() => rotationTo(CONSTELLATIONS.find((c) => c.id === 'Ori')!));
  const [zoom, setZoom] = useState(1);
  const [focus, setFocus] = useState<string | null>(null);
  const [offerIndex, setOfferIndex] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [copied, setCopied] = useState(false);
  const drag = useRef<{ x: number; y: number; rot: [number, number] } | null>(null);

  const load = async () => {
    try {
      setSky(await apiGet<SkyState>('/api/sky'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('chat.error.generic'));
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const projection = useMemo(() => skyProjection(SIZE, rotation, zoom), [rotation, zoom]);
  const path = useMemo(() => geoPath(projection).pointRadius(1.6), [projection]);
  const mine = useMemo(() => new Set(sky?.mine || []), [sky]);
  const offers = useMemo(() => (sky ? claimable(sky.mine, sky.availableStars, locale) : []), [sky, locale]);
  const offer: Constellation | null = offers.length ? offers[Math.min(offerIndex, offers.length - 1)] : null;
  const target = useMemo(() => (sky && !offer ? nextTarget(sky.mine, locale) : null), [sky, offer, locale]);
  const focused = focus ? CONSTELLATIONS.find((c) => c.id === focus) || null : null;

  const travelTo = (c: Constellation) => {
    setFocus(c.id);
    setRotation(rotationTo(c));
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, rot: rotation };
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag.current) return;
    const rect = (e.currentTarget as Element).getBoundingClientRect();
    const k = (180 / (rect.width * zoom)) * 1.1;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    const [l, p] = drag.current.rot;
    // Il cielo è rovesciato orizzontalmente: trascinare a destra porta in vista ciò che sta a est.
    setRotation([l - dx * k, Math.max(-90, Math.min(90, p - dy * k))]);
  };
  const onPointerUp = () => {
    drag.current = null;
  };
  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    setZoom((z) => Math.max(0.8, Math.min(6, z * (e.deltaY < 0 ? 1.12 : 0.89))));
  };

  const claim = async (c: Constellation) => {
    setClaiming(true);
    setError('');
    setNotice('');
    try {
      const result = await apiPost<{ rewarded: boolean }>('/api/sky/claim', { constellation: c.id });
      setNotice(result.rewarded ? t('sky.claimedReward', { name: displayName(c, locale) }) : t('sky.claimed', { name: displayName(c, locale) }));
      setOfferIndex(0);
      await load();
      travelTo(c);
      void refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('chat.error.generic'));
    } finally {
      setClaiming(false);
    }
  };

  const regenerate = async () => {
    if (!window.confirm(t('sky.regenerateConfirm'))) return;
    try {
      const { referralCode } = await apiPost<{ referralCode: string }>('/api/referral/regenerate');
      setSky((prev) => (prev ? { ...prev, myCode: referralCode } : prev));
      setCopied(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('chat.error.generic'));
    }
  };

  const inviteLink = sky?.myCode ? `${window.location.origin}/register?ref=${sky.myCode}` : '';
  const pending = sky ? Math.max(0, sky.invited - sky.availableStars - sky.usedStars) : 0;
  const totalClaims = sky ? Object.values(sky.claims).reduce((a, b) => a + b, 0) : 0;

  return (
    <main className="page-shell collective-map-page">
      <h1>{t('collective.mapTitle')}</h1>
      <p className="forge-lead">{t('sky.lead')}</p>

      {error && (
        <p className="page-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="plans-notice" role="status">
          {notice}
        </p>
      )}

      {sky && (
        <>
          <div className="sky-layout">
            <div className="constellation-frame sky-frame">
              <svg
                className="constellation sky"
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                role="img"
                aria-label={t('sky.mapLabel', { claimed: Object.keys(sky.claims).length })}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onWheel={onWheel}
              >
                <defs>
                  <radialGradient id="sky-bg">
                    <stop offset="0%" stopColor="#14100a" />
                    <stop offset="100%" stopColor="#030302" />
                  </radialGradient>
                </defs>
                <path d={path({ type: 'Sphere' }) || ''} fill="url(#sky-bg)" className="sky-sphere" />
                <path d={path(graticule) || ''} className="sky-graticule" />
                {CONSTELLATIONS.map((c) => {
                  const count = sky.claims[c.id] || 0;
                  const state = mine.has(c.id) ? 'mine' : count > 0 ? 'claimed' : 'open';
                  const glow = count > 0 ? Math.min(1, 0.45 + Math.log2(1 + count) * 0.18) : undefined;
                  return (
                    <g
                      key={c.id}
                      className={`sky-constellation ${state} ${focus === c.id ? 'focused' : ''}`}
                      style={glow ? { opacity: glow } : undefined}
                      onClick={() => setFocus(c.id)}
                    >
                      <path d={path(constellationLines(c)) || ''} className="sky-lines" />
                      <path d={path({ type: 'MultiPoint', coordinates: c.stars }) || ''} className="sky-stars" />
                    </g>
                  );
                })}
              </svg>
              <div className="sky-controls">
                <button type="button" className="forge-link" onClick={() => setZoom((z) => Math.min(6, z * 1.3))} aria-label={t('sky.zoomIn')}>
                  +
                </button>
                <button type="button" className="forge-link" onClick={() => setZoom((z) => Math.max(0.8, z / 1.3))} aria-label={t('sky.zoomOut')}>
                  −
                </button>
                <select
                  aria-label={t('sky.travel')}
                  value={focus || ''}
                  onChange={(e) => {
                    const c = CONSTELLATIONS.find((x) => x.id === e.target.value);
                    if (c) travelTo(c);
                  }}
                >
                  <option value="">{t('sky.travel')}</option>
                  {[...CONSTELLATIONS]
                    .sort((a, b) => displayName(a, locale).localeCompare(displayName(b, locale), locale))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {displayName(c, locale)}
                        {sky.claims[c.id] ? ` · ${sky.claims[c.id]}` : ''}
                      </option>
                    ))}
                </select>
              </div>
              {focused && (
                <p className="sky-focus">
                  <strong>{displayName(focused, locale)}</strong> · {t('sky.starsCount', { count: focused.stars.length })} ·{' '}
                  {sky.claims[focused.id] ? t('sky.claimedBy', { count: sky.claims[focused.id] }) : t('sky.nobody')}
                  {mine.has(focused.id) ? ` · ${t('sky.yours')}` : ''}
                </p>
              )}
            </div>

            <aside className="card forge-card sky-panel">
              <h2>{t('sky.yourStars')}</h2>
              <p className="path-points">{sky.availableStars}</p>
              <p className="path-next">{t('sky.starsHint')}</p>

              {offer ? (
                <>
                  <ConstellationFigure c={offer} lit={offer.stars.length} />
                  <h3 className="sky-offer-name">{displayName(offer, locale)}</h3>
                  <p className="path-next">
                    {t('sky.starsCount', { count: offer.stars.length })}
                    {offer.stars.length >= REWARD_MIN_STARS ? ` · ${t('sky.rewardYes')}` : ` · ${t('sky.rewardNo')}`}
                  </p>
                  {offers.length > 1 && (
                    <div className="sky-offer-nav">
                      <button type="button" className="forge-link" onClick={() => setOfferIndex((i) => (i - 1 + offers.length) % offers.length)} aria-label={t('sky.prev')}>
                        ‹
                      </button>
                      <span>
                        {Math.min(offerIndex, offers.length - 1) + 1} / {offers.length}
                      </span>
                      <button type="button" className="forge-link" onClick={() => setOfferIndex((i) => (i + 1) % offers.length)} aria-label={t('sky.next')}>
                        ›
                      </button>
                    </div>
                  )}
                  <button type="button" className="cta-button primary" disabled={claiming} onClick={() => claim(offer)}>
                    {t('sky.claim')}
                  </button>
                  {offer.stars.length < REWARD_MIN_STARS && <p className="chat-disclaimer">{t('sky.waitHint')}</p>}
                </>
              ) : target ? (
                <>
                  <ConstellationFigure c={target} lit={sky.availableStars} />
                  <p className="path-next">{t('sky.nextTarget', { name: displayName(target, locale), count: target.stars.length - sky.availableStars })}</p>
                </>
              ) : (
                <p className="path-next">{t('sky.allClaimed')}</p>
              )}
            </aside>
          </div>

          <ul className="constellation-legend">
            <li className="me">{t('sky.legendMine')}</li>
            <li className="mine">{t('sky.legendClaimed')}</li>
            <li>{t('sky.legendOpen')}</li>
          </ul>

          <section className="card forge-card constellation-stats">
            <p>{t('collective.count', { count: sky.people })}</p>
            <p>{t('sky.totalClaims', { count: totalClaims, constellations: Object.keys(sky.claims).length })}</p>
            <p>{t('collective.invited', { count: sky.invited })}</p>
            {pending > 0 && <p className="path-next">{t('sky.pending', { count: pending })}</p>}
            <p className="path-how">{t('sky.rules')}</p>
            {inviteLink && (
              <div className="form-group">
                <label htmlFor="invite-link">{t('collective.linkLabel')}</label>
                <div className="constellation-link">
                  <input id="invite-link" type="text" readOnly value={inviteLink} onFocus={(e) => e.currentTarget.select()} />
                  <button
                    type="button"
                    className="cta-button secondary"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(inviteLink);
                        setCopied(true);
                      } catch {
                        setCopied(false);
                      }
                    }}
                  >
                    {t('collective.copy')}
                  </button>
                </div>
                <p className="path-next">
                  {t('sky.code')} <code>{sky.myCode}</code>
                  {copied && <span className="path-saved"> · {t('collective.copied')}</span>}
                </p>
                <button type="button" className="forge-link" onClick={regenerate}>
                  {t('sky.regenerate')}
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

/** La figura di una costellazione con le stelle accese: `lit` stelle su tutte quelle della figura. */
function ConstellationFigure({ c, lit }: { c: Constellation; lit: number }) {
  const W = 260;
  const H = 200;
  const { projection } = figurePath(c, W, H);
  const points = c.stars.map((s) => projection(s) || [0, 0]);
  return (
    <svg className="sky-figure" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${c.name}: ${Math.min(lit, c.stars.length)}/${c.stars.length}`}>
      {c.lines.map(([a, b], i) => (
        <line
          key={i}
          x1={points[a][0]}
          y1={points[a][1]}
          x2={points[b][0]}
          y2={points[b][1]}
          className={`sky-figure-line ${a < lit && b < lit ? 'lit' : ''}`}
        />
      ))}
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i < lit ? 4 : 2.5} className={`sky-figure-star ${i < lit ? 'lit' : ''}`} />
      ))}
    </svg>
  );
}
