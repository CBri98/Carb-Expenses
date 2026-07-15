# Fase 4.5 — Rifinitura frontend

Passaggio esclusivamente presentazionale tra la gestione spese e la dashboard. Backend, Prisma, API, DTO e logica server-side restano invariati.

## Interventi

- Reddit Sans variabile self-hosted con fallback di sistema;
- tema unico light e palette pastello centralizzata in `src/styles.scss`;
- superfici distinte per applicazione, sidebar, card, form e controlli;
- stile condiviso per componenti Bootstrap e stati di caricamento/vuoti;
- `@ng-select/ng-select` nei campi categoria, etichette, stato e pagamento di form e filtri;
- pannello filtri collassabile governato da Signal, aperto di default su desktop e chiuso su mobile;
- conteggio, riepilogo e azzeramento filtri disponibili a pannello chiuso;
- preferenza di apertura dei filtri persistita nel browser;
- tutti i controlli select del frontend uniformati tramite `ng-select`, con icone contestuali;
- form spesa organizzato in sezioni e carta di debito proposta come pagamento iniziale;
- sidebar più distinta dallo sfondo applicativo, sticky e indipendente dallo scroll della pagina;
- input data nativi mantenuti e uniformati al resto dei controlli.

## Vincoli preservati

- Reactive Forms e tipizzazione strict;
- ID selezionati tramite `bindValue`;
- sincronizzazione filtri/query parameter, ricerca, paginazione e ordinamento esistenti;
- flussi di creazione, modifica e salvataggio delle spese;
- nessuna dipendenza da JavaScript Bootstrap per l'accordion;
- nessuna introduzione di `ngx-bootstrap` o forzatura delle peer dependency.

## Compatibilità dipendenze

Il progetto usa Angular 22.0.6. `@ng-select/ng-select` 23.2.0 dichiara peer dependency `^22.0.0` per `@angular/core`, `@angular/common` e `@angular/forms`.
