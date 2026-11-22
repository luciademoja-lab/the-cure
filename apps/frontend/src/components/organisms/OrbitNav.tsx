import { CSSProperties, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/I18nProvider';
import { useAuth } from '../../contexts/AuthContext';
import { loadDiscovery, markDiscovered, pageByPath, PAGES, resetDiscovery, useDiscovery } from '../../lib/discovery';
import { ElayraWhisper } from '../atoms/ElayraWhisper';

/**
 * Menu orbitale (solo desktop).
 * - In home è un grande cerchio di parole luminose che ruota piano attorno al testo centrale.
 *   Passando sopra una parola il cerchio si ferma; cliccando si apre la pagina.
 * - Nelle altre pagine si rimpicciolisce e scivola in basso a sinistra, continuando a ruotare.
 *   Passandoci sopra si apre come menu a tendina.
 * - Tornando in home, si riespande attorno al testo.
 * - Chi è entrato vede solo le pagine che ha già scoperto; le altre sono posti vuoti.
 *   Alla prima visita il cerchio è fermo, "Journal" si illumina ed Elayra scrive accanto da dove partire.
 */

const DOCK_SIZE = 84; // diametro del piccolo astro in basso a sinistra
const DOCK_MARGIN = 24;
const MOBILE = 900;

function navbarHeight(): number {
  if (typeof document === 'undefined') return 72;
  return document.querySelector('.navbar')?.getBoundingClientRect().height || 72;
}

/** Il cerchio lascia spazio sotto per il sottotitolo della home. */
function ringDiameter(): number {
  if (typeof window === 'undefined') return 680;
  const room = window.innerHeight - navbarHeight();
  const widthShare = window.innerWidth < MOBILE ? 0.92 : 0.62;
  return Math.round(Math.min(room * 0.78, window.innerWidth * widthShare, 780));
}

export function OrbitNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [diameter, setDiameter] = useState(ringDiameter);
  const [viewport, setViewport] = useState(() =>
    typeof window === 'undefined'
      ? { w: 1280, h: 800, nav: 72 }
      : { w: window.innerWidth, h: window.innerHeight, nav: navbarHeight() }
  );
  const [paused, setPaused] = useState(false);
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  const isHome = location.pathname === '/';

  const { isAuthenticated, user } = useAuth();
  const visible = useDiscovery();

  // Le pagine scoperte: si ricaricano cambiando pagina (i Tarocchi si aprono da soli con la prima lettura),
  // e visitare una pagina nuova la accende.
  useEffect(() => {
    if (!isAuthenticated) {
      resetDiscovery();
      return;
    }
    void (async () => {
      await loadDiscovery();
      const page = pageByPath(location.pathname);
      if (page) await markDiscovered(page.key);
    })();
  }, [isAuthenticated, user?.id, location.pathname]);

  // Chi non è entrato vede tutto il cerchio (è la vetrina); chi è entrato solo ciò che ha scoperto.
  const shown = (key: string) => !isAuthenticated || (visible ? visible.includes(key as never) : key === 'journal');
  const links = PAGES.map((p) => ({ path: p.path, label: t(p.label), shown: shown(p.key) }));
  const guide = isAuthenticated && isHome && visible !== null && visible.length === 1;

  useEffect(() => {
    const onResize = () => {
      setDiameter(ringDiameter());
      setViewport({ w: window.innerWidth, h: window.innerHeight, nav: navbarHeight() });
    };
    onResize(); // la barra è già disegnata: misura la sua altezza vera
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Il titolo e la home usano le stesse misure del cerchio, prese dallo schermo visibile
  // (su telefono 100vh conta anche lo spazio della barra del browser e sposterebbe il testo).
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--nav-h', `${viewport.nav}px`);
    root.setProperty('--app-h', `${viewport.h}px`);
    root.setProperty('--orbit-cy', `${viewport.nav + ((viewport.h - viewport.nav) * 0.92) / 2}px`);
  }, [viewport.nav, viewport.h]);

  // La home è un'unica schermata: non scorre.
  useEffect(() => {
    document.documentElement.classList.toggle('is-home', isHome);
    return () => document.documentElement.classList.remove('is-home');
  }, [isHome]);

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

  // Al tocco (telefono) l'astro apre e chiude la tendina.
  const toggleMenu = () => {
    if (isHome) return;
    window.clearTimeout(closeTimer.current);
    setOpen((v) => !v);
  };

  const go = (path: string) => {
    setPaused(false);
    setOpen(false);
    navigate(path);
  };

  // Posizione e scala del cerchio: al centro della home, oppure piccolissimo in basso a sinistra.
  const homeX = viewport.w / 2 - diameter / 2;
  const homeY = viewport.nav + ((viewport.h - viewport.nav) * 0.92) / 2 - diameter / 2;
  const dockCenter = DOCK_MARGIN + DOCK_SIZE / 2;
  const dockX = dockCenter - diameter / 2;
  const dockY = viewport.h - dockCenter - diameter / 2;
  const scale = isHome ? 1 : DOCK_SIZE / diameter;
  const transform = isHome
    ? `translate(${homeX}px, ${homeY}px) scale(1)`
    : `translate(${dockX}px, ${dockY}px) scale(${scale})`;

  const small = viewport.w < MOBILE;
  const radius = diameter / 2 - (small ? 22 : 30);
  // Le scintille nello stato ridotto devono restare di circa 8px qualunque sia la grandezza del cerchio.
  const sparkScale = (8 / 10) / (DOCK_SIZE / diameter);
  const style = {
    width: diameter,
    height: diameter,
    transform,
    '--orbit-radius': `${radius}px`,
    '--spark-scale': sparkScale,
  } as CSSProperties;

  return (
    <>
      <div
        className={`orbit ${isHome ? 'orbit--home' : 'orbit--dock'} ${paused ? 'orbit--paused' : ''} ${open ? 'orbit--open' : ''} ${
          guide ? 'orbit--guide' : ''
        }`}
        style={style}
        onMouseEnter={small ? undefined : openMenu}
        onMouseLeave={small ? undefined : closeMenu}
        onClick={isHome ? undefined : toggleMenu}
        aria-hidden={!isHome}
      >
        <div className="orbit-halo" />
        <ul className="orbit-ring">
          {links.map(({ path, label, shown: isShown }, i) => {
            const angle = (360 / links.length) * i - 90;
            return (
              <li
                key={path}
                className={`orbit-slot ${isShown ? '' : 'is-empty'}`}
                style={{ transform: `rotate(${angle}deg) translate(var(--orbit-radius)) rotate(${-angle}deg)` }}
              >
                <span className="orbit-upright">
                  {!isShown ? (
                    <span className="orbit-empty" aria-hidden="true" />
                  ) : (
                  <>
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
                  {guide && path === '/journal' && (
                    <span className="orbit-guide-hint">
                      <ElayraWhisper text={t('guide.home')} delay={1400} />
                    </span>
                  )}
                  </>
                  )}
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
          onMouseEnter={small ? undefined : openMenu}
          onMouseLeave={small ? undefined : closeMenu}
          style={{ left: DOCK_MARGIN, bottom: DOCK_MARGIN + DOCK_SIZE + 10 }}
        >
          <button type="button" className="orbit-dropdown-link" onClick={() => go('/')}>
            ✦ {t('nav.home')}
          </button>
          {links.map(({ path, label, shown: isShown }) =>
            isShown ? (
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
            ) : (
              <span key={path} className="orbit-dropdown-empty" title={t('guide.emptySlot')}>
                · · ·
              </span>
            )
          )}
        </nav>
      )}
    </>
  );
}
