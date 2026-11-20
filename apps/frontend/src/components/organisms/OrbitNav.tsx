import { CSSProperties, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/I18nProvider';

/**
 * Menu orbitale (solo desktop).
 * - In home è un grande cerchio di parole luminose che ruota piano attorno al testo centrale.
 *   Passando sopra una parola il cerchio si ferma; cliccando si apre la pagina.
 * - Nelle altre pagine si rimpicciolisce e scivola in basso a sinistra, continuando a ruotare.
 *   Passandoci sopra si apre come menu a tendina.
 * - Tornando in home, si riespande attorno al testo.
 */

const NAVBAR_HEIGHT = 72; // il testo della home è centrato nello spazio sotto la barra
const DOCK_SIZE = 84; // diametro del piccolo astro in basso a sinistra
const DOCK_MARGIN = 28;

function ringDiameter(): number {
  if (typeof window === 'undefined') return 680;
  return Math.round(Math.min(window.innerHeight * 0.8, window.innerWidth * 0.62, 720));
}

export function OrbitNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [diameter, setDiameter] = useState(ringDiameter);
  const [viewport, setViewport] = useState(() =>
    typeof window === 'undefined' ? { w: 1280, h: 800 } : { w: window.innerWidth, h: window.innerHeight }
  );
  const [paused, setPaused] = useState(false);
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  const isHome = location.pathname === '/';

  const links = [
    { path: '/journal', label: t('nav.journal') },
    { path: '/daily-light', label: t('nav.dailyLight') },
    { path: '/gaming', label: t('nav.path') },
    { path: '/synchronicities', label: t('nav.synchronicities') },
    { path: '/forge', label: t('nav.forge') },
    { path: '/collective', label: t('nav.collective') },
    { path: '/plans', label: t('nav.plans') },
  ];

  useEffect(() => {
    const onResize = () => {
      setDiameter(ringDiameter());
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Cambiando pagina: la tendina si chiude e il cerchio riparte.
  useEffect(() => {
    setOpen(false);
    setPaused(false);
  }, [location.pathname]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const openMenu = () => {
    if (isHome) return;
    window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const closeMenu = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 350);
  };

  const go = (path: string) => {
    setPaused(false);
    setOpen(false);
    navigate(path);
  };

  // Posizione e scala del cerchio: al centro della home, oppure piccolissimo in basso a sinistra.
  const homeX = viewport.w / 2 - diameter / 2;
  const homeY = NAVBAR_HEIGHT + (viewport.h - NAVBAR_HEIGHT) / 2 - diameter / 2;
  const dockCenter = DOCK_MARGIN + DOCK_SIZE / 2;
  const dockX = dockCenter - diameter / 2;
  const dockY = viewport.h - dockCenter - diameter / 2;
  const scale = isHome ? 1 : DOCK_SIZE / diameter;
  const transform = isHome
    ? `translate(${homeX}px, ${homeY}px) scale(1)`
    : `translate(${dockX}px, ${dockY}px) scale(${scale})`;

  const radius = diameter / 2 - 54;
  const style = { width: diameter, height: diameter, transform, '--orbit-radius': `${radius}px` } as CSSProperties;

  return (
    <>
      <div
        className={`orbit ${isHome ? 'orbit--home' : 'orbit--dock'} ${paused ? 'orbit--paused' : ''} ${open ? 'orbit--open' : ''}`}
        style={style}
        onMouseEnter={openMenu}
        onMouseLeave={closeMenu}
        aria-hidden={!isHome}
      >
        <div className="orbit-halo" />
        <ul className="orbit-ring">
          {links.map(({ path, label }, i) => {
            const angle = (360 / links.length) * i - 90;
            return (
              <li
                key={path}
                className="orbit-slot"
                style={{ transform: `rotate(${angle}deg) translate(var(--orbit-radius)) rotate(${-angle}deg)` }}
              >
                <span className="orbit-upright">
                  <button
                    type="button"
                    className={`orbit-word ${location.pathname === path ? 'is-current' : ''}`}
                    tabIndex={isHome ? 0 : -1}
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                    onFocus={() => setPaused(true)}
                    onBlur={() => setPaused(false)}
                    onClick={() => go(path)}
                  >
                    {label}
                  </button>
                  <span className="orbit-spark" aria-hidden="true" />
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {!isHome && (
        <nav
          className={`orbit-dropdown ${open ? 'is-open' : ''}`}
          aria-label={t('nav.home')}
          onMouseEnter={openMenu}
          onMouseLeave={closeMenu}
          style={{ left: DOCK_MARGIN, bottom: DOCK_MARGIN + DOCK_SIZE + 10 }}
        >
          <button type="button" className="orbit-dropdown-link" onClick={() => go('/')}>
            ✦ {t('nav.home')}
          </button>
          {links.map(({ path, label }) => (
            <button
              key={path}
              type="button"
              className={`orbit-dropdown-link ${location.pathname === path ? 'is-current' : ''}`}
              onClick={() => go(path)}
              onFocus={openMenu}
              onBlur={closeMenu}
            >
              {label}
            </button>
          ))}
        </nav>
      )}
    </>
  );
}
