import { LegalPage, Mail } from './LegalPage';

export function CookiePage() {
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
