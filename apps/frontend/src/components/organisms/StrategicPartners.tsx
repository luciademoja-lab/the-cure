import { useTranslation } from '../../i18n/I18nProvider';

export function StrategicPartners() {
  const { t } = useTranslation();

  const partners = ['Sound Architects', 'Embodied Designers', 'Conscious Collectives', 'AI Ethicists'];

  return (
    <section className="callout" aria-labelledby="partner-title">
      <h2 id="partner-title">{t('partners.title')}</h2>
      <p>
        {t('partners.description')}
      </p>
      <div className="partner-list">
        {partners.map((item) => (
          <span key={item} className="partner-pill">
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
