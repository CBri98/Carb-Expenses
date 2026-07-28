# Carbexpenses

Gestionale per la registrazione, pianificazione e analisi delle spese personali.

Sono complete le Fasi 1–10 e le rifiniture 10.5–10.9: setup Docker, autenticazione, categorie ed etichette, gestione spese, dashboard, report mensili, calendario gestionale, promemoria, notifiche interne, spese ricorrenti, preferenze utente, consolidamento dell’interfaccia e gerarchia di navigazione coerente.

## Requisiti

- Node.js 22.12 o successivo
- npm 10 o successivo
- Docker con plugin Docker Compose

## Avvio completo con Docker

Creare la configurazione locale:

```bash
cp .env.example .env
```

Sostituire le password di esempio, quindi avviare lo stack:

```bash
docker compose up --build
```

Il backend attende MariaDB, applica le migrazioni Prisma, esegue il seed idempotente e avvia NestJS. I servizi sono disponibili su:

- frontend: <http://localhost:4200>
- backend health: <http://localhost:3000/api/v1/health>
- Swagger: <http://localhost:3000/api/docs>
- MariaDB: `localhost:3306`

In `development` il seed crea l’utente configurato da `DEMO_USER_EMAIL` e `DEMO_USER_PASSWORD`, quattro etichette, venticinque spese dimostrative distribuite su più mesi e sette regole ricorrenti rappresentative. In produzione non crea dati demo.

## Funzionalità disponibili

L’autenticazione include registrazione, login, logout, ripristino sessione e refresh token ruotati e revocabili. Le password e i token persistiti sono protetti con Argon2id; il refresh token viaggia in cookie `HttpOnly`.

Le sezioni protette principali sono:

- <http://localhost:4200/expenses>
- <http://localhost:4200/calendar>
- <http://localhost:4200/recurrences>
- <http://localhost:4200/reminders>
- <http://localhost:4200/notifications>
- <http://localhost:4200/reports/monthly>
- <http://localhost:4200/reports/compare>
- <http://localhost:4200/settings/categories>
- <http://localhost:4200/settings/labels>
- <http://localhost:4200/settings>

La pagina Spese offre ricerca, filtri combinabili, ordinamento e paginazione server-side, visualizzazione desktop/mobile, dettaglio, creazione, modifica, duplicazione, cambio stato, soft delete con conferma ed export CSV. Il pulsante globale “Nuova spesa” apre lo stesso form condiviso in modalità rapida.

Gli importi sono trasmessi come stringhe decimali e persistiti in `DECIMAL(12,2)`. Le date di spesa sono stringhe locali `YYYY-MM-DD` e colonne SQL `DATE`; i timestamp tecnici restano UTC.

## API

Il prefisso REST è `/api/v1`. Gli endpoint delle spese, tutti protetti da JWT, sono:

```text
GET    /expenses
POST   /expenses
GET    /expenses/export
GET    /expenses/:id
PATCH  /expenses/:id
DELETE /expenses/:id
POST   /expenses/:id/duplicate
PATCH  /expenses/:id/status
```

`GET /expenses` ed export supportano ricerca, intervallo date oppure mese/anno, categoria, etichette con semantica ANY, stato, metodo di pagamento, importo minimo/massimo e ordinamento. La lista accetta inoltre `page` e `pageSize` fino a 100.

L’export utilizza UTF-8 con BOM, separatore `;`, intestazioni italiane e un massimo di 10.000 righe.

## Sviluppo locale

Installare le dipendenze e avviare MariaDB:

```bash
npm install
docker compose up -d mariadb
```

Per eseguire Prisma o il backend fuori da Docker, impostare temporaneamente `DATABASE_URL` con host `localhost`. Per la modalità completa Docker il Compose costruisce autonomamente l’URL con host `mariadb`.

```bash
npm run prisma:generate
npm run db:migrate
npm run db:seed
npm run start:backend
npm run start:frontend
```

## Verifiche

```bash
npm run lint
npm run typecheck:backend
npm run typecheck:frontend
npm run test:backend
npm run test:frontend
npm run test:e2e:reload
npm run build:backend
npm run build:frontend
npm run --workspace @carbexpenses/backend prisma:validate
docker compose config
```

Il test E2E `test:e2e:reload` richiede frontend e backend locali attivi, il seed development e Chrome/Chromium. Verifica che il reload diretto di una route autenticata conservi percorso e query string senza redirect intermedio al login. È possibile configurarlo con `E2E_FRONTEND_URL`, `E2E_API_URL`, `E2E_EMAIL`, `E2E_PASSWORD` e `CHROME_PATH`.

Per arrestare i container mantenendo i dati usare `docker compose down`. L’opzione `--volumes` elimina anche il database persistente e va usata consapevolmente.

## Struttura

```text
carbexpenses/
├── apps/
│   ├── frontend/   # Angular standalone, strict, SCSS, Bootstrap
│   └── backend/    # NestJS strict, Prisma, Swagger e healthcheck
├── docs/
├── docker-compose.yml
├── .env.example
└── package.json
```

La roadmap è descritta in [docs/technical-roadmap.md](docs/technical-roadmap.md).

## Fase 8 — Promemoria e notifiche interne

Le spese `PLANNED` possono avere più promemoria: il giorno stesso, 1, 3 o 7 giorni prima, oppure una data e ora personalizzata. I preset vengono calcolati dalla data/ora locale della spesa; se l'ora manca viene usato `DEFAULT_EXPENSE_REMINDER_TIME`. I timestamp sono persistiti in UTC e la conversione usa il fuso dell'utente, predefinito a `Europe/Rome`, incluse ora legale e ora solare.

Il backend esegue `NotificationSchedulerService` con `@nestjs/schedule`. La frequenza predefinita è una volta al minuto ed è configurabile tramite `NOTIFICATION_SCHEDULER_CRON` con intervalli da 1 a 59 minuti. Lo scheduler seleziona soltanto promemoria attivi, non processati e già dovuti, oltre alle spese pianificate previste oggi o divenute scadute. Una spesa scaduta resta `PLANNED`: non viene cambiato automaticamente alcuno stato.

L'idempotenza è garantita da una `deduplicationKey` univoca sul database e da acquisizioni atomiche in transazione. Le chiavi includono promemoria e timestamp oppure spesa e data di scadenza. Un promemoria `SAME_DAY` e la notifica automatica del giorno stesso condividono la stessa chiave, quindi non producono un doppio avviso. Le notifiche vengono archiviate con soft state e non eliminate fisicamente.

Quando cambia data o ora della spesa, i preset attivi non processati vengono ricalcolati. I custom non vengono spostati: il backend rifiuta il cambio se la nuova scadenza li renderebbe successivi alla spesa. Passando a `COMPLETED` o `CANCELLED`, o eliminando logicamente la spesa, i promemoria futuri vengono disattivati. Tornando a `PLANNED` restano disattivati finché l'utente non li riattiva o ricrea esplicitamente.

Endpoint notifiche autenticati:

```text
GET    /api/v1/notifications
GET    /api/v1/notifications/unread-count
GET    /api/v1/notifications/:id
PATCH  /api/v1/notifications/:id/read
PATCH  /api/v1/notifications/:id/unread
PATCH  /api/v1/notifications/:id/archive
PATCH  /api/v1/notifications/read-all
```

Endpoint promemoria autenticati:

```text
GET    /api/v1/expenses/:expenseId/reminders
POST   /api/v1/expenses/:expenseId/reminders
PATCH  /api/v1/expenses/:expenseId/reminders/:reminderId
DELETE /api/v1/expenses/:expenseId/reminders/:reminderId
```

La pagina protetta <http://localhost:4200/notifications> offre filtri sincronizzati nei query parameter, paginazione server-side, letto/non letto e archiviazione. La topbar carica cinque notifiche recenti e aggiorna il conteggio non letto con una query `COUNT` all'avvio, al ritorno del focus, dopo azioni locali e tramite polling ogni `NOTIFICATION_POLL_INTERVAL_MS` (60–120 secondi, default 60.000). Il polling si interrompe quando il layout autenticato viene distrutto.

Variabili della fase:

```env
DEFAULT_EXPENSE_REMINDER_TIME=09:00
NOTIFICATION_SCHEDULER_CRON=*/1 * * * *
NOTIFICATION_POLL_INTERVAL_MS=60000
```

Questa fase implementa esclusivamente notifiche interne. Non include email, push, WebSocket, Redis o code esterne. Le spese vengono generate soltanto dal modulo ricorrenze descritto di seguito.

## Fase 9 — Spese ricorrenti

La sezione protetta <http://localhost:4200/recurrences> gestisce regole giornaliere, settimanali, mensili e annuali con intervallo, data iniziale, data finale opzionale, massimo numero di occorrenze e orizzonte di generazione. Il giorno 31 viene adattato all'ultimo giorno disponibile senza perdere l'ancora originaria; una ricorrenza annuale del 29 febbraio usa il 28 negli anni non bisestili.

Le occorrenze sono normali spese `PLANNED`: usano lo stesso CRUD, compaiono in calendario, dashboard e report, e ricevono copie indipendenti dei template promemoria. Le spese completate, annullate, modificate manualmente o eliminate non vengono sovrascritte; una riga eliminata logicamente mantiene il vincolo regola/data e non viene rigenerata.

Lo scheduler `RecurrenceSchedulerService` genera in anticipo entro l'orizzonte della regola. Un claim ottimistico sulla versione della regola e il vincolo univoco database `(recurrenceRuleId, occurrenceDate)` rendono sicuri retry e concorrenza. La pausa interrompe nuove generazioni; la ripresa parte dalla prima data valida non precedente a oggi e non recupera arretrati. La terminazione può mantenere oppure annullare soltanto le future spese `PLANNED`.

Endpoint autenticati principali:

```text
GET    /api/v1/recurrences
POST   /api/v1/recurrences
POST   /api/v1/recurrences/preview
GET    /api/v1/recurrences/summary
GET    /api/v1/recurrences/:id
PATCH  /api/v1/recurrences/:id
DELETE /api/v1/recurrences/:id
GET    /api/v1/recurrences/:id/preview
GET    /api/v1/recurrences/:id/expenses
POST   /api/v1/recurrences/:id/exceptions
PATCH  /api/v1/recurrences/:id/pause
PATCH  /api/v1/recurrences/:id/resume
PATCH  /api/v1/recurrences/:id/cancel
```

Variabili della fase:

```env
RECURRENCE_SCHEDULER_CRON=0 * * * *
DEFAULT_RECURRENCE_GENERATION_DAYS_AHEAD=30
MAX_RECURRENCE_GENERATION_DAYS_AHEAD=365
MAX_RECURRENCE_OCCURRENCES_PER_RUN=500
```

Non sono inclusi Redis, code esterne, pagamenti, sincronizzazioni esterne, email o push.

## Fase 10 — Impostazioni e preferenze

La sezione protetta <http://localhost:4200/settings> comprende Account, Aspetto, Esperienza, Icone e Promemoria. Le preferenze sono isolate per utente in una relazione Prisma uno-a-uno e sincronizzate con il server; la cache locale contiene soltanto dati non sensibili e permette di applicare tema, colore e densità prima del bootstrap Angular.

Sono disponibili tema chiaro, scuro o di sistema e sei preset di colore controllati. Non vengono accettati colori, CSS, HTML, classi o nomi di icona arbitrari. Le preferenze di esperienza governano sidebar iniziale, densità tabelle, page size, filtri spese, valori iniziali del form, periodo dashboard e vista calendario. La sezione Promemoria delle Impostazioni configura i preset proposti nei nuovi form e le notifiche automatiche del giorno/scaduto; la gestione operativa globale è descritta nella Fase 11.

Il catalogo icone condiviso può essere ristretto separatamente per categorie ed etichette. Un’icona già usata continua a essere resa e resta disponibile durante la modifica del record, anche se è stata nascosta dai nuovi selettori.

Endpoint autenticati:

```text
GET    /api/v1/settings
PATCH  /api/v1/settings/account
PATCH  /api/v1/settings/account/password
POST   /api/v1/settings/account/revoke-other-sessions
PATCH  /api/v1/settings/appearance
PATCH  /api/v1/settings/experience
PATCH  /api/v1/settings/icons
PATCH  /api/v1/settings/notifications
POST   /api/v1/settings/preferences/reset
```

Il cambio email richiede la password corrente; il cambio password revoca tutte le sessioni. La revoca selettiva mantiene la sessione corrente identificata dal refresh cookie `HttpOnly`. Il ripristino modifica esclusivamente le preferenze e non tocca account, spese, categorie, etichette, ricorrenze o notifiche.

## Fase 10.5 — Rifinitura interfaccia

Il bootstrap delle guard attende il ripristino della sessione: il reload diretto di una route protetta conserva percorso e query string senza un redirect intermedio al login. Tema, accento e densità vengono applicati prima del bootstrap Angular dalla sola cache non sensibile e poi sincronizzati con le preferenze autorevoli del server.

Layout, grafici Chart.js, pannelli filtro e componenti Bootstrap sono coerenti in light e dark mode. Dashboard, report, spese, calendario e impostazioni hanno controlli adattivi per desktop, tablet e mobile. Il pannello filtri condiviso centralizza conteggio, riepilogo, reset e attributi ARIA.

La specifica è in [docs/PHASE_10_5_UI_REFINEMENT.md](docs/PHASE_10_5_UI_REFINEMENT.md); il resoconto delle verifiche finali è in [docs/PHASE_10_5_COMPLETION_2026-07-27.md](docs/PHASE_10_5_COMPLETION_2026-07-27.md).

La chiusura include l'audit correttivo dell'intera specifica: form Spesa, KPI e insight Dashboard, alternative accessibili dei grafici, report filtrabili, cataloghi con stato persistente e controlli Impostazioni uniformati.

## Fase 10.6 — Correzioni visuali

La seconda rifinitura corregge l'allineamento delle StatCard, rende leggibili i dati espansi della Dashboard, permette di mostrare e nascondere le categorie del doughnut dalla lista e imposta lo storico a 12 mesi per nuovi utenti e preferenze ripristinate. Le date tabellari usano il nome completo del mese.

Il form Spesa su pagina usa sezioni-card separate, la ricerca Spese è racchiusa nella propria card e l'indicatore delle spese ricorrenti è testuale. Filtri, counter card e pulsanti sono uniformati in Ricorrenze, Categorie, Etichette e Notifiche. I valori multipli di `ng-select` mantengono colore, padding e rimozione individuale accessibile.

La specifica è in [docs/PHASE_10_6_UI_CORRECTIONS.md](docs/PHASE_10_6_UI_CORRECTIONS.md); il resoconto finale è in [docs/PHASE_10_6_COMPLETION_2026-07-27.md](docs/PHASE_10_6_COMPLETION_2026-07-27.md).

## Fase 10.7 — Navigazione e breadcrumb

La sidebar separa ora le quattro pagine operative sotto “Gestione” e colloca Notifiche e Impostazioni nell’ultima sezione “Area personale”. Un componente breadcrumb condiviso rende coerenti e navigabili le gerarchie di Gestione, Analisi e Area personale, comprese le pagine di creazione, modifica e dettaglio.

La specifica è in [docs/PHASE_10_7_NAVIGATION_AND_BREADCRUMBS.md](docs/PHASE_10_7_NAVIGATION_AND_BREADCRUMBS.md); il resoconto finale è in [docs/PHASE_10_7_COMPLETION_2026-07-27.md](docs/PHASE_10_7_COMPLETION_2026-07-27.md).

## Fase 10.8 — Counter globali, icone e tema coordinato

I riepiloghi di Spese, Spese ricorrenti, Categorie ed Etichette mantengono il
totale globale e mostrano separatamente il risultato filtrato. Le counter card
di Ricorrenze ed Etichette sono navigabili e applicano filtri backend
autorevoli.

Il catalogo delle 97 icone è ora coerente tra frontend e validazione API. Il
colore accent coordina anche sidebar, topbar e superfici soft in light/dark;
sidebar e card Dashboard includono le correzioni di spaziatura, larghezza ed
enfasi numerica.

La specifica è in [docs/PHASE_10_8_COUNTERS_ICONS_AND_THEME.md](docs/PHASE_10_8_COUNTERS_ICONS_AND_THEME.md); il resoconto finale è in [docs/PHASE_10_8_COMPLETION_2026-07-28.md](docs/PHASE_10_8_COMPLETION_2026-07-28.md).

## Fase 10.9 — Transizioni, gerarchia e tabelle

Il cambio tema e accent anima ora le superfici principali senza passaggi
bruschi e aggiorna anche il token Bootstrap RGB dei link. I sovratitoli delle
pagine corrispondono alle sezioni Panoramica, Gestione, Analisi e Area
personale della sidebar.

La sidebar usa una spaziatura uniforme di `0.25rem`; le scadenze Dashboard
seguono l’accento e la tabella Spese ricorrenti adotta hover e transizioni
coerenti con la tabella Spese.

La specifica è in [docs/PHASE_10_9_THEME_HEADERS_AND_TABLES.md](docs/PHASE_10_9_THEME_HEADERS_AND_TABLES.md); il resoconto finale è in [docs/PHASE_10_9_COMPLETION_2026-07-28.md](docs/PHASE_10_9_COMPLETION_2026-07-28.md).

## Fase 11 — Gestione centralizzata dei promemoria

La sezione autenticata <http://localhost:4200/reminders> raccoglie i promemoria di tutte le spese dell’utente. I promemoria sono regole programmate; le notifiche sono invece i messaggi storici prodotti quando una regola diventa dovuta. Annullare o modificare un promemoria non elimina notifiche già generate.

La lista è paginata e filtrata dal backend per ricerca, stato derivato (`ACTIVE`, `UPCOMING`, `DUE`, `PROCESSED`, `CANCELLED`, `INVALID`), tipo, origine (`MANUAL`, `RECURRENCE`, `SYSTEM`), stato spesa, categoria, ricorrenza e intervalli delle due date. Sono disponibili ordinamenti controllati per programmazione, creazione, aggiornamento, data/descrizione spesa e stato. Filtri, ordinamento e pagina sono persistiti nell’URL; page size, densità, tema e accento rispettano le Impostazioni.

Un promemoria non processato può essere modificato riutilizzando il form delle spese. L’annullamento è idempotente. La riattivazione è consentita soltanto per date future collegate a spese `PLANNED` disponibili e senza duplicati equivalenti. L’eliminazione fisica è limitata ai promemoria non processati, senza notifiche e non gestiti da ricorrenza; negli altri casi resta disponibile l’annullamento. Le azioni massive accettano al massimo 100 UUID e restituiscono successi ed errori parziali senza modificare spese o template ricorrenti.

Endpoint globali autenticati:

```text
GET    /api/v1/reminders
GET    /api/v1/reminders/summary
GET    /api/v1/reminders/:id
PATCH  /api/v1/reminders/:id
PATCH  /api/v1/reminders/:id/cancel
PATCH  /api/v1/reminders/:id/reactivate
DELETE /api/v1/reminders/:id
PATCH  /api/v1/reminders/bulk/cancel
PATCH  /api/v1/reminders/bulk/reactivate
DELETE /api/v1/reminders/bulk
```

I promemoria copiati dai template di una ricorrenza sono marcati esplicitamente `RECURRENCE`: una modifica dalla pagina agisce solo sull’occorrenza selezionata e non cambia la regola. Lo scheduler della Fase 8 resta l’unico responsabile della generazione delle notifiche.

La specifica è in [docs/PHASE_11_REMINDERS_MANAGEMENT.md](docs/PHASE_11_REMINDERS_MANAGEMENT.md); il resoconto è in [docs/PHASE_11_COMPLETION_2026-07-28.md](docs/PHASE_11_COMPLETION_2026-07-28.md).


## Fase 5 — Dashboard

La dashboard autenticata usa aggregazioni backend e mantiene il periodo selezionato nei query parameter `month` e `year`. Include KPI mensili, confronto con il mese precedente, andamento giornaliero, distribuzione per categoria, storico 6/12 mesi, ultimi inserimenti e prossime spese pianificate.

Endpoint disponibili sotto `/api/v1/dashboard`:

- `GET /summary?month=7&year=2026`
- `GET /daily-trend?month=7&year=2026`
- `GET /category-distribution?month=7&year=2026`
- `GET /monthly-trend?month=7&year=2026&months=12`
- `GET /recent-expenses?limit=5`
- `GET /upcoming-expenses?limit=5`

Le metriche effettive includono esclusivamente spese `COMPLETED`; le spese future includono esclusivamente `PLANNED` non eliminate con data da oggi in avanti. Gli importi API sono stringhe decimali e tutte le aggregazioni finanziarie sono calcolate con Prisma `Decimal`.

Il seed development crea dati dashboard idempotenti su sei mesi, spese future, una spesa annullata e una categoria personalizzata. Per rigenerarlo:

```bash
npm run db:migrate
npm run db:seed
```


## Fase 6 — Report mensili

Sono disponibili due sezioni autenticate e lazy-loaded:

- <http://localhost:4200/reports/monthly> per il report completo di un singolo mese;
- <http://localhost:4200/reports/compare> per il confronto tra esattamente due mesi.

Il report mensile include totali e conteggi separati per stato, medie, giorno e spesa massimi, distribuzione per categoria, andamento giornaliero completo, breakdown dei metodi di pagamento e lista spese filtrabile con paginazione server-side. Il confronto include differenze assolute e percentuali, otto metriche, unione delle categorie, andamento per giorno di calendario e metodi di pagamento.

Endpoint disponibili sotto `/api/v1/reports`:

- `GET /monthly?month=7&year=2026`
- `GET /monthly/expenses?month=7&year=2026&page=1&pageSize=20`
- `GET /month-comparison?monthA=6&yearA=2026&monthB=7&yearB=2026`
- `GET /category-comparison?monthA=6&yearA=2026&monthB=7&yearB=2026`
- `GET /daily-comparison?monthA=6&yearA=2026&monthB=7&yearB=2026&mode=CALENDAR_DAY`

Solo le spese `COMPLETED` alimentano spesa effettiva, medie, categorie e metodi; le `PLANNED` restano separate e le `CANCELLED` sono soltanto conteggiate. Tutti gli importi API sono stringhe decimali; le percentuali non confrontabili sono `null`. I giorni inesistenti nei mesi più corti sono `null`, non zero.


## Fase 7 — Calendario

La sezione autenticata <http://localhost:4200/calendar> offre viste mensile, settimanale ed elenco. Vista, data e filtri sono sincronizzati nei query parameter; ogni cambio periodo carica esclusivamente l’intervallo visibile.

L’implementazione usa una griglia Angular nativa, responsive e accessibile, senza aggiungere una libreria calendario. Le spese restano l’unica fonte dati: non esiste un modello calendario persistente. Dal calendario si può creare una spesa con data e ora precompilate, aprire dettaglio e modifica, cambiare rapidamente stato e gestire le pianificate scadute.

Le sole spese `PLANNED` possono essere trascinate su desktop. Il comando “Cambia data” garantisce la stessa operazione da tastiera e touch; entrambi usano `ExpenseService.update`, applicano l’aggiornamento ottimistico e ripristinano la data originale in caso di errore.

Endpoint dedicato di sola lettura:

```text
GET /api/v1/calendar/expenses?start=2026-06-29&end=2026-08-03&status=PLANNED,COMPLETED
```

`start` è inclusiva, `end` esclusiva e l’intervallo massimo è 366 giorni. Sono disponibili filtri per stato, categoria, etichette con semantica ANY, metodo di pagamento e ricerca su descrizione/esercente. Ownership e soft delete sono sempre applicati dal backend.
