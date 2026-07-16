# Fase 7.5 — Rifinitura frontend e usabilità

Passaggio di consolidamento tra calendario e funzionalità successive. La fase corregge interazioni e coerenza visuale già esistenti senza introdurre notifiche, ricorrenze o nuovi modelli persistenti.

## Interventi

- apertura del dettaglio spesa cliccando o attivando da tastiera le righe delle tabelle;
- menu azioni delle spese portato sotto `document.body`, indipendente dall’overflow delle card;
- chiusura del menu azioni al click esterno, allo scroll, al ridimensionamento e con `Escape`;
- evidenza pastello dedicata alle righe delle spese pianificate;
- preferenza persistita nel browser per mostrare o nascondere le spese future;
- esclusione delle spese future applicata lato backend per conservare paginazione ed export corretti;
- andamento storico dashboard filtrabile per anno corrente o anno selezionato;
- selettori mese e anno dashboard inizializzati e aggiornati sul periodo effettivo;
- sfondo bianco uniforme per card, controlli form, `ng-select` e badge categoria;
- chiusura con `Escape` dei modali condivisi, catalogo, inserimento rapido e riprogrammazione calendario.

## Comportamenti accessibili

- le righe cliccabili sono raggiungibili con tabulazione e attivabili con `Invio` o `Spazio`;
- i pulsanti e i menu interni non propagano il click alla riga;
- il menu azioni espone `aria-haspopup`, `aria-expanded`, ruoli menu e ripristino del focus con `Escape`;
- le spese pianificate restano riconoscibili anche tramite badge testuale, non soltanto dal colore;
- la chiusura con `Escape` non interrompe operazioni di salvataggio già in corso.

## Persistenza preferenze

La preferenza “Mostra spese future” usa la chiave locale:

```text
carbexpenses.expenses.showFuture.v1
```

Il valore predefinito è `true` per preservare il comportamento precedente. Quando è `false`, il frontend invia `includeFuture=false` agli endpoint lista ed export; il backend limita i risultati alla data corrente in `Europe/Rome`.

## Vincoli preservati

- nessun caricamento completo delle spese nel browser;
- paginazione, ordinamento e filtri restano server-side;
- nessun modello Prisma aggiuntivo;
- nessuna dipendenza overlay o dropdown aggiuntiva;
- componenti standalone e TypeScript strict;
- flussi di dettaglio, modifica, duplicazione, stato ed eliminazione invariati.
