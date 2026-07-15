# AGENTS.md — Gestionale Nota Spese

## Obiettivo del progetto

Realizzare una web app gestionale per la registrazione, pianificazione e analisi delle spese personali.

L’applicazione deve avere un’interfaccia moderna ma chiaramente gestionale, con navigazione laterale, dashboard riepilogativa, grafici, tabelle, filtri, calendario e inserimento rapido delle spese.

L’interfaccia deve essere in italiano, utilizzare l’euro come valuta predefinita e il fuso orario `Europe/Rome`.

---

## Stack tecnologico

### Frontend

* Angular
* TypeScript con modalità strict
* Bootstrap 5
* Bootstrap Icons
* Chart.js tramite una libreria Angular compatibile
* Angular Reactive Forms
* Angular Router
* HttpClient
* SCSS

### Backend

* NestJS
* TypeScript
* REST API
* Prisma ORM
* MariaDB
* Validazione DTO tramite `class-validator`
* Documentazione API tramite Swagger
* Autenticazione JWT

### Infrastruttura

* Docker
* Docker Compose
* Container separati per:

  * frontend
  * backend
  * MariaDB
* File `.env.example`
* Migrazioni Prisma
* Seed iniziale delle categorie predefinite

---

## Organizzazione del progetto

Usare preferibilmente una struttura monorepo:

```text
expense-manager/
├── apps/
│   ├── frontend/
│   └── backend/
├── docker-compose.yml
├── AGENTS.md
├── README.md
└── .env.example
```

Il frontend e il backend devono restare separati dal punto di vista logico.

Non inserire logica di business direttamente nei componenti Angular o nei controller NestJS.

---

## Requisiti generali dell’interfaccia

L’applicazione deve avere un layout gestionale responsive composto da:

* sidebar verticale fissa a sinistra su desktop;
* sidebar richiudibile;
* menu offcanvas su dispositivi mobili;
* area principale con header della pagina;
* breadcrumb;
* pulsante sempre visibile per inserire rapidamente una spesa;
* card Bootstrap;
* tabelle responsive;
* modali per le operazioni rapide;
* toast per conferme ed errori;
* skeleton o spinner durante i caricamenti;
* empty state quando non sono presenti dati.

La sidebar deve contenere almeno:

1. Dashboard
2. Spese
3. Calendario
4. Confronto mensile
5. Etichette
6. Impostazioni

Evidenziare sempre la voce della sezione attiva.

L’aspetto deve essere professionale e pulito. Evitare uno stile eccessivamente simile a una landing page o a un’app mobile.

---

## Autenticazione

Implementare:

* registrazione;
* login;
* logout;
* refresh token;
* recupero password predisposto;
* protezione delle rotte frontend;
* protezione degli endpoint backend;
* isolamento completo dei dati tra utenti.

Ogni spesa, etichetta, preferenza e avviso deve appartenere a uno specifico utente.

Non permettere mai a un utente di accedere ai dati di un altro utente.

---

# Funzionalità principali

## 1. Dashboard

La dashboard deve mostrare immediatamente la situazione economica dell’utente.

### Riepiloghi principali

Mostrare tramite card:

* totale speso nel mese corrente;
* variazione rispetto al mese precedente;
* numero di spese registrate nel mese;
* categoria con la spesa più alta;
* totale delle spese future previste;
* prossima spesa programmata;
* media giornaliera del mese.

### Grafici Chart.js

Inserire almeno:

#### Grafico andamento mensile

Grafico a linea o barre con il totale delle spese per giorno nel mese selezionato.

#### Grafico per categoria

Grafico doughnut con la distribuzione delle spese per categoria o etichetta.

#### Confronto con il mese precedente

Grafico a barre con confronto tra:

* mese corrente;
* mese precedente.

#### Andamento degli ultimi mesi

Grafico a linea con il totale mensile degli ultimi 6 o 12 mesi.

I grafici devono:

* essere responsive;
* avere tooltip chiari;
* mostrare valori formattati in euro;
* gestire correttamente l’assenza di dati;
* aggiornarsi quando cambiano i filtri.

### Ultimi inserimenti

Mostrare una tabella con le ultime spese registrate contenente:

* data;
* descrizione;
* importo;
* categoria;
* etichette;
* stato;
* azioni rapide.

Le azioni rapide devono permettere:

* apertura dettaglio;
* modifica;
* duplicazione;
* eliminazione con conferma.

---

## 2. Inserimento rapido delle spese

Deve essere possibile registrare una spesa da qualsiasi sezione tramite un pulsante evidente, per esempio:

```text
+ Nuova spesa
```

L’inserimento rapido può essere realizzato con una modale Bootstrap o un pannello laterale.

### Campi della spesa

* importo;
* descrizione;
* data della spesa;
* ora opzionale;
* categoria principale;
* una o più etichette;
* metodo di pagamento;
* esercente o beneficiario opzionale;
* note opzionali;
* stato;
* ricorrenza opzionale;
* data promemoria opzionale.

### Stati della spesa

Utilizzare almeno:

* `COMPLETED`: spesa già sostenuta;
* `PLANNED`: spesa futura prevista;
* `CANCELLED`: spesa annullata.

Se la data selezionata è futura, proporre automaticamente lo stato `PLANNED`, lasciando comunque all’utente la possibilità di modificarlo.

### Validazioni

* importo maggiore di zero;
* descrizione obbligatoria;
* data obbligatoria;
* categoria obbligatoria;
* nessun valore monetario gestito tramite floating point;
* mostrare gli errori sotto i relativi campi.

Gli importi devono essere memorizzati come `DECIMAL`, mai come `FLOAT` o `DOUBLE`.

---

## 3. Gestione delle spese

La pagina Spese deve avere una visualizzazione gestionale tramite tabella.

### Colonne principali

* data;
* descrizione;
* importo;
* categoria;
* etichette;
* metodo di pagamento;
* stato;
* data di creazione;
* azioni.

### Filtri

Implementare:

* ricerca testuale;
* intervallo di date;
* mese;
* anno;
* categoria;
* etichette;
* stato;
* metodo di pagamento;
* importo minimo;
* importo massimo.

### Ordinamento

Consentire l’ordinamento almeno per:

* data;
* importo;
* descrizione;
* data di inserimento.

### Paginazione

La paginazione deve essere gestita dal backend.

Non caricare tutte le spese dell’utente nel browser per applicare filtri o paginazione.

### Operazioni

Consentire:

* creazione;
* modifica;
* eliminazione;
* duplicazione;
* cambio di stato;
* esportazione CSV;
* apertura del dettaglio.

Prima dell’eliminazione mostrare una modale di conferma.

---

## 4. Categorie ed etichette

L’applicazione deve avere un set iniziale di categorie classiche, creato tramite seed.

### Categorie predefinite

Creare almeno:

* Casa
* Affitto
* Bollette
* Spesa alimentare
* Ristoranti
* Trasporti
* Carburante
* Auto
* Salute
* Farmacia
* Shopping
* Intrattenimento
* Viaggi
* Abbonamenti
* Istruzione
* Regali
* Tasse
* Lavoro
* Altro

Ogni categoria deve avere:

* nome;
* icona;
* colore;
* ordinamento;
* stato attivo o disattivato;
* indicazione se è predefinita.

### Etichette personalizzate

L’utente deve poter creare etichette personalizzate partendo dal set predefinito oppure da zero.

Ogni etichetta deve avere:

* nome;
* colore;
* icona opzionale;
* descrizione opzionale;
* categoria di riferimento opzionale;
* stato attivo;
* indicazione se è predefinita o personalizzata.

Esempi:

* Pranzo di lavoro
* Spese condivise
* Vacanza 2026
* Casa nuova
* Rimborso previsto
* Spesa straordinaria

Una spesa può avere:

* una categoria principale;
* più etichette secondarie.

Consentire di:

* creare;
* modificare;
* disattivare;
* eliminare;
* riordinare;
* filtrare le spese associate.

Le categorie predefinite non devono essere eliminate fisicamente. Possono essere disattivate.

Se un’etichetta è già associata a delle spese, l’eliminazione deve essere impedita oppure gestita tramite soft delete.

---

## 5. Consultazione mensile

Creare una pagina dedicata alla consultazione delle spese mensili.

### Selezione periodo

Consentire la scelta di:

* mese;
* anno.

### Contenuti

Mostrare:

* totale del mese;
* numero di spese;
* media giornaliera;
* giorno con la spesa maggiore;
* categoria principale;
* dettaglio per categoria;
* andamento giornaliero;
* elenco completo delle spese.

Consentire il passaggio rapido tra:

* mese precedente;
* mese successivo;
* mese corrente.

---

## 6. Confronto tra mesi

Creare una sezione specifica per confrontare due o più mesi.

L’utente deve poter selezionare almeno:

* mese A;
* mese B.

Prevedere successivamente la possibilità di selezionare fino a 6 mesi.

### Dati da confrontare

* totale speso;
* numero di spese;
* media giornaliera;
* differenza assoluta;
* differenza percentuale;
* totale per categoria;
* spese pianificate;
* spese completate.

### Visualizzazioni

Utilizzare Chart.js per mostrare:

* confronto dei totali;
* confronto per categoria;
* andamento giornaliero sovrapposto;
* variazione percentuale tra i periodi.

Mostrare anche una tabella riepilogativa.

Evidenziare chiaramente aumenti e diminuzioni, senza affidarsi esclusivamente ai colori.

Esempio:

```text
Marzo 2026: 1.240,00 €
Aprile 2026: 1.080,00 €
Differenza: -160,00 € (-12,9%)
```

---

## 7. Spese future e calendario

Le spese future devono essere visualizzabili in una pagina Calendario.

Utilizzare una vista calendario mensile, con possibilità di passare anche a:

* settimana;
* agenda;
* elenco.

Ogni evento del calendario deve mostrare:

* descrizione;
* importo;
* categoria;
* stato;
* eventuale ricorrenza.

### Interazioni calendario

Consentire:

* apertura del dettaglio cliccando sulla spesa;
* modifica;
* cambio di stato da pianificata a completata;
* eliminazione;
* creazione di una spesa cliccando su un giorno;
* trascinamento della spesa a un’altra data, se supportato dalla libreria scelta.

Per il calendario è possibile utilizzare una libreria Angular compatibile, come FullCalendar, mantenendo Bootstrap per il resto dell’interfaccia.

---

## 8. Avvisi e scadenze

Le spese future possono avere un avviso.

### Opzioni promemoria

Prevedere almeno:

* il giorno stesso;
* 1 giorno prima;
* 3 giorni prima;
* 7 giorni prima;
* data e ora personalizzate.

### Avvisi nell’app

Mostrare:

* badge nella sidebar;
* campanella nell’header;
* elenco delle prossime spese;
* toast per le scadenze imminenti;
* sezione “In scadenza” nella dashboard.

Classificare le spese future come:

* oggi;
* domani;
* entro 3 giorni;
* entro 7 giorni;
* successive.

Non creare notifiche duplicate per la stessa spesa e lo stesso promemoria.

Predisporre il backend per l’invio futuro di notifiche email, anche se inizialmente sono richieste soltanto notifiche interne all’app.

Utilizzare un task schedulato NestJS per individuare gli avvisi da generare.

---

## 9. Spese ricorrenti

Prevedere spese ricorrenti, particolarmente utili per:

* affitto;
* bollette;
* abbonamenti;
* rate;
* assicurazioni;
* servizi online.

### Frequenze

* giornaliera;
* settimanale;
* mensile;
* annuale;
* personalizzata.

Ogni ricorrenza deve avere:

* data di inizio;
* data di fine opzionale;
* frequenza;
* intervallo;
* prossima esecuzione;
* stato attivo;
* generazione automatica delle occorrenze future.

Evitare la creazione duplicata delle occorrenze.

Le spese generate da una ricorrenza devono mantenere un riferimento alla regola di origine.

---

# Modello dati suggerito

## User

```text
id
email
passwordHash
firstName
lastName
currency
timezone
createdAt
updatedAt
```

## Expense

```text
id
userId
categoryId
description
amount
expenseDate
expenseTime
merchant
paymentMethod
notes
status
reminderAt
recurrenceRuleId
createdAt
updatedAt
deletedAt
```

## Category

```text
id
userId nullable
name
slug
icon
color
sortOrder
isDefault
isActive
createdAt
updatedAt
```

Le categorie con `userId = null` rappresentano le categorie globali predefinite.

## Label

```text
id
userId
categoryId nullable
name
slug
icon nullable
color
description nullable
isDefault
isActive
createdAt
updatedAt
deletedAt
```

## ExpenseLabel

```text
expenseId
labelId
```

Utilizzare una chiave primaria composta da `expenseId` e `labelId`.

## RecurrenceRule

```text
id
userId
frequency
interval
startDate
endDate nullable
nextRunAt
isActive
createdAt
updatedAt
```

## Notification

```text
id
userId
expenseId
type
title
message
scheduledAt
readAt nullable
createdAt
```

## RefreshToken

```text
id
userId
tokenHash
expiresAt
revokedAt nullable
createdAt
```

---

# API REST

Utilizzare il prefisso:

```text
/api/v1
```

## Autenticazione

```text
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me
```

## Spese

```text
GET    /expenses
POST   /expenses
GET    /expenses/:id
PATCH  /expenses/:id
DELETE /expenses/:id
POST   /expenses/:id/duplicate
PATCH  /expenses/:id/status
GET    /expenses/export
```

La lista deve supportare query parameter per:

```text
page
pageSize
search
dateFrom
dateTo
month
year
categoryId
labelIds
status
paymentMethod
minAmount
maxAmount
sortBy
sortDirection
```

## Dashboard

```text
GET /dashboard/summary
GET /dashboard/recent-expenses
GET /dashboard/daily-trend
GET /dashboard/category-distribution
GET /dashboard/monthly-trend
GET /dashboard/upcoming-expenses
```

## Statistiche mensili

```text
GET /reports/monthly
GET /reports/month-comparison
GET /reports/category-comparison
```

## Categorie

```text
GET    /categories
POST   /categories
PATCH  /categories/:id
DELETE /categories/:id
PATCH  /categories/:id/status
```

## Etichette

```text
GET    /labels
POST   /labels
PATCH  /labels/:id
DELETE /labels/:id
PATCH  /labels/:id/status
```

## Calendario

```text
GET /calendar/expenses
```

Accettare almeno:

```text
start
end
status
categoryId
```

## Ricorrenze

```text
GET    /recurrences
POST   /recurrences
PATCH  /recurrences/:id
DELETE /recurrences/:id
PATCH  /recurrences/:id/status
```

## Notifiche

```text
GET    /notifications
GET    /notifications/unread-count
PATCH  /notifications/:id/read
PATCH  /notifications/read-all
```

---

# Architettura backend NestJS

Creare moduli separati:

```text
AuthModule
UsersModule
ExpensesModule
CategoriesModule
LabelsModule
DashboardModule
ReportsModule
CalendarModule
RecurrencesModule
NotificationsModule
PrismaModule
```

Ogni modulo deve avere:

* controller;
* service;
* DTO;
* mapper, se necessario;
* test unitari essenziali.

I controller devono limitarsi a:

* ricevere la richiesta;
* validare i parametri;
* richiamare il service;
* restituire la risposta.

La business logic deve risiedere nei service.

Creare una gestione centralizzata degli errori tramite exception filter.

Utilizzare un interceptor per standardizzare le risposte API.

Esempio:

```json
{
  "data": {},
  "meta": {},
  "message": "Operazione completata"
}
```

Per gli errori:

```json
{
  "statusCode": 400,
  "message": "Dati non validi",
  "errors": {
    "amount": ["L'importo deve essere maggiore di zero"]
  }
}
```

---

# Architettura frontend Angular

Organizzare il frontend per feature:

```text
src/app/
├── core/
│   ├── auth/
│   ├── guards/
│   ├── interceptors/
│   ├── layout/
│   └── services/
├── shared/
│   ├── components/
│   ├── directives/
│   ├── pipes/
│   ├── models/
│   └── utilities/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── expenses/
│   ├── calendar/
│   ├── reports/
│   ├── labels/
│   ├── notifications/
│   └── settings/
└── app.routes.ts
```

Utilizzare componenti standalone.

Utilizzare lazy loading per le sezioni principali.

Non effettuare chiamate HTTP direttamente dai componenti.

Creare servizi dedicati, per esempio:

```text
ExpenseService
DashboardService
ReportService
CategoryService
LabelService
NotificationService
AuthService
```

Separare:

* modelli API;
* modelli usati dalla UI;
* form model;
* parametri dei filtri.

---

# Componenti frontend principali

Creare almeno:

```text
AppLayoutComponent
SidebarComponent
TopbarComponent
PageHeaderComponent
StatCardComponent
ChartCardComponent
ExpenseTableComponent
ExpenseFormComponent
QuickExpenseModalComponent
ExpenseFiltersComponent
ExpenseDetailComponent
CategoryBadgeComponent
LabelBadgeComponent
MonthSelectorComponent
MonthComparisonComponent
UpcomingExpensesComponent
NotificationDropdownComponent
ConfirmDialogComponent
EmptyStateComponent
LoadingSkeletonComponent
```

---

# Gestione dello stato

Non introdurre NgRx nella prima versione, a meno che non diventi realmente necessario.

Utilizzare:

* servizi Angular;
* Signals;
* computed state;
* RxJS per le chiamate asincrone;
* caching semplice per categorie ed etichette.

Evitare subscribe annidati.

Utilizzare `takeUntilDestroyed` o alternative equivalenti per evitare memory leak.

---

# Date e importi

Le date devono essere trasmesse in formato ISO 8601.

Non applicare conversioni implicite che possano cambiare il giorno a causa del fuso orario.

Le date delle spese devono essere trattate principalmente come date locali, mentre i timestamp tecnici devono essere memorizzati in UTC.

Formattare gli importi tramite locale italiano:

```text
it-IT
```

Esempio:

```text
1.250,50 €
```

Non eseguire calcoli finanziari usando numeri JavaScript non controllati.

Il backend deve essere la fonte autorevole per:

* totali;
* medie;
* percentuali;
* aggregazioni;
* confronti tra periodi.

---

# Sicurezza

Implementare:

* password hash con Argon2 o bcrypt;
* JWT access token con durata breve;
* refresh token revocabili;
* rate limiting sugli endpoint di autenticazione;
* validazione globale dei DTO;
* sanitizzazione degli input;
* CORS configurato tramite variabili d’ambiente;
* Helmet;
* controllo di ownership in ogni operazione;
* nessuna password o token nei log;
* nessun segreto inserito nel repository.

---

# Accessibilità

Garantire:

* label associate ai campi;
* navigazione da tastiera;
* focus visibile;
* testo alternativo per le icone;
* contrasto sufficiente;
* aria-label per pulsanti composti soltanto da icone;
* grafici accompagnati da riepiloghi testuali;
* errori dei form comprensibili;
* nessuna informazione affidata soltanto al colore.

---

# Responsive design

### Desktop

* sidebar fissa;
* dashboard con griglia di card;
* tabelle complete;
* grafici affiancati quando possibile.

### Tablet

* sidebar comprimibile;
* card su due colonne;
* tabelle con scroll orizzontale.

### Mobile

* sidebar offcanvas;
* card su singola colonna;
* filtri collassabili;
* tabella sostituibile con card compatte;
* pulsante nuova spesa facilmente raggiungibile.

---

# Seed iniziale

Il seed deve creare:

* categorie predefinite;
* icone Bootstrap associate;
* colori predefiniti;
* un utente demo soltanto in ambiente development;
* spese demo distribuite su almeno tre mesi;
* alcune spese future;
* una spesa ricorrente;
* alcune notifiche demo.

Non creare dati demo in produzione.

---

# Docker Compose

Il progetto deve poter essere avviato tramite:

```bash
docker compose up --build
```

Prevedere servizi:

```text
frontend
backend
mariadb
```

MariaDB deve utilizzare un volume persistente.

Il backend deve attendere la disponibilità del database prima di eseguire le migrazioni.

Inserire healthcheck per MariaDB e backend.

---

# Variabili d’ambiente

Creare `.env.example` con almeno:

```env
NODE_ENV=development

FRONTEND_PORT=4200
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

CORS_ORIGIN=http://localhost:4200
DEFAULT_CURRENCY=EUR
DEFAULT_TIMEZONE=Europe/Rome
```

---

# Testing

## Backend

Scrivere test almeno per:

* creazione spesa;
* validazione importo;
* accesso negato a spese di altri utenti;
* filtri mensili;
* confronto tra mesi;
* generazione ricorrenze;
* creazione notifiche;
* prevenzione duplicati.

## Frontend

Scrivere test almeno per:

* validazione del form spesa;
* apertura della modale rapida;
* applicazione filtri;
* formattazione importi;
* visualizzazione degli stati;
* aggiornamento dei grafici;
* gestione empty state.

---

# Ordine di implementazione

Procedere per fasi funzionanti.

## Fase 1 — Setup

* monorepo;
* Angular;
* NestJS;
* MariaDB;
* Prisma;
* Docker Compose;
* configurazione ambienti.

## Fase 2 — Autenticazione

* registrazione;
* login;
* refresh token;
* guard frontend e backend.

## Fase 3 — Categorie ed etichette

* seed categorie;
* CRUD etichette;
* schermata di gestione.

## Fase 4 — Spese

* modello dati;
* CRUD;
* filtri;
* paginazione;
* inserimento rapido;
* tabella gestionale.

## Fase 5 — Dashboard

* KPI;
* ultimi inserimenti;
* grafici Chart.js;
* prossime spese.

## Fase 6 — Consultazione e confronto

* vista mensile;
* confronto tra mesi;
* aggregazioni backend;
* grafici comparativi.

## Fase 7 — Calendario

* vista mensile;
* spese future;
* creazione e modifica dal calendario.

## Fase 8 — Avvisi e ricorrenze

* promemoria;
* notifiche interne;
* scheduler NestJS;
* spese ricorrenti.

## Fase 9 — Rifinitura

* responsive;
* accessibilità;
* test;
* Swagger;
* esportazione CSV;
* README.

Ogni fase deve terminare con una versione avviabile e utilizzabile.

---

# Regole operative per l’agente

1. Prima di modificare il codice, analizzare la struttura esistente.
2. Non riscrivere parti funzionanti senza necessità.
3. Non installare librerie ridondanti.
4. Preferire librerie attivamente mantenute e compatibili con la versione del framework.
5. Non lasciare placeholder non funzionanti.
6. Non simulare chiamate API quando il backend relativo è già disponibile.
7. Non inserire dati statici nei componenti finali.
8. Mantenere frontend, API e schema database coerenti.
9. Quando cambia il modello Prisma, creare una migrazione.
10. Aggiornare `.env.example` quando vengono introdotte nuove variabili.
11. Aggiornare Swagger quando cambia un endpoint.
12. Gestire sempre loading, errore e assenza di dati.
13. Non ignorare errori TypeScript, ESLint o build.
14. Non usare `any`, salvo casi eccezionali e documentati.
15. Non effettuare calcoli aggregati importanti esclusivamente nel frontend.
16. Non eliminare dati finanziari senza conferma esplicita.
17. Usare soft delete per spese ed etichette quando opportuno.
18. Dopo ogni fase eseguire build e test.
19. Documentare nel README i comandi necessari.
20. Prima di concludere un’attività, verificare manualmente il flusso principale coinvolto.

---

# Criteri di completamento della prima versione

La prima versione è considerata completa quando l’utente può:

* registrarsi ed effettuare il login;
* creare una spesa in pochi secondi;
* modificare ed eliminare una spesa;
* creare etichette personalizzate;
* usare categorie predefinite;
* consultare le spese di un mese;
* filtrare e ordinare le spese;
* confrontare almeno due mesi;
* visualizzare grafici Chart.js;
* visualizzare le spese future nel calendario;
* ricevere avvisi interni per le spese imminenti;
* contrassegnare una spesa futura come completata;
* consultare una dashboard con KPI e ultimi inserimenti;
* utilizzare l’app da desktop e mobile;
* avviare tutto il progetto tramite Docker Compose.

---

# Prima attività richiesta all’agente

Analizza questo documento e genera inizialmente:

1. struttura completa del repository;
2. schema Prisma;
3. `docker-compose.yml`;
4. `.env.example`;
5. moduli NestJS;
6. routing Angular;
7. layout gestionale con sidebar;
8. seed delle categorie;
9. una roadmap tecnica sintetica.

Successivamente implementa la Fase 1 e la Fase 2, senza anticipare funzionalità incomplete delle fasi successive.
