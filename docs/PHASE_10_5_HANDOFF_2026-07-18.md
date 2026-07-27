# Handoff Fase 10.5 — 18 luglio 2026

> Chiuso il 27 luglio 2026. Il resoconto finale e le verifiche realmente eseguite sono in `docs/PHASE_10_5_COMPLETION_2026-07-27.md`.

Questo documento è il punto di ripresa dopo l’interruzione richiesta dall’utente. La specifica autorevole resta `docs/PHASE_10_5_UI_REFINEMENT.md`.

## Bug bloccanti risolti

### Refresh su rotta protetta riportava al login

Risolto. Nel browser potevano coesistere due cookie `refresh_token`:

- cookie storico con path `/api/v1/auth`;
- cookie corrente con path `/api/v1`.

Il backend poteva leggere per primo il cookie storico non valido. `AuthCookieService` ora raccoglie correttamente i cookie omonimi, sceglie quello corrente e cancella i path legacy durante set/clear.

File principali:

- `apps/backend/src/auth/auth-cookie.service.ts`
- `apps/backend/test/auth-cookie.service.spec.ts`
- `apps/frontend/e2e/protected-route-reload.e2e.mjs`

Verifiche già eseguite con esito positivo:

- test unitari del servizio cookie;
- prova HTTP con collisione tra cookie legacy e corrente: refresh `200`;
- E2E reale con reload su `/calendar?view=week&date=2026-07-18&status=PLANNED`;
- risultato E2E: nessun passaggio dal login e copertura della collisione cookie legacy.

Il container backend era già stato ricostruito dopo questa correzione, quindi il fix del refresh era attivo nell’ambiente Docker al momento dell’handoff.

### Pagina Spese inizializzata con filtri impossibili da azzerare

Risolto. I filtri ricordati in `localStorage` vengono applicati solo quando l’URL non contiene query parameter. Un URL esplicito e l’azione di reset sono ora autorevoli e non vengono più sovrascritti dai filtri memorizzati.

File principale:

- `apps/frontend/src/app/features/expenses/pages/expenses-page.component.ts`

Test aggiunti e superati:

- un URL esplicito non viene unito ai filtri ricordati;
- il reset rimuove ricerca e stato ricordati;
- i test mirati della pagina Spese risultavano verdi.

Nota: il container frontend non è stato ricostruito dopo le ultime modifiche frontend. Il fix è nel codice e testato, ma per renderlo disponibile nell’immagine Docker occorre ricostruire il servizio frontend.

## Lavoro 10.5 già completato

### Spese e backend

- filtri multipli per categorie, stati e metodi di pagamento, mantenendo i parametri singolari legacy;
- filtro ricorrenze `ALL`, `EXCLUDE`, `ONLY`;
- ordinamento frontend a tre stati;
- ricerca separata dal pannello filtri;
- reset filtri corretto;
- riepilogo promemoria senza query N+1 (`nextReminderAt`, `activeReminderCount`);
- validazione backend della compatibilità tra categoria ed etichette;
- endpoint `GET /expenses/summary` con quattro contatori;
- contatori per Categorie ed Etichette;
- form Spesa che filtra le etichette in base alla categoria e rimuove quelle incompatibili;
- dettaglio Spesa con header azioni e tab;
- date italiane centralizzate con timezone `Europe/Rome`.

### Categorie ed Etichette

- drag and drop Angular CDK;
- aggiornamento ottimistico e rollback applicativo;
- pulsanti accessibili “sposta su/giù” mantenuti;
- riordino disattivato quando sono presenti filtri;
- counter card riepilogative.

### Dashboard e Report

- migrazione dei grafici a `ng2-charts`;
- `provideCharts(withDefaultRegisterables())` nell’app config;
- KPI e punti dei grafici navigabili verso Spese filtrate;
- descrizioni dinamiche;
- selettori mese/anno della Dashboard;
- raggruppamento delle prossime spese;
- interazioni sui grafici dei report mensili.

Dipendenze aggiunte:

- `@angular/cdk`;
- `ng2-charts`.

### Calendario

- aggiunta vista `year` / “Anno”;
- intervallo annuale 1 gennaio incluso → 1 gennaio successivo escluso;
- una sola richiesta API annuale;
- tutti i dodici mesi visibili, compresi quelli vuoti;
- apertura della vista mensile e creazione spesa dai giorni;
- ricerca separata e automatica con debounce;
- layout annuale responsive.

Verifiche eseguite:

- typecheck frontend superato;
- 2 file di test Calendario, 9 test superati.

### Notifiche

- endpoint `PATCH /api/v1/notifications/:id/unarchive`;
- passaggio idempotente `ARCHIVED → READ`, con ownership e `archivedAt = null`;
- ricerca backend su titolo e messaggio;
- ricerca frontend separata con debounce;
- pannello filtri condiviso e applicazione automatica;
- azione “Disarchivia” nella lista con toast e reload;
- dropdown chiuso con click esterno, Escape e navigazione;
- click e scroll interni non causano la chiusura;
- spacing condiviso per le azioni degli empty state.

Verifiche eseguite:

- typecheck backend superato;
- 7 test backend Notifiche superati;
- typecheck frontend superato;
- 4 file di test frontend Notifiche, 9 test superati.

## Ultimi test mirati realmente eseguiti

```powershell
npm.cmd run typecheck --workspace apps/backend
npm.cmd test --workspace apps/backend -- --run test/notifications.service.spec.ts
npm.cmd run typecheck --workspace apps/frontend
npm.cmd test --workspace apps/frontend -- --include=src/app/shared/utilities/calendar-date.spec.ts --include=src/app/features/calendar/calendar-page.component.spec.ts
npm.cmd test --workspace apps/frontend -- --include=src/app/core/services/notification.service.spec.ts --include=src/app/features/notifications/notifications-page.component.spec.ts --include=src/app/features/notifications/notification-bell.component.spec.ts --include=src/app/features/notifications/notification-display.components.spec.ts
```

Altri gruppi mirati già superati durante la sessione:

- backend Spese/Categorie/Etichette: 33 test;
- frontend Spese/Cataloghi/servizi collegati: 35 test;
- frontend Dashboard/Report: 7 test.

Non sono ancora stati rieseguiti dopo tutte le modifiche:

- suite frontend completa;
- suite backend completa;
- build completa frontend e backend;
- rebuild finale dei container;
- controllo manuale responsive/light/dark dell’intera 10.5.

## Punto esatto da cui riprendere

Il prossimo blocco è **Spese ricorrenti**. I file sono già stati analizzati, ma non sono ancora stati modificati in quest’ultimo passaggio.

Interventi richiesti:

1. rimuovere `description` dal form Ricorrenza;
2. inviare e salvare `description = name` per compatibilità con lo schema esistente;
3. usare sempre `rule.name` come descrizione delle nuove spese generate;
4. mostrare `notes` nella tabella al posto di `description`, con placeholder/ellipsis/title;
5. separare la ricerca dal pannello filtri e applicare automaticamente i filtri con debounce;
6. rendere righe desktop e card mobile cliccabili e accessibili da tastiera;
7. sostituire la sequenza di pulsanti con azione primaria e menu contestuale, usando `stopPropagation`;
8. riorganizzare il dettaglio nei tab `Informazioni generali`, `Occorrenze generate`, `Promemoria`;
9. aggiungere test per form senza descrizione, note, click riga, azioni e tab.

File principali già individuati:

- `apps/frontend/src/app/features/recurrences/recurrences-page.component.ts`
- `apps/frontend/src/app/features/recurrences/recurrences-page.component.html`
- `apps/frontend/src/app/features/recurrences/recurrences-page.component.scss`
- `apps/frontend/src/app/features/recurrences/recurrence-form.component.ts`
- `apps/frontend/src/app/features/recurrences/recurrence-form.component.html`
- `apps/frontend/src/app/features/recurrences/recurrence-detail.component.*`
- `apps/frontend/src/app/shared/models/recurrence.models.ts`
- `apps/backend/src/recurrences/recurrences.service.ts`
- `apps/backend/src/recurrences/recurrence-generator.service.ts`
- `apps/backend/src/recurrences/dto/recurrence.dto.ts`

## Lavoro ancora aperto dopo Ricorrenze

- ampliare il catalogo a 60–120 Bootstrap Icons curate e raggruppate;
- completare il picker icone condiviso con ricerca, tastiera, preferenze e icona corrente nascosta;
- verificare/correggere P1 sidebar: una sola voce attiva e accent color coerente;
- verificare globalmente Categorie/Etichette rispetto allo standard ricerca separata + FilterPanel;
- rifiniture globali `ng-select`, pulsanti, dark/light, reduced motion e scrollbar;
- aggiungere gli eventuali test 10.5 mancanti indicati nella specifica;
- eseguire suite complete, build e verifica Docker.

## Sequenza di chiusura consigliata

```powershell
npm.cmd test --workspace apps/backend
npm.cmd test --workspace apps/frontend
npm.cmd run build --workspace apps/backend
npm.cmd run build --workspace apps/frontend
docker compose up -d --build backend frontend
docker compose ps
npm.cmd run test:e2e:reload --workspace apps/frontend
```

Verificare poi manualmente almeno:

- reload di Dashboard, Spese, dettaglio Spesa, Calendario e Impostazioni senza login intermedio;
- “Azzera filtri” in Spese dopo aver avuto filtri memorizzati;
- disarchiviazione Notifiche;
- vista annuale Calendario;
- principali flussi in light/dark e desktop/mobile.

## Note operative sul workspace

- Il worktree contiene molte modifiche della sessione e possibili modifiche preesistenti dell’utente: non usare reset o checkout distruttivi.
- In questa sessione il tool `apply_patch` integrato è stato bloccato dalle ACL Windows. È stato usato lo stesso motore patch tramite `codex.exe --codex-run-as-apply-patch`, passando la patch in una variabile PowerShell. Continuare a usare patch incrementali e non riscrivere file funzionanti.
- Backend e frontend devono essere ricostruiti al termine perché le immagini Docker non contengono tutte le modifiche successive ai fix iniziali.
