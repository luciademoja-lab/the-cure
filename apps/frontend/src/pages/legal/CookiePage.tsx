import { useTranslation } from '../../i18n/I18nProvider';
import { LegalPage, Mail } from './LegalPage';

export function CookiePage() {
  const { locale } = useTranslation();
  return locale === 'it' ? <CookiePageIt /> : <CookiePageEn />;
}

function CookiePageIt() {
  return (
    <LegalPage title="Cookie e archiviazione locale">
      <p>
        Elayra non usa cookie di profilazione, pubblicità o statistiche di terze parti. Per questo non ti chiediamo un consenso
        ai cookie.
      </p>
      <h2>Cosa salviamo nel tuo browser</h2>
      <p>Solo strumenti tecnici necessari al funzionamento, nell’archiviazione locale del browser:</p>
      <ul>
        <li><strong>Sessione di accesso</strong> (Supabase): ti tiene collegata o collegato in modo sicuro.</li>
        <li><strong>Lingua</strong> scelta per l’interfaccia.</li>
        <li><strong>Codice di invito</strong>, se arrivi da un link di invito, finché completi la registrazione.</li>
      </ul>
      <h2>Servizi esterni</h2>
      <p>
        Quando paghi, si apre la pagina sicura di Stripe, che usa i propri cookie tecnici e antifrode. Se accedi con Google, si
        applicano le regole di Google per la sua pagina di accesso.
      </p>
      <p>
        Puoi cancellare questi dati dalle impostazioni del browser in qualsiasi momento (dovrai solo accedere di nuovo).
        Domande: <Mail />.
      </p>
    </LegalPage>
  );
}

function CookiePageEn() {
  return (
    <LegalPage title="Cookies and local storage">
      <p>
        Elayra does not use profiling, advertising or third-party analytics cookies. That is why we do not ask for your cookie
        consent.
      </p>
      <h2>What we store in your browser</h2>
      <p>Only technical tools needed for the service to work, in your browser’s local storage:</p>
      <ul>
        <li><strong>Sign-in session</strong> (Supabase): keeps you securely signed in.</li>
        <li><strong>Language</strong> you chose for the interface.</li>
        <li><strong>Invitation code</strong>, if you arrive from an invitation link, until you finish signing up.</li>
      </ul>
      <h2>External services</h2>
      <p>
        When you pay, Stripe’s secure page opens and uses its own technical and anti-fraud cookies. When you sign in with
        Google, Google’s rules apply to its sign-in page.
      </p>
      <p>
        You can delete this data from your browser settings at any time (you will just need to sign in again). Questions:{' '}
        <Mail />.
      </p>
    </LegalPage>
  );
}
