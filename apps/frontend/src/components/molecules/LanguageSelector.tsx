import { useTranslation } from '../../i18n/I18nProvider';

export function LanguageSelector() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="language-selector">
      <select
        id="language-select"
        value={locale}
        onChange={(event) => setLocale(event.target.value as 'en' | 'it' | 'zh')}
        className="language-dropdown"
      >
        <option value="en">🇺🇸</option>
        <option value="it">🇮🇹</option>
        <option value="zh">🇨🇳</option>
      </select>
    </div>
  );
}
