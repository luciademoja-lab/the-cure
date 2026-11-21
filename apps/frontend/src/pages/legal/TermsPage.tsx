import { useTranslation } from '../../i18n/I18nProvider';
import { Link } from 'react-router-dom';
import { LEGAL, ownerLine } from '../../lib/legal';
import { LegalPage, Mail } from './LegalPage';

export function TermsPage() {
  const { locale } = useTranslation();
  return locale === 'it' ? <TermsPageIt /> : <TermsPageEn />;
}

function TermsPageIt() {
  return (
    <LegalPage title="Termini di servizio">
      <p>
        Questi termini regolano l’uso di {LEGAL.brand} ({LEGAL.site}), fornito da {ownerLine()}. Usando il servizio li
        accetti.
      </p>

      <h2>1. Il servizio</h2>
      <p>
        {LEGAL.brand} è un compagno di riflessione personale basato su intelligenza artificiale: diario conversazionale,
        rituali quotidiani, Percorso, Sincronicità, Collettivo e Forgia, lo spazio dove persone con progetti affini possono
        incontrarsi e collaborare.
      </p>

      <h2>2. Non è un servizio sanitario</h2>
      <p>
        Elayra non è una persona, non è una terapeuta né un medico e non fornisce diagnosi, cure o consulenze professionali.
        Non usarla in situazioni di emergenza: chiama il 112. Leggi anche le <Link to="/disclaimer">avvertenze</Link>.
      </p>

      <h2>3. Account</h2>
      <ul>
        <li>Devi avere almeno 18 anni.</li>
        <li>La verifica in due passaggi è obbligatoria; sei responsabile di custodire le tue credenziali.</li>
        <li>Un account è personale: non cederlo ad altri.</li>
      </ul>

      <h2>4. Piani e pagamenti</h2>
      <ul>
        <li>Il piano gratuito include un numero limitato di risposte al mese. I piani a pagamento (Forgia, Part time, Full time, H24) sono abbonamenti mensili con rinnovo automatico, ai prezzi indicati nella pagina Piani.</li>
        <li>Puoi disdire in qualsiasi momento dal Profilo: l’abbonamento resta attivo fino alla fine del periodo già pagato.</li>
        <li>Pagando per un’altra persona della Forgia attivi due abbonamenti con il 20% di sconto sul totale; l’abbonamento dell’altra persona termina se disdici il tuo pagamento.</li>
        <li>I mesi gratuiti ottenuti con le costellazioni del Collettivo non sono convertibili in denaro.</li>
        <li>Il report mensile di Elayra è incluso nei piani a pagamento; con il piano gratuito si acquista singolarmente (0,99 € per mese), con un pagamento unico e non ricorrente.</li>
        <li>Le letture dei tarocchi sono un dono per chi completa le pratiche del giorno: sono uno strumento di riflessione personale, non previsioni né consigli.</li>
        <li>
          Diritto di recesso: chiedendo di attivare subito il servizio digitale riconosci che, una volta iniziata la
          fornitura, il recesso di 14 giorni previsto dal Codice del Consumo non si applica al periodo già goduto. Per
          problemi di addebito scrivi a <Mail />.
        </li>
      </ul>

      <h2>5. La Forgia e Secretary Liria</h2>
      <ul>
        <li>Gli incontri nella Forgia avvengono solo con il consenso di entrambe le persone. Ciascuno resta responsabile di ciò che scrive, carica e decide di fare con l’altra persona.</li>
        <li>I progetti, le idee e i documenti restano di chi li crea: {LEGAL.brand} non ne acquisisce alcun diritto.</li>
        <li>Secretary Liria è un servizio distinto, con i propri termini e prezzi. Elayra prepara il brief, ma l’invio avviene solo dopo la tua conferma e il rapporto con Liria è diretto tra te e lei. Lo sconto del 5% vale per i piani Part time e superiori, finché resta attivo l’accordo con Liria.</li>
      </ul>

      <h2>6. Uso corretto</h2>
      <p>
        È vietato usare il servizio per attività illegali, per molestare altre persone, per caricare contenuti che violano
        diritti altrui o per tentare di aggirare le protezioni del sistema. Possiamo sospendere gli account che lo fanno.
      </p>

      <h2>7. Contenuti generati dall’intelligenza artificiale</h2>
      <p>
        Le risposte di Elayra sono generate automaticamente e possono contenere imprecisioni. Valuta tu ciò che decidi di fare.
      </p>

      <h2>8. Responsabilità</h2>
      <p>
        Il servizio è fornito con la massima cura ma senza garanzia di continuità assoluta. Nei limiti consentiti dalla legge,
        non rispondiamo di danni indiretti derivanti dall’uso del servizio. Restano salvi i diritti che la legge riconosce ai
        consumatori.
      </p>

      <h2>9. Modifiche e legge applicabile</h2>
      <p>
        Possiamo aggiornare questi termini; le modifiche importanti ti verranno comunicate prima che abbiano effetto. Si applica
        la legge italiana; per i consumatori è competente il foro del luogo di residenza.
      </p>

      <h2>10. Contatti</h2>
      <p>
        <Mail />
      </p>
    </LegalPage>
  );
}

function TermsPageEn() {
  return (
    <LegalPage title="Terms of service">
      <p>
        These terms govern the use of {LEGAL.brand} ({LEGAL.site}), provided by {ownerLine()}. By using the service you accept
        them.
      </p>

      <h2>1. The service</h2>
      <p>
        {LEGAL.brand} is a personal reflection companion based on artificial intelligence: a conversational journal, daily
        rituals, the Path, Synchronicities, the Collective and the Forge, the space where people with related projects can
        meet and collaborate.
      </p>

      <h2>2. It is not a health service</h2>
      <p>
        Elayra is not a person, not a therapist and not a doctor, and does not provide diagnoses, treatment or professional
        advice. Do not use her in emergencies: call your local emergency number (112 in Europe). Please also read the{' '}
        <Link to="/disclaimer">disclaimer</Link>.
      </p>

      <h2>3. Account</h2>
      <ul>
        <li>You must be at least 18 years old.</li>
        <li>Two-step verification is required; you are responsible for keeping your credentials safe.</li>
        <li>An account is personal: do not give it to others.</li>
      </ul>

      <h2>4. Plans and payments</h2>
      <ul>
        <li>The free plan includes a limited number of replies per month. Paid plans (Forge, Part time, Full time, H24) are monthly subscriptions that renew automatically, at the prices shown on the Plans page.</li>
        <li>You can cancel at any time from your Profile: the subscription stays active until the end of the period already paid.</li>
        <li>Paying for another person in the Forge activates two subscriptions with 20% off the total; the other person’s subscription ends if you cancel your payment.</li>
        <li>Free months earned with the constellations of the Collective cannot be exchanged for money.</li>
        <li>Elayra’s monthly report is included in paid plans; with the free plan it can be bought one month at a time (€0.99 per month) with a single, non-recurring payment.</li>
        <li>Tarot readings are a gift for completing the daily practices: they are a tool for personal reflection, not predictions or advice.</li>
        <li>
          Right of withdrawal: by asking for the digital service to start immediately you acknowledge that, once the service
          has begun, the 14-day withdrawal right under consumer law does not apply to the period already used. For billing
          problems write to <Mail />.
        </li>
      </ul>

      <h2>5. The Forge and Secretary Liria</h2>
      <ul>
        <li>Meetings in the Forge happen only with the consent of both people. Each person remains responsible for what they write, upload and decide to do with the other person.</li>
        <li>Projects, ideas and documents belong to whoever creates them: {LEGAL.brand} acquires no rights over them.</li>
        <li>Secretary Liria is a separate service, with its own terms and prices. Elayra prepares the brief, but it is sent only after your confirmation and your relationship with Liria is directly between you and her. The 5% discount applies to the Part time plan and above, while the agreement with Liria remains in place.</li>
      </ul>

      <h2>6. Acceptable use</h2>
      <p>
        You may not use the service for illegal activities, to harass other people, to upload content that infringes the
        rights of others or to try to get around the system’s protections. We may suspend accounts that do so.
      </p>

      <h2>7. AI-generated content</h2>
      <p>Elayra’s replies are generated automatically and may contain inaccuracies. You decide what to do with them.</p>

      <h2>8. Liability</h2>
      <p>
        The service is provided with the utmost care but without a guarantee of uninterrupted availability. To the extent
        permitted by law, we are not liable for indirect damages arising from the use of the service. The rights that the law
        grants to consumers remain unaffected.
      </p>

      <h2>9. Changes and governing law</h2>
      <p>
        We may update these terms; important changes will be communicated to you before they take effect. Italian law applies;
        for consumers, the courts of the place of residence have jurisdiction.
      </p>

      <h2>10. Contact</h2>
      <p>
        <Mail />
      </p>
    </LegalPage>
  );
}
