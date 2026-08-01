# PHASE_10_POLISH_RELEASE.md

## Obiettivo

Implementare la **Fase 10 — Rifinitura, stabilizzazione e rilascio** dell’applicazione descritta in `AGENTS.md`.

Questa fase non deve introdurre nuove funzionalità principali.

L’obiettivo è trasformare il progetto realizzato nelle fasi precedenti in una versione:

* coerente;
* stabile;
* sicura;
* responsive;
* accessibile;
* testata;
* documentata;
* osservabile;
* distribuibile;
* aggiornabile;
* ripristinabile;
* pronta per un primo rilascio production.

Al termine della fase deve essere possibile:

* avviare l’intero progetto in development;
* eseguire test, lint, type checking e build;
* avviare una configurazione Docker production;
* distribuire frontend, backend e MariaDB;
* applicare le migrazioni in sicurezza;
* verificare lo stato dei servizi tramite healthcheck;
* consultare log comprensibili;
* effettuare backup e ripristino del database;
* utilizzare tutte le funzionalità principali da desktop e mobile;
* completare un percorso end-to-end senza errori;
* eseguire una pipeline CI;
* produrre una release versionata.

Implementare direttamente le modifiche nel repository.

Non limitarsi a produrre documentazione o suggerimenti.

---

# Operazioni preliminari

Prima di modificare il codice:

1. leggere integralmente `AGENTS.md`;
2. leggere integralmente `docs/PHASE_12_POLISH_RELEASE.md`;
3. analizzare lo stato reale del repository;
4. eseguire `git status` e `git diff`;
5. leggere i documenti delle Fasi 1–11;
6. verificare quali funzionalità sono realmente presenti;
7. non considerare completata una fase soltanto perché esiste il relativo documento;
8. eseguire una prima baseline di:

   * test backend;
   * test frontend;
   * lint;
   * type checking;
   * build backend;
   * build frontend;
   * `prisma validate`;
   * avvio Docker Compose;
9. registrare gli errori reali trovati;
10. classificare gli errori per priorità;
11. correggere prima quelli bloccanti;
12. evitare refactoring puramente estetici non necessari;
13. non ricominciare da zero;
14. non sostituire architetture funzionanti senza una motivazione concreta.

Se il repository contiene modifiche non committate, non eliminarle e non sovrascriverle indiscriminatamente.

---

# Ambito della fase

Implementare e verificare:

* revisione completa dei flussi;
* correzione dei bug;
* coerenza grafica;
* responsive design;
* accessibilità;
* gestione uniforme di loading, empty state ed errori;
* validazione frontend e backend;
* sicurezza applicativa;
* performance frontend;
* performance backend;
* indici database;
* logging;
* healthcheck;
* readiness e liveness;
* gestione configurazione;
* Docker production;
* reverse proxy, se previsto;
* migrazioni production;
* backup MariaDB;
* procedura di ripristino;
* test unitari mancanti;
* test di integrazione;
* test end-to-end;
* pipeline CI;
* eventuale pipeline release;
* documentazione;
* versione applicativa;
* changelog;
* checklist di rilascio;
* checklist post-rilascio.

Non implementare nuove funzionalità come:

* multi-valuta;
* condivisione delle spese;
* integrazione bancaria;
* OCR delle ricevute;
* app mobile;
* notifiche push;
* email reali;
* login social;
* amministrazione multiutente;
* intelligenza artificiale;
* nuove tipologie di report;
* nuovi sistemi di pagamento.

Eventuali idee future devono essere inserite in una sezione roadmap, non implementate.

---

# Ordine di esecuzione

Procedere nel seguente ordine:

1. baseline tecnica;
2. inventario delle funzionalità;
3. correzione bug bloccanti;
4. uniformità backend;
5. uniformità frontend;
6. sicurezza;
7. performance;
8. test end-to-end;
9. Docker production;
10. backup e ripristino;
11. CI/CD;
12. documentazione;
13. release candidate;
14. verifica finale.

Ogni passaggio deve lasciare il progetto compilabile.

Non accumulare decine di modifiche senza eseguire verifiche intermedie.

---

# Inventario funzionale

Verificare manualmente che siano presenti e funzionanti almeno:

## Autenticazione

* registrazione;
* login;
* refresh token;
* ripristino sessione;
* logout;
* protezione delle route;
* isolamento tra utenti.

## Categorie ed etichette

* categorie predefinite;
* categorie personalizzate;
* preferenze sulle categorie;
* attivazione e disattivazione;
* etichette;
* ordinamento;
* ownership.

## Spese

* creazione;
* inserimento rapido;
* dettaglio;
* modifica;
* duplicazione;
* cambio stato;
* eliminazione soft;
* ricerca;
* filtri;
* paginazione;
* ordinamento;
* esportazione CSV.

## Dashboard

* KPI;
* confronto con mese precedente;
* grafici;
* ultimi inserimenti;
* prossime spese.

## Report

* report mensile;
* confronto tra mesi;
* categorie;
* andamento giornaliero;
* metodi di pagamento.

## Calendario

* vista mese;
* vista settimana;
* vista elenco;
* creazione da data;
* dettaglio;
* modifica;
* eventuale drag and drop;
* spese scadute.

## Notifiche

* promemoria;
* scheduler;
* notifiche non lette;
* campanella;
* dropdown;
* pagina notifiche;
* idempotenza.

## Ricorrenze

* creazione;
* anteprima;
* generazione;
* pausa;
* ripresa;
* terminazione;
* modifica;
* integrazione con spese e promemoria;
* idempotenza.

Per ogni flusso non funzionante:

* individuare la causa;
* correggere il problema;
* aggiungere un test di regressione;
* aggiornare la documentazione se necessario.

---

# Classificazione dei problemi

Classificare i problemi rilevati.

## P0 — Bloccante

Esempi:

* applicazione non avviabile;
* migrazione non applicabile;
* perdita o corruzione dati;
* accesso a dati di altri utenti;
* login non funzionante;
* build production fallita;
* scheduler che genera duplicati.

Correggere immediatamente.

## P1 — Grave

Esempi:

* CRUD incompleto;
* filtri errati;
* importi sbagliati;
* date spostate;
* pagina inutilizzabile su mobile;
* errori non gestiti;
* test principali falliti.

Correggere prima della release.

## P2 — Medio

Esempi:

* feedback utente incompleto;
* layout incoerente;
* accessibilità parziale;
* query migliorabile;
* testi poco chiari.

Correggere quando il rischio è contenuto.

## P3 — Minore

Esempi:

* rifiniture visive;
* microcopy;
* spaziatura;
* animazioni.

Correggere soltanto senza destabilizzare il progetto.

---

# Coerenza backend

Verificare che tutti i moduli NestJS seguano convenzioni uniformi.

Controllare:

* prefisso `/api/v1`;
* autenticazione;
* DTO;
* validazione;
* ownership;
* mapper;
* error handling;
* logging;
* Swagger;
* paginazione;
* soft delete;
* serializzazione degli importi;
* serializzazione delle date.

I controller devono restare sottili.

La business logic deve risiedere nei service.

Non restituire direttamente oggetti Prisma.

Non esporre campi interni.

---

# Risposte API

Uniformare le risposte API secondo la convenzione esistente.

Esempio di successo:

```json
{
  "data": {},
  "meta": {},
  "message": "Operazione completata"
}
```

Esempio di errore:

```json
{
  "statusCode": 400,
  "message": "Dati non validi",
  "errors": {
    "amount": [
      "L'importo deve essere maggiore di zero"
    ]
  },
  "timestamp": "2026-07-16T14:30:00.000Z",
  "path": "/api/v1/expenses"
}
```

Non introdurre un nuovo wrapper se il progetto utilizza già una convenzione diversa e coerente.

Correggere invece le risposte che non rispettano la convenzione scelta.

---

# Gestione centralizzata degli errori

Verificare o implementare:

* exception filter globale;
* mapping degli errori Prisma;
* errori di validazione;
* errori di autenticazione;
* errori di ownership;
* conflitti;
* risorse non trovate;
* errori inattesi.

Non mostrare al client:

* stack trace;
* query SQL;
* password;
* token;
* dettagli Prisma;
* percorsi del filesystem;
* configurazioni interne.

Loggare internamente l’errore con un correlation ID.

Restituire all’utente un messaggio sicuro e comprensibile.

---

# Correlation ID

Aggiungere un identificatore per ogni richiesta.

Header possibile:

```text
X-Request-Id
```

Comportamento:

* utilizzare l’ID ricevuto, se valido;
* altrimenti generarne uno;
* aggiungerlo ai log;
* restituirlo nella risposta;
* usarlo per correlare errori e richieste.

Non includere dati sensibili nel correlation ID.

---

# Logging backend

Usare logging strutturato e coerente.

Registrare almeno:

* avvio applicazione;
* ambiente;
* porta;
* request ID;
* metodo HTTP;
* route;
* codice risposta;
* durata;
* errori;
* esecuzione scheduler;
* migrazioni, se gestite dal bootstrap;
* healthcheck falliti.

Non registrare:

* password;
* access token;
* refresh token;
* cookie;
* body completo del login;
* note private delle spese;
* valori sensibili.

In production ridurre i log di debug.

Prevedere livelli:

```text
error
warn
log
debug
verbose
```

o equivalenti.

---

# Configurazione e variabili d’ambiente

Centralizzare la configurazione NestJS.

Verificare tutte le variabili usate nelle fasi precedenti.

Creare una validazione all’avvio.

Variabili minime indicative:

```env
NODE_ENV=production

FRONTEND_PORT=80
BACKEND_PORT=3000

DATABASE_HOST=mariadb
DATABASE_PORT=3306
DATABASE_NAME=expense_manager
DATABASE_USER=expense_user
DATABASE_PASSWORD=change_me
DATABASE_ROOT_PASSWORD=change_me_root
DATABASE_URL=mysql://expense_user:change_me@mariadb:3306/expense_manager

JWT_ACCESS_SECRET=change_me
JWT_REFRESH_SECRET=change_me
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

CORS_ORIGIN=https://example.com
COOKIE_DOMAIN=example.com
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax

DEFAULT_CURRENCY=EUR
DEFAULT_TIMEZONE=Europe/Rome
DEFAULT_EXPENSE_REMINDER_TIME=09:00

NOTIFICATION_SCHEDULER_CRON=*/1 * * * *
NOTIFICATION_POLL_INTERVAL_MS=60000

RECURRENCE_SCHEDULER_CRON=0 * * * *
DEFAULT_RECURRENCE_GENERATION_DAYS_AHEAD=30
MAX_RECURRENCE_GENERATION_DAYS_AHEAD=365
MAX_RECURRENCE_OCCURRENCES_PER_RUN=500

LOG_LEVEL=log
APP_VERSION=1.0.0
```

Non inserire segreti reali in:

* repository;
* `.env.example`;
* Dockerfile;
* log;
* immagini Docker.

---

# Sicurezza autenticazione

Verificare:

* password con Argon2 o algoritmo sicuro già adottato;
* access token a breve durata;
* refresh token ruotabili;
* hash del refresh token nel database;
* revoca al logout;
* prevenzione riutilizzo;
* cookie `HttpOnly`;
* cookie `Secure` in production;
* `SameSite` coerente;
* CORS ristretto;
* rate limiting;
* messaggi login non enumerabili;
* nessuna password restituita;
* nessun token nei log.

Aggiungere test di regressione per i flussi critici.

---

# Sicurezza applicativa

Verificare:

* Helmet;
* CORS;
* validation pipe globale;
* whitelist;
* rifiuto campi sconosciuti, se adottato;
* rate limiting;
* dimensione massima del body;
* query parameter validati;
* UUID validati;
* ownership in ogni service;
* CSV injection;
* output encoding;
* nessun HTML non sanificato;
* nessun `innerHTML` non necessario;
* nessuna interpolazione SQL.

---

# CSV injection

Durante l’esportazione CSV, proteggere celle che iniziano con:

```text
=
+
-
@
```

Valutare escaping o prefisso sicuro.

Non alterare importi numerici normali.

Aggiungere test con descrizioni potenzialmente pericolose.

---

# Rate limiting

Verificare almeno:

## Endpoint autenticazione

Limiti più restrittivi:

* login;
* registrazione;
* refresh;
* recupero password futuro.

## Endpoint normali

Limiti ragionevoli per impedire abusi senza compromettere l’utilizzo.

## Export

Limitare richieste frequenti o dataset eccessivi.

## Preview ricorrenze

Evitare chiamate incontrollate.

Documentare i limiti.

---

# Healthcheck

Implementare o completare:

```http
GET /api/v1/health
GET /api/v1/health/live
GET /api/v1/health/ready
```

## Liveness

Verifica che il processo sia attivo.

Non deve dipendere da servizi esterni non essenziali.

## Readiness

Verifica almeno:

* connessione database;
* Prisma;
* configurazione minima.

Risposta indicativa:

```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-07-16T14:30:00.000Z",
  "checks": {
    "database": "ok"
  }
}
```

Non esporre segreti o dettagli dell’infrastruttura.

---

# Graceful shutdown

Configurare NestJS per gestire correttamente:

* `SIGTERM`;
* `SIGINT`;
* chiusura Prisma;
* completamento richieste in corso;
* stop scheduler;
* chiusura server.

Il container deve poter terminare senza corrompere operazioni in corso.

---

# Database e schema

Verificare:

* schema Prisma formattato;
* relazioni;
* `onDelete`;
* indici;
* vincoli univoci;
* tipi `Decimal`;
* campi data;
* soft delete;
* ownership;
* chiavi idempotenti.

Non modificare lo schema soltanto per uniformità estetica.

Creare migrazioni soltanto per modifiche necessarie.

Non modificare migrazioni già applicate.

Creare nuove migrazioni correttive.

---

# Revisione degli indici

Analizzare le query più frequenti.

Verificare indici almeno per:

```text
User.email

Expense.userId
Expense.expenseDate
Expense.status
Expense.categoryId
Expense.paymentMethod
Expense.createdAt
Expense.deletedAt

Notification.userId
Notification.status
Notification.createdAt

ExpenseReminder.scheduledAt
ExpenseReminder.isActive
ExpenseReminder.processedAt

RecurrenceRule.userId
RecurrenceRule.status
RecurrenceRule.nextOccurrenceDate

Category.userId
Category.slug

Label.userId
Label.slug
```

Evitare indici ridondanti.

Verificare con query reali o explain plan quando opportuno.

---

# Integrità finanziaria

Verificare che:

* tutti gli importi siano `Decimal`;
* nessun totale importante usi floating point non controllati;
* mapper e DTO trattino gli importi in modo coerente;
* il frontend riceva stringhe decimali;
* il formato visualizzato sia `it-IT`;
* l’ordinamento per importo avvenga nel database;
* il CSV mantenga precisione;
* medie e percentuali siano arrotondate coerentemente.

Aggiungere test per:

```text
0.01
9999999999.99
12.10
12.01
```

e per somme con più record decimali.

---

# Integrità temporale

Verificare:

* date locali;
* fuso `Europe/Rome`;
* passaggio ora legale;
* febbraio;
* anni bisestili;
* giorno 31;
* passaggio anno;
* scheduler;
* promemoria;
* ricorrenze;
* query mensili;
* calendario.

Aggiungere test specifici per date limite.

Non usare il fuso orario della macchina come comportamento implicito.

---

# Scheduler

Verificare entrambi:

```text
NotificationScheduler
RecurrenceScheduler
```

Controllare:

* avvio singolo;
* idempotenza;
* concorrenza;
* logging;
* gestione errori;
* limite per ciclo;
* configurazione cron;
* stop durante shutdown;
* esclusione dati eliminati;
* esclusione utenti non proprietari;
* nessun duplicato dopo riavvio.

In ambiente con più repliche backend, documentare le limitazioni attuali.

Se il progetto è previsto inizialmente con una singola replica, dichiararlo chiaramente.

Non introdurre Redis o code distribuite in questa fase.

---

# Coerenza frontend

Verificare che tutte le pagine seguano:

* Reddit Sans;
* tema light;
* palette pastello;
* sidebar coerente;
* topbar coerente;
* page header coerente;
* spaziatura coerente;
* card coerenti;
* pulsanti coerenti;
* ng-select coerente;
* datepicker coerente;
* tabelle coerenti;
* modali coerenti;
* toast coerenti;
* filtri collassabili coerenti;
* badge coerenti.

Non introdurre un secondo design system.

Centralizzare gli stili comuni.

Ridurre CSS duplicato.

---

# Design token

Centralizzare almeno:

```scss
:root {
  --app-bg: #f5f7fb;
  --surface: #ffffff;
  --surface-soft: #f8f4ff;
  --sidebar-bg: #eef2ff;

  --primary: #7c83d6;
  --primary-hover: #696fc0;
  --secondary: #8fc9bd;
  --accent: #efb6a6;

  --text-primary: #303342;
  --text-secondary: #727789;
  --border-color: #e1e4ee;

  --success: #82b89e;
  --warning: #e3bd78;
  --danger: #df9299;

  --focus-ring: rgba(124, 131, 214, 0.3);
  --shadow-sm: 0 2px 8px rgba(48, 51, 66, 0.06);
  --shadow-md: 0 10px 30px rgba(48, 51, 66, 0.08);

  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
}
```

Adattare i valori allo stile reale già adottato.

Non sostituire una palette funzionante senza necessità.

---

# Tipografia

Usare Reddit Sans con fallback:

```css
font-family:
  "Reddit Sans",
  Inter,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

Verificare:

* pesi realmente caricati;
* nessun font non utilizzato;
* performance;
* fallback in caso di mancato caricamento;
* leggibilità;
* dimensioni minime;
* line-height.

Non includere file font non autorizzati o non necessari.

---

# Responsive design

Verificare tutte le pagine a larghezze indicative:

```text
360 px
390 px
768 px
1024 px
1280 px
1440 px
```

Controllare:

* sidebar;
* topbar;
* tabelle;
* card;
* modali;
* form;
* ng-select;
* datepicker;
* grafici;
* calendario;
* dropdown notifiche;
* filtri;
* paginazione;
* menu azioni.

Nessun contenuto principale deve produrre scroll orizzontale involontario.

Le tabelle possono usare scroll controllato o trasformarsi in card.

---

# Accessibilità

Raggiungere almeno una buona conformità pratica a WCAG 2.1 AA.

Verificare:

* contrasto;
* navigazione da tastiera;
* focus visibile;
* ordine del focus;
* skip link;
* heading gerarchici;
* landmark;
* label dei form;
* errori associati;
* pulsanti icona;
* modali;
* offcanvas;
* dropdown;
* tabelle;
* grafici;
* calendario;
* toast;
* loading;
* empty state;
* stato non indicato soltanto dal colore.

Aggiungere:

```text
Salta al contenuto principale
```

come skip link.

---

# Reduced motion

Rispettare:

```css
@media (prefers-reduced-motion: reduce)
```

Ridurre o eliminare:

* transizioni non essenziali;
* animazioni;
* scroll animato;
* animazioni Chart.js.

Non disabilitare funzionalità.

---

# Grafici accessibili

Per ogni grafico:

* titolo;
* descrizione;
* riepilogo testuale;
* tabella o elenco alternativo;
* tooltip leggibili;
* colori con contrasto;
* informazioni non affidate soltanto al colore.

Verificare il ridimensionamento.

Evitare memory leak e istanze duplicate.

---

# Form

Verificare tutti i form:

* login;
* registrazione;
* categorie;
* etichette;
* spese;
* filtri;
* promemoria;
* ricorrenze.

Controllare:

* validazione;
* messaggi italiani;
* loading;
* doppio submit;
* focus sul primo errore;
* preservazione dati;
* campi disabilitati;
* reset;
* stato dirty;
* conferma uscita con modifiche non salvate, se utile.

Non aggiungere una conferma invasiva su ogni form.

---

# Gestione delle sessioni scadute

Verificare:

* refresh automatico;
* una sola richiesta di refresh concorrente;
* accodamento delle richieste;
* logout quando il refresh fallisce;
* redirect al login;
* messaggio comprensibile;
* nessun loop infinito;
* nessuna perdita incontrollata del form.

Aggiungere test specifici.

---

# Loading, empty ed error state

Ogni pagina principale deve avere:

* loading iniziale;
* aggiornamento in corso;
* empty state;
* errore;
* retry.

Pagine:

```text
Dashboard
Spese
Categorie
Etichette
Report
Confronto
Calendario
Notifiche
Ricorrenze
```

Non lasciare aree vuote senza spiegazione.

---

# Toast

Uniformare:

* successo;
* errore;
* warning;
* informazione.

Definire durata coerente.

Gli errori importanti non devono sparire troppo rapidamente.

Evitare toast duplicati per la stessa azione.

Assicurare accessibilità tramite live region.

---

# Performance frontend

Verificare:

* lazy loading;
* chunk size;
* import inutilizzati;
* Chart.js tree shaking;
* icone;
* font;
* immagini;
* subscribe;
* memory leak;
* change detection;
* rendering di liste;
* debounce;
* richieste duplicate;
* cache locale.

Non introdurre ottimizzazioni premature che rendano il codice illeggibile.

---

# Budget delle bundle

Definire budget Angular ragionevoli.

Esempio indicativo:

```json
{
  "type": "initial",
  "maximumWarning": "750kb",
  "maximumError": "1mb"
}
```

Adattare ai valori reali del progetto.

Non alzare indiscriminatamente i limiti per nascondere regressioni.

Analizzare bundle troppo grandi.

---

# Performance backend

Verificare:

* query N+1;
* select e include eccessivi;
* aggregazioni;
* paginazione;
* export;
* calendario;
* dashboard;
* report;
* scheduler;
* ricorrenze;
* notifiche.

Applicare:

* `select` mirati;
* query aggregate;
* transazioni limitate;
* batch controllati;
* indici;
* limiti massimi.

Non recuperare dataset completi senza motivo.

---

# Limiti applicativi

Definire limiti espliciti:

```text
Page size massimo: 100
Export CSV massimo: valore ragionevole
Intervallo calendario massimo: 366 giorni
Anteprima ricorrenze massima: 50 date
Occorrenze per ciclo: 500
Lunghezza note: 5000 caratteri
Lunghezza descrizione: 150 caratteri
```

Documentare i limiti.

Non lasciare richieste potenzialmente illimitate.

---

# Caching HTTP

Valutare caching soltanto per risorse sicure e adatte.

Possibili candidati:

* categorie predefinite;
* configurazioni statiche;
* asset frontend.

Non applicare cache condivisa a:

* spese;
* dashboard;
* notifiche;
* dati privati.

Impostare header appropriati per le API autenticate:

```text
Cache-Control: no-store
```

quando necessario.

---

# Docker development

Verificare che:

```bash
docker compose up --build
```

avvii correttamente:

* frontend;
* backend;
* MariaDB.

Verificare:

* healthcheck;
* dipendenze;
* volumi;
* rete;
* migrazioni;
* seed development;
* restart policy appropriata.

Il seed non deve essere eseguito in production.

---

# Docker production

Creare o completare una configurazione production.

Possibili file:

```text
docker-compose.prod.yml
apps/frontend/Dockerfile
apps/backend/Dockerfile
```

Usare build multi-stage.

## Backend

Stage indicativi:

1. dependencies;
2. build;
3. runtime.

Il runtime deve contenere soltanto ciò che serve.

## Frontend

Compilare Angular e servire gli asset tramite:

* Nginx;
* oppure altro server statico già scelto.

Non eseguire `ng serve` in production.

---

# Utenti non root

I container production devono preferibilmente eseguire processi non root.

Verificare:

* permessi;
* directory;
* Prisma;
* log;
* file temporanei.

Non compromettere il funzionamento per applicare una configurazione teorica non verificata.

---

# Immagini Docker

Ottimizzare:

* `.dockerignore`;
* dipendenze;
* cache layer;
* dimensione;
* file copiati;
* source map production;
* dev dependency.

Non copiare:

* `.git`;
* `node_modules` locale;
* `.env`;
* test non necessari nel runtime;
* documenti non necessari;
* file temporanei.

---

# Reverse proxy

Se il frontend è servito con Nginx, configurare:

* SPA fallback;
* `/api` verso backend, se previsto;
* header di sicurezza;
* compressione;
* cache degli asset hashati;
* no-cache per `index.html`;
* limite body coerente;
* timeout ragionevoli.

Esempio SPA:

```text
try_files $uri $uri/ /index.html;
```

Non hardcodare domini personali.

---

# Header di sicurezza

Configurare, dove appropriato:

```text
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
Content-Security-Policy
Strict-Transport-Security
```

Applicare HSTS soltanto in ambienti HTTPS reali.

La Content Security Policy deve essere compatibile con:

* Angular;
* Chart.js;
* font;
* stili;
* eventuali librerie calendario.

Non usare una CSP inutilmente permissiva come soluzione definitiva.

---

# Migrazioni production

Definire una strategia chiara.

In production usare:

```bash
prisma migrate deploy
```

Non usare:

```bash
prisma migrate dev
prisma db push
```

Definire quando eseguire le migrazioni:

* job separato;
* comando controllato;
* entrypoint prima del backend, se sicuro per singola istanza.

Evitare che più repliche eseguano contemporaneamente operazioni non sicure.

Documentare la procedura.

---

# Seed production

Non eseguire il seed demo in production.

Se servono categorie globali, separare:

* seed applicativo necessario;
* dati demo.

Il seed production-safe deve essere:

* idempotente;
* limitato ai dati obbligatori;
* privo di utenti demo;
* privo di spese demo;
* privo di notifiche demo;
* privo di ricorrenze demo.

---

# Backup MariaDB

Creare una procedura documentata di backup.

Esempio:

```bash
docker compose exec -T mariadb \
  mariadb-dump \
  --single-transaction \
  --routines \
  --triggers \
  -u"$DATABASE_USER" \
  -p"$DATABASE_PASSWORD" \
  "$DATABASE_NAME" > backup.sql
```

Adattare il comando all’ambiente reale.

Non inserire password reali nel repository.

---

# Script backup

Creare, se appropriato:

```text
scripts/backup-db.sh
scripts/restore-db.sh
```

Per Windows è possibile aggiungere:

```text
scripts/backup-db.ps1
scripts/restore-db.ps1
```

Gli script devono:

* controllare le variabili;
* interrompersi in caso di errore;
* usare nomi file timestampati;
* non sovrascrivere backup senza conferma;
* restituire un exit code corretto.

---

# Ripristino database

Documentare una procedura testata.

Il ripristino deve indicare:

1. fermare le scritture;
2. creare un backup precauzionale;
3. verificare il database target;
4. importare il dump;
5. applicare eventuali migrazioni;
6. riavviare i servizi;
7. verificare healthcheck;
8. verificare dati principali.

Non dichiarare la strategia di backup completata senza aver testato almeno un ripristino development.

---

# Retention backup

Documentare una strategia indicativa:

```text
backup giornalieri: 7
backup settimanali: 4
backup mensili: 6
```

Non implementare servizi cloud esterni in questa fase.

Segnalare che i backup devono essere conservati fuori dal volume principale in un ambiente reale.

---

# Test unitari

Verificare copertura delle funzioni critiche:

* calcolo date;
* importi;
* percentuali;
* ownership;
* mapping;
* ricorrenze;
* promemoria;
* idempotenza;
* filtri;
* query DTO.

Non inseguire una percentuale di coverage artificiale.

Dare priorità alle regole di business.

---

# Test di integrazione backend

Verificare almeno:

* autenticazione;
* categorie;
* etichette;
* spese;
* dashboard;
* report;
* calendario;
* notifiche;
* ricorrenze.

Usare un database di test isolato.

Non eseguire test distruttivi sul database development.

La suite deve poter essere eseguita in CI.

---

# Test end-to-end

Utilizzare una soluzione compatibile con il progetto, preferibilmente:

```text
Playwright
```

Verificare compatibilità prima dell’installazione.

Non installare più framework E2E.

Creare una suite essenziale, stabile e significativa.

---

# Scenari E2E

Implementare almeno:

## Scenario 1 — Autenticazione

1. registrazione;
2. login;
3. dashboard;
4. logout;
5. nuovo login.

## Scenario 2 — Spesa

1. login;
2. nuova spesa;
3. categoria;
4. etichette;
5. salvataggio;
6. ricerca;
7. modifica;
8. duplicazione;
9. eliminazione.

## Scenario 3 — Spesa futura

1. creare spesa futura;
2. verificare `PLANNED`;
3. visualizzare nel calendario;
4. segnare completata.

## Scenario 4 — Report

1. creare dati in due mesi;
2. aprire report;
3. confrontare mesi;
4. verificare valori principali.

## Scenario 5 — Promemoria

1. creare spesa futura;
2. aggiungere promemoria;
3. eseguire il servizio in modalità controllata;
4. verificare notifica;
5. segnarla letta.

## Scenario 6 — Ricorrenza

1. creare ricorrenza;
2. verificare anteprima;
3. generare occorrenza;
4. verificare spesa;
5. sospendere;
6. riattivare;
7. terminare.

---

# Stabilità dei test E2E

Evitare:

* timeout arbitrari;
* selettori CSS fragili;
* dipendenza da dati condivisi;
* date reali non controllate;
* ordine tra test non dichiarato.

Usare:

* attributi `data-testid` soltanto dove utili;
* dati isolati;
* clock controllabile, quando necessario;
* cleanup;
* retry limitato.

Non nascondere test instabili aumentando indiscriminatamente i retry.

---

# Clock nei test

Le funzionalità temporali richiedono test deterministici.

Predisporre un’astrazione per l’orario corrente, per esempio:

```text
ClockService
```

oppure utility equivalente.

Usarla almeno in:

* dashboard;
* report;
* calendario;
* notifiche;
* ricorrenze.

In production restituisce l’ora reale.

Nei test può essere sostituita.

Non usare `new Date()` sparso in tutta la business logic.

---

# CI

Creare una pipeline GitHub Actions, salvo diversa piattaforma già presente.

File consigliato:

```text
.github/workflows/ci.yml
```

La pipeline deve eseguire almeno:

1. checkout;
2. setup Node;
3. installazione lockfile;
4. Prisma generate;
5. lint;
6. type checking;
7. test backend;
8. test frontend;
9. build backend;
10. build frontend.

Utilizzare:

```bash
npm ci
```

quando il progetto usa npm e lockfile coerente.

---

# Servizio MariaDB in CI

Per test di integrazione usare:

* service container MariaDB;
* oppure Docker Compose dedicato.

Configurare:

* database test;
* credenziali test;
* healthcheck;
* migrazioni;
* cleanup.

Non utilizzare segreti production.

---

# Cache CI

Applicare cache per:

* npm;
* eventuali browser Playwright.

Non memorizzare:

* `.env`;
* database;
* segreti;
* output contenenti dati sensibili.

La pipeline deve restare riproducibile senza cache.

---

# Pipeline E2E

È possibile creare:

```text
.github/workflows/e2e.yml
```

oppure aggiungere un job separato.

Il job deve:

1. avviare database;
2. applicare migrazioni;
3. avviare backend;
4. avviare frontend;
5. attendere healthcheck;
6. eseguire Playwright;
7. raccogliere report;
8. salvare screenshot e trace soltanto in caso di fallimento.

---

# Pipeline Docker

Creare opzionalmente:

```text
.github/workflows/docker.yml
```

Deve almeno verificare:

* build immagine backend;
* build immagine frontend;
* avvio smoke test;
* healthcheck.

Non pubblicare immagini in un registry senza una configurazione esplicita.

Predisporre eventualmente il workflow con publish disabilitato o condizionato a tag.

---

# Release workflow

Predisporre una release tramite tag:

```text
v1.0.0
```

Possibili operazioni:

* build;
* test;
* immagini Docker;
* changelog;
* GitHub Release.

Non pubblicare automaticamente se mancano:

* registry;
* credenziali;
* destinazione;
* strategia concordata.

Documentare i passaggi manuali mancanti.

---

# Versionamento

Usare Semantic Versioning:

```text
MAJOR.MINOR.PATCH
```

Prima release:

```text
1.0.0
```

Definizioni:

* `MAJOR`: cambi incompatibili;
* `MINOR`: nuove funzionalità compatibili;
* `PATCH`: correzioni compatibili.

Mostrare la versione:

* nei log backend;
* nel healthcheck;
* opzionalmente nel footer o pagina impostazioni.

---

# Changelog

Creare:

```text
CHANGELOG.md
```

Formato consigliato:

```markdown
# Changelog

## [1.0.0] - YYYY-MM-DD

### Added

### Changed

### Fixed

### Security
```

Riepilogare le funzionalità reali.

Non elencare funzionalità non implementate.

---

# README principale

Aggiornare `README.md` con:

* descrizione;
* screenshot opzionali;
* funzionalità;
* stack;
* requisiti;
* setup development;
* variabili d’ambiente;
* Docker;
* migrazioni;
* seed;
* test;
* lint;
* build;
* backup;
* restore;
* release;
* troubleshooting;
* limiti attuali.

---

# Documentazione operativa

Creare eventualmente:

```text
docs/DEPLOYMENT.md
docs/BACKUP_RESTORE.md
docs/OPERATIONS.md
docs/SECURITY.md
docs/TROUBLESHOOTING.md
```

Non duplicare lo stesso contenuto in più file.

## DEPLOYMENT

* prerequisiti;
* configurazione;
* build;
* migrazioni;
* avvio;
* rollback.

## BACKUP_RESTORE

* backup;
* verifica;
* restore;
* retention.

## OPERATIONS

* healthcheck;
* log;
* scheduler;
* riavvio;
* aggiornamento.

## SECURITY

* gestione segreti;
* token;
* cookie;
* CORS;
* rate limit.

## TROUBLESHOOTING

* database non raggiungibile;
* migrazioni;
* healthcheck;
* login;
* Docker;
* build frontend;
* scheduler.

---

# Rollback

Documentare una strategia di rollback.

Distinguere:

## Rollback applicativo

* tornare a immagine precedente;
* mantenere compatibilità con schema DB.

## Rollback database

Le migrazioni Prisma non offrono sempre rollback automatico.

Per modifiche distruttive:

* effettuare backup;
* usare migrazioni additive;
* separare rimozione campi in release successive;
* preparare script manuali controllati.

Non promettere rollback automatici non realmente supportati.

---

# Strategia migrazioni sicure

Preferire:

1. aggiungere nuovi campi nullable;
2. distribuire codice compatibile;
3. migrare dati;
4. rendere obbligatorio in una release successiva;
5. rimuovere vecchi campi successivamente.

Documentare le eccezioni.

Non introdurre ora modifiche distruttive non necessarie.

---

# Osservabilità minima

Implementare una base senza servizi esterni obbligatori.

Comprendere:

* healthcheck;
* logging strutturato;
* request ID;
* versione;
* durata richieste;
* log scheduler;
* errori.

Non introdurre piattaforme esterne come:

* Sentry;
* Datadog;
* Grafana Cloud;
* New Relic;

senza configurazione esplicita.

È possibile predisporre punti di integrazione documentati.

---

# Privacy

Verificare che:

* dati di un utente non siano visibili ad altri;
* log non contengano dettagli finanziari non necessari;
* export sia autenticato;
* backup siano trattati come dati sensibili;
* notifiche non espongano informazioni ad altri utenti;
* endpoint non permettano enumeration.

Documentare che i backup devono essere protetti e cifrati nell’ambiente reale.

---

# Dipendenze

Eseguire un audit delle dipendenze.

Verificare:

* pacchetti non utilizzati;
* duplicati;
* versioni incompatibili;
* peer dependency;
* vulnerabilità note;
* licenze problematiche.

Usare:

```bash
npm audit
```

come segnale, non come unica fonte di verità.

Non applicare:

```bash
npm audit fix --force
```

senza analizzare le modifiche.

Aggiornare soltanto dipendenze con rischio controllato.

---

# Lockfile

Mantenere il lockfile coerente.

Verificare che:

```bash
npm ci
```

funzioni da repository pulito.

Non committare `node_modules`.

Non modificare manualmente il lockfile.

---

# Pulizia repository

Rimuovere:

* file temporanei;
* log locali;
* build output non necessario;
* screenshot di debug;
* backup;
* `.env`;
* database dump;
* codice morto;
* componenti duplicati;
* import inutilizzati;
* TODO obsoleti.

Aggiornare `.gitignore`.

Non rimuovere file senza verificarne l’utilizzo.

---

# Commenti e documentazione nel codice

Mantenere commenti soltanto quando spiegano:

* decisioni non ovvie;
* regole finanziarie;
* date;
* idempotenza;
* scheduler;
* workaround necessari.

Rimuovere commenti che ripetono semplicemente il codice.

Non lasciare blocchi commentati di vecchie implementazioni.

---

# Localizzazione

Verificare:

* testi in italiano;
* date `it-IT`;
* euro;
* nomi mesi;
* metodi di pagamento;
* stati;
* messaggi errore;
* toast;
* accessibilità.

Centralizzare stringhe ricorrenti dove opportuno.

Non implementare un sistema completo i18n se non già presente.

Predisporre però il codice per evitare stringhe duplicate incontrollate.

---

# Browser supportati

Documentare e verificare almeno versioni moderne di:

* Chrome;
* Edge;
* Firefox;
* Safari.

Verificare in particolare:

* input data;
* ng-select;
* modali;
* grafici;
* calendario;
* download CSV;
* cookie.

Non promettere supporto a browser obsoleti non testati.

---

# Smoke test production

Dopo la build production verificare:

1. frontend raggiungibile;
2. backend health;
3. database ready;
4. login;
5. dashboard;
6. creazione spesa;
7. calendario;
8. notifiche;
9. ricorrenze;
10. logout.

Il test deve usare la configurazione production-like, non `ng serve`.

---

# Checklist release candidate

Prima di dichiarare la release candidate:

* [ ] working tree controllato;
* [ ] lockfile coerente;
* [ ] Prisma valid;
* [ ] migrazioni applicabili;
* [ ] seed development funzionante;
* [ ] test backend superati;
* [ ] test frontend superati;
* [ ] test integrazione superati;
* [ ] E2E principali superati;
* [ ] lint superato;
* [ ] type checking superato;
* [ ] build backend superata;
* [ ] build frontend superata;
* [ ] immagini Docker costruite;
* [ ] Docker production avviato;
* [ ] healthcheck verdi;
* [ ] backup eseguito;
* [ ] restore testato;
* [ ] audit dipendenze analizzato;
* [ ] Swagger verificato;
* [ ] responsive verificato;
* [ ] accessibilità verificata;
* [ ] documentazione aggiornata;
* [ ] changelog aggiornato;
* [ ] versione aggiornata;
* [ ] nessun segreto nel repository;
* [ ] nessun TODO bloccante.

Non spuntare attività non realmente eseguite.

---

# Checklist post-rilascio

Dopo il rilascio verificare:

* [ ] frontend disponibile;
* [ ] backend disponibile;
* [ ] database disponibile;
* [ ] migrazioni completate;
* [ ] login funzionante;
* [ ] nessun errore ripetuto nei log;
* [ ] scheduler notifiche attivo;
* [ ] scheduler ricorrenze attivo;
* [ ] nessun duplicato;
* [ ] backup schedulato;
* [ ] versione corretta;
* [ ] healthcheck stabile;
* [ ] utilizzo base da mobile.

---

# Test backend richiesti

Garantire test almeno per:

## Sicurezza

* ownership;
* token scaduto;
* refresh concorrente;
* campi non previsti;
* rate limit;
* CSV injection;
* errori sanitizzati.

## Database

* migrazioni;
* vincoli;
* soft delete;
* Decimal;
* date;
* idempotenza.

## Scheduler

* notifiche;
* ricorrenze;
* riavvio;
* esecuzione multipla;
* errore parziale;
* limite batch.

## Health

* liveness;
* readiness;
* database non disponibile.

## Backup

Verificare almeno tramite procedura development che il dump sia ripristinabile.

---

# Test frontend richiesti

Garantire test almeno per:

* auth interceptor;
* sessione scaduta;
* error handling;
* toast;
* loading;
* empty state;
* filtri;
* responsive logic rilevante;
* accessibilità componenti condivisi;
* grafici;
* calendario;
* notifiche;
* ricorrenze;
* query parameter;
* download CSV.

Non duplicare test privi di valore.

---

# Verifica manuale completa

Eseguire almeno questo percorso:

1. registrare un nuovo utente;
2. effettuare login;
3. creare una categoria;
4. creare un’etichetta;
5. creare una spesa completata;
6. creare una spesa pianificata;
7. aggiungere un promemoria;
8. verificare la dashboard;
9. verificare il report mensile;
10. confrontare due mesi;
11. verificare il calendario;
12. modificare la data;
13. segnare completata la spesa;
14. creare una ricorrenza;
15. verificare l’anteprima;
16. generare un’occorrenza;
17. verificare la notifica;
18. esportare CSV;
19. verificare la pagina da mobile;
20. effettuare logout;
21. accedere con un secondo utente;
22. verificare l’isolamento;
23. riavviare i container;
24. verificare persistenza dati;
25. verificare healthcheck;
26. effettuare backup;
27. testare restore in ambiente controllato.

---

# Verifica finale obbligatoria

Al termine eseguire realmente:

1. `git diff --check`;
2. `npm ci` da ambiente pulito, quando possibile;
3. `prisma format`;
4. `prisma validate`;
5. `prisma generate`;
6. migrazioni su database vuoto;
7. migrazioni su database esistente di test;
8. seed development;
9. test backend;
10. test frontend;
11. test integrazione;
12. test end-to-end;
13. lint;
14. type checking;
15. build backend;
16. build frontend;
17. build Docker backend;
18. build Docker frontend;
19. avvio Docker production-like;
20. healthcheck;
21. smoke test;
22. backup;
23. restore;
24. audit dipendenze;
25. verifica Swagger;
26. verifica responsive;
27. verifica accessibilità;
28. verifica scheduler;
29. verifica idempotenza;
30. verifica che non siano presenti segreti.

Correggere tutti gli errori bloccanti e gravi.

Per eventuali problemi non risolvibili senza cambiare ambito:

* descrivere il problema;
* indicare impatto;
* indicare workaround;
* non dichiarare la release pronta.

---

# Criteri di completamento

La Fase 10 è completa soltanto quando:

* il progetto si avvia in development;
* il progetto si avvia in production-like;
* test principali superano;
* build superano;
* migrazioni funzionano;
* backup e restore sono documentati e testati;
* CI è configurata;
* le funzionalità principali sono utilizzabili;
* non esistono vulnerabilità applicative note bloccanti;
* non esistono bug P0 o P1 noti;
* responsive e accessibilità sono verificati;
* la documentazione è aggiornata;
* esiste un changelog;
* esiste una versione;
* esiste una checklist release compilata con risultati reali.

---

# Vincoli

* Non implementare nuove funzionalità principali.
* Non cambiare stack.
* Non sostituire Angular, NestJS, Prisma o MariaDB.
* Non introdurre microservizi.
* Non introdurre Kubernetes.
* Non introdurre Redis o code esterne.
* Non introdurre servizi cloud obbligatori.
* Non usare `prisma db push` in production.
* Non usare `npm audit fix --force`.
* Non usare `--legacy-peer-deps`.
* Non usare `--force`.
* Non disabilitare TypeScript strict.
* Non usare `any` per aggirare errori.
* Non ignorare test falliti.
* Non alzare budget bundle senza analisi.
* Non eliminare dati reali.
* Non modificare migrazioni già applicate.
* Non inserire segreti nel repository.
* Non committare `.env`.
* Non dichiarare verifiche non eseguite.
* Non dichiarare production-ready un sistema con bug bloccanti.
* Non riscrivere componenti funzionanti senza necessità.
* Non lasciare TODO bloccanti.

---

# Output finale richiesto all’agente

Concludere con un rapporto strutturato contenente:

## Stato della release

Uno tra:

```text
READY
READY WITH LIMITATIONS
NOT READY
```

## Funzionalità verificate

Elencare i flussi realmente verificati.

## Problemi corretti

Elencare:

* problema;
* causa;
* soluzione;
* test di regressione.

## Problemi residui

Per ciascuno:

* priorità;
* impatto;
* workaround;
* motivazione della mancata correzione.

## Test

Riportare:

* comando;
* risultato;
* numero test;
* eventuali test saltati.

## Build

Riportare:

* backend;
* frontend;
* Docker;
* risultato.

## Database

Riportare:

* migrazioni;
* seed;
* backup;
* restore;
* risultato.

## Sicurezza

Riportare:

* autenticazione;
* ownership;
* CORS;
* cookie;
* rate limiting;
* audit;
* eventuali limitazioni.

## Performance

Riportare:

* query migliorate;
* indici aggiunti;
* bundle;
* limiti applicativi.

## Accessibilità e responsive

Riportare:

* pagine verificate;
* larghezze verificate;
* problemi corretti;
* problemi residui.

## CI/CD

Riportare:

* workflow creati;
* job;
* trigger;
* eventuale pubblicazione disabilitata.

## Documentazione

Elencare i documenti creati o aggiornati.

## Versione

Riportare:

```text
APP_VERSION
tag previsto
changelog
```

Non limitarsi a produrre il rapporto: implementare e verificare prima tutte le attività concretamente eseguibili.
