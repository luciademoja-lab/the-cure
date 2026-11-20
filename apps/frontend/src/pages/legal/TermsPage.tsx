import { Link } from 'react-router-dom';
import { LEGAL, ownerLine } from '../../lib/legal';
import { LegalPage, Mail } from './LegalPage';

export function TermsPage() {
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
