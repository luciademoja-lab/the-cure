import { Link } from 'react-router-dom';
import { LEGAL, ownerLine } from '../../lib/legal';
import { LegalPage, Mail } from './LegalPage';

export function PrivacyPage() {
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
        <li><strong>Account</strong>: email, nome che scegli, immagine del profilo, conferma di maggiore età, codice di invito, impostazioni della verifica in due passaggi.</li>
        <li><strong>Contenuti che scrivi o detti</strong>: conversazioni con Elayra, pagine di diario, rituali, risposte del Percorso, invito e messaggi della Forgia, documenti caricati nell’archivio dei progetti.</li>
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
        <li>Inviarti email di servizio (accesso, reimpostazione della password): contratto.</li>
      </ul>
      <p>Non vendiamo i tuoi dati, non facciamo pubblicità mirata e non usiamo le tue conversazioni per addestrare modelli.</p>

      <h2>4. Con chi li condividiamo (responsabili del trattamento)</h2>
      <ul>
        <li><strong>Supabase</strong>: database, autenticazione e archivio file, su server nell’Unione Europea (Parigi).</li>
        <li><strong>Vercel</strong>: ospita il sito e il server di Elayra (funzioni a Parigi, rete di distribuzione globale).</li>
        <li><strong>Anthropic</strong>: elabora il testo per generare le risposte di Elayra. Può avvenire negli Stati Uniti, con le garanzie previste dal GDPR (clausole contrattuali standard). Secondo i suoi termini commerciali non usa questi contenuti per addestrare i modelli.</li>
        <li><strong>Stripe</strong>: pagamenti e fatturazione.</li>
        <li><strong>Resend</strong>: invio delle email di servizio, su server nell’Unione Europea (Irlanda).</li>
        <li><strong>Google</strong>: solo se scegli l’accesso con Google; inoltre, se usi la dettatura vocale in Chrome, l’audio è trascritto dal servizio di riconoscimento vocale del browser.</li>
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
