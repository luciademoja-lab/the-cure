import { LegalPage } from './LegalPage';

export function DisclaimerPage() {
  return (
    <LegalPage title="Avvertenze">
      <h2>Elayra è un’intelligenza artificiale</h2>
      <p>
        Elayra non è una persona. Le sue risposte sono generate da un modello di intelligenza artificiale e possono essere
        imprecise. Se le chiedi se sei di fronte a un essere umano, ti dirà la verità.
      </p>
      <h2>Non è una terapia né un servizio medico</h2>
      <p>
        Elayra accompagna la riflessione personale ma non sostituisce psicologi, psicoterapeuti, medici o altri professionisti.
        Non fa diagnosi e non dà indicazioni su farmaci o cure.
      </p>
      <h2>Se sei in difficoltà</h2>
      <ul>
        <li>Emergenze: <strong>112</strong>.</li>
        <li>Telefono Amico Italia: <strong>02 2327 2327</strong>.</li>
        <li>Se pensi di farti del male, chiama subito il 112 o rivolgiti al pronto soccorso più vicino.</li>
      </ul>
      <h2>Progetti e collaborazioni</h2>
      <p>
        La Forgia mette in contatto persone, ma non verifica la loro identità né garantisce l’esito delle collaborazioni. Usa
        buon senso prima di condividere dati personali, denaro o impegni con altre persone. Secretary Liria è un servizio
        esterno con i propri termini.
      </p>
    </LegalPage>
  );
}
