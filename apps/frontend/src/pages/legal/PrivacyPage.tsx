import { useTranslation } from '../../i18n/I18nProvider';
import { Link } from 'react-router-dom';
import { LEGAL, ownerLine } from '../../lib/legal';
import { LegalPage, Mail } from './LegalPage';

export function PrivacyPage() {
  const { locale } = useTranslation();
  return locale === 'it' ? <PrivacyPageIt /> : <PrivacyPageEn />;
}

function PrivacyPageIt() {
  return (
    <LegalPage title="Informativa sulla privacy">
      <p>
        Questa informativa spiega quali dati personali tratta {LEGAL.brand} ({LEGAL.site}), perché, con chi li condivide e
        quali diritti hai, secondo il Regolamento (UE) 2016/679 (GDPR).
      </p>

      <h2>1. Titolare del trattamento</h2>
      <p>
        {ownerLine()}. Contatto per la privacy: <Mail />.
      </p>

      <h2>2. Quali dati trattiamo</h2>
      <ul>
        <li><strong>Account</strong>: la tua email (e, se entri con Google, il nome del tuo account Google), la password cifrata se ti iscrivi con email, nome che scegli, immagine del profilo, conferma di maggiore età, codice di invito, impostazioni della verifica in due passaggi.</li>
        <li><strong>Contenuti che scrivi o detti</strong>: conversazioni con Elayra, pagine di diario, rituali, letture dei tarocchi e report mensili, risposte del Percorso, invito e messaggi della Forgia, documenti caricati nell’archivio dei progetti.</li>
        <li><strong>Dati di utilizzo</strong>: numero di risposte di Elayra usate nel mese, punti luce, livello, stelle e costellazioni del Collettivo.</li>
        <li><strong>Pagamenti</strong>: piano scelto, stato dell’abbonamento e identificativo cliente. I dati della carta li tratta solo Stripe: noi non li vediamo.</li>
        <li><strong>Dati tecnici</strong>: indirizzo IP e registri tecnici necessari a far funzionare e proteggere il servizio.</li>
      </ul>
      <p>
        Ciò che scrivi a Elayra può riguardare la tua salute, le tue emozioni o altri aspetti intimi (“categorie particolari di
        dati”, art. 9 GDPR). Li trattiamo solo perché sei tu a condividerli, sulla base del tuo consenso esplicito, e solo per
        offrirti il servizio.
      </p>

      <h2>3. Perché e su quale base</h2>
      <ul>
        <li>Offrirti Elayra, il diario, i rituali, il Percorso, la Forgia e il Collettivo: esecuzione del contratto (art. 6.1.b) e, per i contenuti intimi, consenso esplicito (art. 9.2.a).</li>
        <li>Gestire pagamenti, fatture e obblighi fiscali: contratto e obbligo di legge (art. 6.1.b e 6.1.c).</li>
        <li>Proteggere gli account e prevenire abusi: legittimo interesse (art. 6.1.f).</li>
        <li>Solo se lo scegli tu («Aiuta Elayra a crescere»): usare le tue parole, senza nome né email, per addestrare il modello di Elayra: consenso esplicito (art. 6.1.a e 9.2.a). È facoltativo, non cambia il servizio e lo revochi quando vuoi dal profilo: da quel momento le tue parole non entrano negli addestramenti successivi, mentre ciò che un addestramento già fatto ha imparato non si può togliere da quel modello.</li>
      </ul>
      <p>Non vendiamo i tuoi dati e non facciamo pubblicità mirata. Senza il tuo consenso esplicito, le tue conversazioni non vengono usate per addestrare nessun modello.</p>

      <h2>4. Con chi li condividiamo (responsabili del trattamento)</h2>
      <ul>
        <li><strong>Supabase</strong>: database, autenticazione e archivio file, su server nell’Unione Europea (Parigi).</li>
        <li><strong>Vercel</strong>: ospita il sito e il server di Elayra (funzioni a Parigi, rete di distribuzione globale).</li>
        <li><strong>Anthropic</strong>: elabora il testo per generare le risposte di Elayra. Può avvenire negli Stati Uniti, con le garanzie previste dal GDPR (clausole contrattuali standard). Secondo i suoi termini commerciali non usa questi contenuti per addestrare i modelli.</li>
        <li><strong>Stripe</strong>: pagamenti e fatturazione.</li>
        <li><strong>Google</strong>: per l’accesso, se scegli di entrare con Google; inoltre, se usi la dettatura vocale in Chrome, l’audio è trascritto dal servizio di riconoscimento vocale del browser.</li>
        <li><strong>Secretary Liria</strong>: riceve soltanto il brief di progetto che tu leggi, confermi e scegli di inviarle dalla Forgia.</li>
        <li><strong>L’altra persona della Forgia</strong>: vede solo il testo del tuo invito (che approvi prima) e ciò che scrivi o carichi nella vostra stanza.</li>
      </ul>

      <h2>5. Per quanto tempo</h2>
      <p>
        Conserviamo i dati finché il tuo account è attivo. Se chiedi la cancellazione, eliminiamo account e contenuti entro 30
        giorni; restano solo i dati che la legge ci obbliga a conservare (per esempio quelli fiscali dei pagamenti, fino a 10
        anni).
      </p>

      <h2>6. Sicurezza</h2>
      <p>
        L’accesso richiede la verifica in due passaggi. I dati sono cifrati in transito e protetti da regole che li rendono
        leggibili solo al tuo account. Le foto del profilo e i documenti sono in archivi privati.
      </p>

      <h2>7. I tuoi diritti</h2>
      <p>
        Puoi chiedere in qualsiasi momento accesso, rettifica, cancellazione, limitazione, portabilità dei tuoi dati, opporti
        al trattamento e revocare il consenso (senza che questo tocchi ciò che è stato fatto prima). Scrivi a <Mail />:
        rispondiamo entro un mese. Puoi anche presentare reclamo al Garante per la protezione dei dati personali
        (garanteprivacy.it).
      </p>

      <h2>8. Età</h2>
      <p>Elayra è riservata alle persone maggiorenni (18 anni o più).</p>

      <h2>9. Cookie</h2>
      <p>
        Usiamo solo strumenti tecnici necessari al funzionamento. Dettagli nella <Link to="/cookie">pagina cookie</Link>.
      </p>
    </LegalPage>
  );
}

function PrivacyPageEn() {
  return (
    <LegalPage title="Privacy policy">
      <p>
        This policy explains which personal data {LEGAL.brand} ({LEGAL.site}) processes, why, who it is shared with and what
        rights you have, under Regulation (EU) 2016/679 (GDPR).
      </p>

      <h2>1. Data controller</h2>
      <p>
        {ownerLine()}. Privacy contact: <Mail />.
      </p>

      <h2>2. What data we process</h2>
      <ul>
        <li><strong>Account</strong>: your email (and, if you sign in with Google, your Google account name), your encrypted password if you sign up with email, the name you choose, profile picture, confirmation that you are an adult, invitation code, two-step verification settings.</li>
        <li><strong>Content you write or dictate</strong>: conversations with Elayra, journal pages, rituals, tarot readings and monthly reports, answers in the Path, Forge invitation and messages, documents uploaded to the project archive.</li>
        <li><strong>Usage data</strong>: number of Elayra replies used in the month, light points, level, stars and constellations of the Collective.</li>
        <li><strong>Payments</strong>: chosen plan, subscription status and customer identifier. Card details are handled only by Stripe: we never see them.</li>
        <li><strong>Technical data</strong>: IP address and technical logs needed to run and protect the service.</li>
      </ul>
      <p>
        What you write to Elayra may concern your health, your emotions or other intimate matters (“special categories of
        data”, Art. 9 GDPR). We process them only because you choose to share them, on the basis of your explicit consent, and
        only to provide the service.
      </p>

      <h2>3. Why, and on what legal basis</h2>
      <ul>
        <li>Providing Elayra, the journal, rituals, the Path, the Forge and the Collective: performance of the contract (Art. 6.1.b) and, for intimate content, explicit consent (Art. 9.2.a).</li>
        <li>Managing payments, invoices and tax obligations: contract and legal obligation (Art. 6.1.b and 6.1.c).</li>
        <li>Protecting accounts and preventing abuse: legitimate interest (Art. 6.1.f).</li>
        <li>Only if you choose it (“Help Elayra grow”): using your words, without your name or email, to train Elayra’s model: explicit consent (Art. 6.1.a and 9.2.a). It is optional, does not change the service and you can revoke it anytime from your profile: from then on your words are left out of later trainings, while what a past training has already learned cannot be removed from that model.</li>
      </ul>
      <p>We do not sell your data and we do not do targeted advertising. Without your explicit consent, your conversations are not used to train any model.</p>

      <h2>4. Who we share it with (processors)</h2>
      <ul>
        <li><strong>Supabase</strong>: database, authentication and file storage, on servers in the European Union (Paris).</li>
        <li><strong>Vercel</strong>: hosts the website and Elayra’s server (functions in Paris, global delivery network).</li>
        <li><strong>Anthropic</strong>: processes text to generate Elayra’s replies. This may happen in the United States, with the safeguards required by the GDPR (standard contractual clauses). Under its commercial terms it does not use this content to train models.</li>
        <li><strong>Stripe</strong>: payments and invoicing.</li>
        <li><strong>Google</strong>: to sign you in, if you choose Google; also, if you use voice dictation in Chrome, the audio is transcribed by the browser’s speech recognition service.</li>
        <li><strong>Secretary Liria</strong>: receives only the project brief that you read, confirm and choose to send her from the Forge.</li>
        <li><strong>The other person in the Forge</strong>: sees only the text of your invitation (which you approve first) and what you write or upload in your shared room.</li>
      </ul>

      <h2>5. How long</h2>
      <p>
        We keep data while your account is active. If you ask for deletion, we delete your account and content within 30
        days; we keep only the data the law requires us to keep (for example tax records of payments, for up to 10 years).
      </p>

      <h2>6. Security</h2>
      <p>
        Access requires two-step verification. Data is encrypted in transit and protected by rules that make it readable only
        by your account. Profile pictures and documents are kept in private storage.
      </p>

      <h2>7. Your rights</h2>
      <p>
        At any time you can ask for access, correction, deletion, restriction or portability of your data, object to
        processing and withdraw consent (without affecting what was done before). Write to <Mail />: we reply within one
        month. You can also lodge a complaint with the Italian Data Protection Authority (garanteprivacy.it) or with the
        authority of the country where you live.
      </p>

      <h2>8. Age</h2>
      <p>Elayra is only for adults (18 or older).</p>

      <h2>9. Cookies</h2>
      <p>
        We only use technical tools needed for the service to work. Details on the <Link to="/cookie">cookie page</Link>.
      </p>
    </LegalPage>
  );
}
