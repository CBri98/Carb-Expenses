# Carbexpenses

Gestionale per la registrazione, pianificazione e analisi delle spese personali.

Sono complete le Fasi 1–4: setup Docker, autenticazione, categorie ed etichette e gestione completa delle spese. Dashboard, report, grafici, calendario, notifiche e ricorrenze appartengono alle fasi successive e non sono ancora implementati.

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

In `development` il seed crea l’utente configurato da `DEMO_USER_EMAIL` e `DEMO_USER_PASSWORD`, quattro etichette e venti spese dimostrative distribuite su più mesi. In produzione non crea dati demo.

## Funzionalità disponibili

L’autenticazione include registrazione, login, logout, ripristino sessione e refresh token ruotati e revocabili. Le password e i token persistiti sono protetti con Argon2id; il refresh token viaggia in cookie `HttpOnly`.

Le sezioni protette principali sono:

- <http://localhost:4200/expenses>
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
