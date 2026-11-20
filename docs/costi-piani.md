# Elayra — costi reali e limiti dei piani

Calcolo fatto il 17 novembre 2026. Prezzi di Anthropic e Stripe da ricontrollare quando cambiano.

## Da dove vengono i costi

**Claude (Anthropic), per milione di token**

| Modello | Letti | Scritti | Letti dalla cache |
|---|---|---|---|
| Sonnet 5.5 (Elayra piena) | 2 $ | 10 $ | 0,10 $ |
| Haiku 5.5 (Elayra leggera, lavori di sfondo) | 0,10 $ | 0,50 $ | 0,01 $ |

**Stripe:** 1,5% + 0,25 € per pagamento con carta europea standard.

**IVA:** ho assunto prezzi IVA inclusa al 22%. Se il tuo regime fiscale è diverso (es. forfettario) l'incasso netto è più alto. Da verificare con il commercialista: per i servizi digitali venduti a privati in altri paesi UE l'IVA segue il paese del cliente.

## Quanto costa una risposta di Elayra

Una risposta legge circa 4.000 token (istruzioni + ultimi 30 messaggi) e ne scrive circa 200.

| | Caso peggiore (senza cache) | Caso tipico (con cache) |
|---|---|---|
| Sonnet 5.5 | ~1 centesimo | ~0,3 centesimi |
| Haiku 5.5 | ~0,05 centesimi | ~0,02 centesimi |

La cache è attiva nel codice: istruzioni e conversazione già lette costano un ventesimo. Scade dopo 5 minuti di silenzio, per questo il caso tipico non è il minimo teorico.

## I piani

Regola usata: **nel caso peggiore, Claude non deve costare più del 60% dell'incasso netto**.

| Piano | Prezzo | Netto (dopo IVA e Stripe) | Risposte/mese | Modello | Costo peggiore | Costo tipico |
|---|---|---|---|---|---|---|
| Seme (gratis) | 0 € | 0 € | 300 | Haiku | 0,15 € | 0,06 € |
| Forgia | 2,99 € | 2,16 € | 300 | Haiku | 0,15 € | 0,06 € |
| Part time | 9,99 € | 7,79 € | 450 | Sonnet | 4,50 € | ~1,35 € |
| Full time | 24,99 € | 19,86 € | 1.200 | Sonnet | 12,00 € | ~3,60 € |
| H24 | 99,99 € | 80,21 € | 4.800 | Sonnet | 48,00 € | ~14,40 € |

"Part time / Full time / H24" diventano quindi un numero di risposte: 450, 1.200, 4.800 al mese (H24 ≈ 160 al giorno). Le risposte valgono sia nella chat personale sia quando si chiama Elayra in una stanza della Forgia.

Ho trattato 1 $ ≈ 1 €. Se il dollaro si rafforza molto, i costi salgono in proporzione.

## Abbonamento per due (−20% sul totale)

Il margine resta positivo ma si stringe. Esempio Part time per due: 15,98 € lordi, ~6,30 € netti a persona contro 4,50 € di costo peggiore (71%). Per H24 per due: ~64 € netti a persona contro 48 € (75%).

## Premi delle costellazioni

Una costellazione da 7 stelle regala 1 mese Full time + 7 mesi Part time. Nel caso peggiore costa ~43,50 € di Claude, nel caso tipico ~13 €. In cambio porta 7 persone attive: è il costo di acquisizione di 7 utenti.

## Soluzioni per spendere meno (già nel codice)

- **Due modelli:** Haiku (20 volte più economico) per il piano gratuito, il piano Forgia e i lavori di sfondo (pagine di diario, valutazione per la Forgia); Sonnet solo per chi paga Part time o più.
- **Cache dei prompt:** le parti già lette costano un ventesimo.

## Altre possibilità (non attive)

- **Batch API di Anthropic:** −50%, ma le risposte arrivano entro alcune ore. Va bene solo per lavori non urgenti (es. riassunti settimanali), non per la chat.
- **Modello locale (Ollama):** per centinaia di utenti serve un server con GPU sempre acceso (decine o centinaia di euro al mese) e la qualità in italiano è più bassa. Conviene solo con molti utenti.
