import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../../i18n/I18nProvider';
import { LEGAL } from '../../lib/legal';
import { SacredSymbol } from '../atoms/SacredSymbol';

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  const { pathname } = useLocation();

  // In home il cerchio occupa lo schermo: solo una riga di link sotto il sottotitolo.
  if (pathname === '/') {
    return (
      <nav className="landing-legal" aria-label={t('footer.label')}>
        <Link to="/faq">FAQ</Link>
        <Link to="/privacy">{t('footer.privacy')}</Link>
        <Link to="/termini">{t('footer.terms')}</Link>
        <Link to="/contatti">{t('footer.contact')}</Link>
        <span>© {year} {LEGAL.brand}</span>
      </nav>
    );
  }

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <SacredSymbol kind="all" size={26} />
          <span>{LEGAL.brand}</span>
        </div>
        <nav className="site-footer-links" aria-label={t('footer.label')}>
          <Link to="/faq">{t('footer.faq')}</Link>
          <Link to="/contatti">{t('footer.contact')}</Link>
          <Link to="/privacy">{t('footer.privacy')}</Link>
          <Link to="/termini">{t('footer.terms')}</Link>
          <Link to="/cookie">{t('footer.cookies')}</Link>
          <Link to="/disclaimer">{t('footer.disclaimer')}</Link>
        </nav>
        <p className="site-footer-note">{t('footer.note')}</p>
        <p className="site-footer-copy">
          © {year} {LEGAL.brand} · {LEGAL.owner}. {t('footer.rights')}
        </p>
      </div>
    </footer>
  );
}
