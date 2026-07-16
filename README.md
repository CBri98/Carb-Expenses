# Carbexpenses

Gestionale per la registrazione, pianificazione e analisi delle spese personali.

Sono complete le Fasi 1–7: setup Docker, autenticazione, categorie ed etichette, gestione spese, dashboard, report mensili e calendario gestionale. Notifiche e ricorrenze appartengono alle fasi successive e non sono ancora implementate.

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

In `development` il seed crea l’utente configurato da `DEMO_USER_EMAIL` e `DEMO_USER_PASSWORD`, quattro etichette e venticinque spese dimostrative distribuite su più mesi. In produzione non crea dati demo.

## Funzionalità disponibili

L’autenticazione include registrazione, login, logout, ripristino sessione e refresh token ruotati e revocabili. Le password e i token persistiti sono protetti con Argon2id; il refresh token viaggia in cookie `HttpOnly`.

Le sezioni protette principali sono:

- <http://localhost:4200/expenses>
- <http://localhost:4200/calendar>
- <http://localhost:4200/reports/monthly>
- <http://localhost:4200/reports/compare>
- <http://localhost:4200/settings/categories>
- <http://localhost:4200/settings/labels>

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
npm run build:backend
npm run build:frontend
npm run --workspace @carbexpenses/backend prisma:validate
docker compose config
```

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


## Fase 5 — Dashboard

La dashboard autenticata usa aggregazioni backend e mantiene il periodo selezionato nei query parameter `month` e `year`. Include KPI mensili, confronto con il mese precedente, andamento giornaliero, distribuzione per categoria, storico 6/12 mesi, ultimi inserimenti e prossime spese pianificate.

Endpoint disponibili sotto `/api/v1/dashboard`:

- `GET /summary?month=7&year=2026`
- `GET /daily-trend?month=7&year=2026`
- `GET /category-distribution?month=7&year=2026`
- `GET /monthly-trend?month=7&year=2026&months=6`
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
