# Fase 11 — Completamento gestione centralizzata dei promemoria

Data: 28 luglio 2026.

## Risultato

È disponibile la route protetta `/reminders`, collegata alla sezione Gestione della sidebar. La pagina offre riepilogo globale, prossimo promemoria, ricerca e filtri server-side, ordinamento, paginazione configurabile, tabella desktop, card mobile, selezione e operazioni massive.

Il backend dispone di un `RemindersModule` autonomo. La migrazione `20260728113000_add_reminder_source` aggiunge l’origine persistita `MANUAL`, `RECURRENCE` o `SYSTEM` e indici per utente/data e utente/origine. Il generatore delle ricorrenze assegna esplicitamente `RECURRENCE`; i flussi contestuali esistenti restano `MANUAL` per default.

## Regole applicate

- gli stati `ACTIVE`, `UPCOMING`, `DUE`, `PROCESSED`, `CANCELLED` e `INVALID` sono derivati in un solo punto;
- il backend restituisce `allowedActions` e verifica nuovamente ogni regola durante la mutazione;
- la modifica delega a `NotificationRemindersService`, quindi riusa calcolo preset, timezone e controllo duplicati;
- l’annullamento è idempotente e non tocca notifiche già create;
- la riattivazione rifiuta date trascorse, spese non pianificate/eliminate, processati e duplicati;
- l’eliminazione fisica rifiuta processati, promemoria notificati e origine ricorrente;
- le azioni massive accettano da 1 a 100 UUID e producono un riepilogo parziale con motivazione;
- ownership e conteggi sono sempre limitati all’utente autenticato.

## Frontend

Sono stati creati modelli separati, `ReminderManagementService`, pagina, badge stato/origine e pipe tipo. Sono stati riutilizzati `ExpenseReminderFormComponent`, `FilterPanelComponent`, `CounterCardComponent`, `ExpenseStatusBadgeComponent`, `PaginationComponent`, `ConfirmDialogComponent`, skeleton, empty state, toast e `ng-select`.

I collegamenti aprono la spesa, la notifica filtrata o la ricorrenza. La modifica di un promemoria ricorrente riguarda soltanto l’occorrenza e lo dichiara nella modale. Tema, accento, densità e page size provengono dalle Impostazioni.

## API

Sono implementati tutti gli endpoint globali sotto `/api/v1/reminders`: lista, summary, dettaglio, modifica, annullamento, riattivazione, eliminazione e le tre azioni bulk. Gli endpoint contestuali sotto `/expenses/:expenseId/reminders` restano disponibili.

## Verifiche

- `npm run typecheck`: superato per frontend e backend;
- `npm run lint`: superato senza warning ESLint;
- test backend: 26 file e 167 test superati;
- test frontend: 50 file e 125 test superati;
- build monorepo: backend e frontend completate;
- `prisma validate`: schema valido;
- immagini Docker backend/frontend costruite e tre servizi Compose healthy;
- entrambe le migrazioni applicate con `prisma migrate deploy` dall’entrypoint;
- Swagger disponibile e contenente gli otto path globali Promemoria;
- controllo autenticato di lista, filtro origine e summary superato;
- annullamento singolo e riattivazione bulk verificati sul dato demo e ripristinati;
- scheduler notifiche verificato dopo il deploy senza errori;
- E2E browser autenticato superato, inclusi route, breadcrumb, sidebar, filtri, dati desktop/mobile e reload con query della pagina Promemoria.

La build Angular conserva due warning di budget già presenti: bundle iniziale e foglio stile del Calendario. Non bloccano la build e non sono stati ampliati dalla Fase 11. La Fase 12 non è stata anticipata.
