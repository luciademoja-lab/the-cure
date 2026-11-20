/**
 * Dati di chi gestisce Elayra, usati in footer, privacy, termini e contatti.
 * Completa qui indirizzo, partita IVA ed email di contatto: compaiono da soli in tutte le pagine.
 */
export const LEGAL = {
  brand: 'Elayra',
  site: 'elayra.app',
  owner: 'Lucia De Mojà',
  /** Indirizzo del titolare (obbligatorio per legge nelle pagine legali). */
  address: '',
  /** Partita IVA, se c'è. */
  vat: '',
  /** Casella che riceve richieste privacy e supporto. Deve poter ricevere posta. */
  email: 'ciao@elayra.app',
  updated: '20 novembre 2026',
};

export const ownerLine = () =>
  [LEGAL.owner, LEGAL.address, LEGAL.vat ? `P. IVA ${LEGAL.vat}` : ''].filter(Boolean).join(' · ');
