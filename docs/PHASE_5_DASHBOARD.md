# PHASE_5_DASHBOARD.md

## Obiettivo

Implementare la **Fase 5 — Dashboard e analisi riepilogativa** dell’applicazione descritta in `AGENTS.md`.

Al termine della fase, l’utente autenticato deve visualizzare una dashboard gestionale completa con:

* indicatori principali del mese;
* confronto con il mese precedente;
* andamento giornaliero delle spese;
* distribuzione delle spese per categoria;
* andamento degli ultimi mesi;
* ultimi inserimenti;
* prossime spese pianificate;
* filtri temporali essenziali;
* grafici realizzati tramite Chart.js;
* dati aggregati calcolati dal backend.

La dashboard deve essere utile anche con pochi dati, senza errori o grafici vuoti poco comprensibili.

Implementare direttamente il codice nel repository.

Non limitarsi a descrivere la soluzione.

---

# Operazioni preliminari

Prima di modificare il codice:

1. leggere integralmente `AGENTS.md`;
2. leggere integralmente `docs/PHASE_5_DASHBOARD.md`;
3. analizzare lo stato reale del repository;
4. eseguire `git status` e `git diff`;
5. verificare che autenticazione, categorie, etichette e spese siano funzionanti;
6. verificare migrazioni, seed, test e build delle fasi precedenti;
7. controllare le convenzioni già adottate per API, mapper, errori e componenti;
8. riutilizzare i componenti esistenti;
9. correggere soltanto eventuali problemi bloccanti;
10. evitare refactoring non necessari.

Non ricominciare da zero.

---

# Ambito della fase

Implementare:

* modulo backend `DashboardModule`;
* endpoint aggregati dedicati;
* selezione del periodo della dashboard;
* riepilogo mensile;
* confronto con il periodo precedente;
* andamento giornaliero;
* distribuzione per categoria;
* andamento degli ultimi mesi;
* ultimi inserimenti;
* prossime spese pianificate;
* Chart.js nel frontend;
* card statistiche;
* componenti grafici riutilizzabili;
* loading state;
* empty state;
* error state;
* aggiornamento del seed development;
* test backend;
* test frontend;
* Swagger;
* aggiornamento README.

Non implementare ancora:

* confronto interattivo avanzato tra più mesi;
* report mensili completi;
* calendario;
* notifiche automatiche;
* ricorrenze;
* budget;
* previsioni finanziarie;
* esportazione PDF;
* aggregazioni per più valute.

La dashboard può mostrare spese future già presenti, ma non deve implementare promemoria o notifiche.

---

# Principi architetturali

Le aggregazioni devono essere calcolate dal backend.

Non caricare tutte le spese nel frontend per:

* calcolare totali;
* raggruppare per categoria;
* confrontare mesi;
* generare serie temporali;
* determinare le prossime spese.

Il frontend deve ricevere dati già aggregati e pronti per la visualizzazione.

Il backend deve essere la fonte autorevole per:

* totali;
* medie;
* percentuali;
* differenze;
* ordinamento;
* intervalli temporali;
* aggregazioni per giorno, mese e categoria.

---

# Periodo della dashboard

La dashboard deve mostrare per impostazione predefinita il mese corrente.

Consentire la selezione di:

* mese;
* anno.

Consentire inoltre:

* mese precedente;
* mese successivo;
* ritorno al mese corrente.

Esempio query:

```text
/dashboard?month=7&year=2026
```

Il periodo selezionato deve essere rappresentato nei query parameter della route Angular.

Ricaricando la pagina, il periodo deve restare selezionato.

Il pulsante indietro del browser deve funzionare.

---

# Regole temporali

Per un mese selezionato, il backend deve determinare:

* primo giorno del mese;
* ultimo giorno del mese;
* mese precedente;
* stesso numero di giorni comparabile, dove necessario;
* numero di giorni trascorsi, se il mese è quello corrente;
* numero totale di giorni del mese.

Usare il fuso orario applicativo:

```text
Europe/Rome
```

Le date delle spese devono restare date locali.

I timestamp tecnici possono restare in UTC.

Evitare errori dovuti a:

* cambio del giorno;
* ora legale;
* conversioni implicite;
* intervalli inclusivi o esclusivi incoerenti.

Centralizzare il calcolo degli intervalli.

---

# Spese incluse nei calcoli

Definire chiaramente quali stati sono inclusi.

## Spese effettive

Per:

* totale speso;
* media giornaliera;
* distribuzione per categoria;
* andamento giornaliero;
* andamento mensile storico;

includere soltanto:

```text
COMPLETED
```

Escludere:

```text
PLANNED
CANCELLED
```

## Spese future

Per:

* totale previsto;
* prossima spesa;
* elenco delle prossime spese;

includere soltanto:

```text
PLANNED
```

Escludere sempre:

* spese soft deleted;
* spese di altri utenti;
* spese `CANCELLED`, salvo metriche specifiche esplicitamente previste.

Documentare queste regole nel backend e in Swagger.

---

# Indicatori principali

La dashboard deve mostrare almeno le seguenti card.

## Totale speso

Totale delle spese `COMPLETED` nel mese selezionato.

Esempio:

```text
Totale speso
1.284,50 €
```

## Variazione rispetto al mese precedente

Mostrare:

* differenza assoluta;
* differenza percentuale;
* indicazione aumento o diminuzione.

Esempio:

```text
+124,50 €
+10,7% rispetto a giugno
```

oppure:

```text
-85,00 €
-6,2% rispetto a giugno
```

Gestire correttamente il caso in cui il mese precedente abbia totale zero.

In questo caso non mostrare valori percentuali come `Infinity`.

Usare una rappresentazione comprensibile, per esempio:

```text
Nessuna spesa nel mese precedente
```

## Numero di spese

Numero delle spese `COMPLETED` nel periodo.

## Media giornaliera

Per un mese passato:

```text
totale del mese / numero di giorni del mese
```

Per il mese corrente:

```text
totale corrente / numero di giorni trascorsi
```

Evitare divisioni per zero.

Documentare la regola.

## Categoria principale

Categoria con il totale maggiore nel periodo.

Mostrare:

* nome;
* icona;
* colore;
* totale;
* percentuale sul totale del mese.

Gestire il caso senza spese.

## Totale delle spese future

Totale delle spese `PLANNED` con data uguale o successiva alla data corrente.

La card deve essere distinta dal totale effettivamente speso.

## Prossima spesa pianificata

Mostrare:

* descrizione;
* importo;
* data;
* categoria;
* distanza temporale.

Esempi:

```text
Oggi
Domani
Tra 3 giorni
20 luglio 2026
```

Non implementare ancora notifiche.

---

# Endpoint backend

Utilizzare il prefisso:

```text
/api/v1/dashboard
```

Tutti gli endpoint devono essere autenticati.

È possibile scegliere tra:

* più endpoint specializzati;
* un endpoint composito più alcuni endpoint specifici.

Preferire endpoint separati se migliorano caching, testabilità e leggibilità.

Implementare almeno:

```http
GET /api/v1/dashboard/summary
GET /api/v1/dashboard/daily-trend
GET /api/v1/dashboard/category-distribution
GET /api/v1/dashboard/monthly-trend
GET /api/v1/dashboard/recent-expenses
GET /api/v1/dashboard/upcoming-expenses
```

Query comuni:

```text
month
year
```

---

# Endpoint summary

```http
GET /api/v1/dashboard/summary?month=7&year=2026
```

La risposta deve contenere almeno:

```json
{
  "period": {
    "month": 7,
    "year": 2026,
    "label": "Luglio 2026",
    "isCurrentMonth": true
  },
  "totalSpent": "1284.50",
  "previousPeriodTotal": "1160.00",
  "absoluteChange": "124.50",
  "percentageChange": 10.73,
  "expenseCount": 32,
  "dailyAverage": "91.75",
  "topCategory": {
    "id": "uuid",
    "name": "Spesa alimentare",
    "color": "#16A34A",
    "icon": "bi-basket",
    "total": "350.00",
    "percentage": 27.25
  },
  "plannedTotal": "490.00",
  "nextPlannedExpense": {
    "id": "uuid",
    "description": "Assicurazione auto",
    "amount": "320.00",
    "expenseDate": "2026-07-20",
    "daysUntilDue": 6,
    "category": {
      "id": "uuid",
      "name": "Auto",
      "color": "#2563EB",
      "icon": "bi-car-front"
    }
  }
}
```

Adattare la risposta al formato standard già utilizzato dal progetto.

Non restituire oggetti Prisma direttamente.

---

# Confronto con il mese precedente

Il confronto deve usare:

* mese selezionato;
* mese immediatamente precedente.

Esempi:

```text
Luglio 2026 → Giugno 2026
Gennaio 2026 → Dicembre 2025
```

Regole:

```text
absoluteChange = selectedTotal - previousTotal
```

La percentuale:

```text
percentageChange = absoluteChange / previousTotal * 100
```

Casi particolari:

* entrambi zero: variazione `0`;
* precedente zero e corrente maggiore di zero: percentuale non calcolabile;
* corrente zero e precedente maggiore di zero: `-100%`.

La risposta API deve permettere al frontend di distinguere:

* aumento;
* diminuzione;
* invariato;
* percentuale non disponibile.

Non affidarsi esclusivamente al segno del testo formattato.

---

# Endpoint andamento giornaliero

```http
GET /api/v1/dashboard/daily-trend?month=7&year=2026
```

Restituire una voce per ogni giorno del mese, anche quando il totale è zero.

Esempio:

```json
{
  "data": [
    {
      "date": "2026-07-01",
      "day": 1,
      "total": "35.40",
      "expenseCount": 2
    },
    {
      "date": "2026-07-02",
      "day": 2,
      "total": "0.00",
      "expenseCount": 0
    }
  ]
}
```

Questo endpoint alimenta un grafico:

* lineare;
* oppure a barre.

Il grafico deve permettere di comprendere:

* picchi giornalieri;
* giorni senza spese;
* andamento progressivo.

È possibile aggiungere opzionalmente il totale cumulativo, purché non complichi inutilmente la fase.

---

# Endpoint distribuzione per categoria

```http
GET /api/v1/dashboard/category-distribution?month=7&year=2026
```

Restituire:

* categoria;
* totale;
* numero di spese;
* percentuale sul totale.

Esempio:

```json
{
  "data": [
    {
      "categoryId": "uuid",
      "name": "Spesa alimentare",
      "color": "#16A34A",
      "icon": "bi-basket",
      "total": "350.00",
      "expenseCount": 8,
      "percentage": 27.25
    }
  ]
}
```

Ordinare dal totale maggiore al minore.

Le categorie senza spese non devono essere incluse.

Gestire correttamente categorie:

* predefinite;
* personalizzate;
* disattivate dopo l’inserimento delle spese;
* soft deleted, se le regole del progetto consentono ancora il riferimento storico.

La categoria storica deve restare rappresentabile.

---

# Endpoint andamento mensile

```http
GET /api/v1/dashboard/monthly-trend?months=6
```

Supportare almeno:

```text
months=6
months=12
```

Imporre un limite massimo ragionevole, per esempio 24 mesi.

Restituire una voce per ogni mese, anche quando il totale è zero.

Esempio:

```json
{
  "data": [
    {
      "month": 2,
      "year": 2026,
      "label": "Feb 2026",
      "total": "980.00",
      "expenseCount": 22
    },
    {
      "month": 3,
      "year": 2026,
      "label": "Mar 2026",
      "total": "0.00",
      "expenseCount": 0
    }
  ]
}
```

Il periodo deve terminare nel mese selezionato dalla dashboard, non necessariamente nel mese corrente.

Esempio:

```text
mese selezionato: luglio 2026
months=6: febbraio 2026 → luglio 2026
```

---

# Endpoint ultimi inserimenti

```http
GET /api/v1/dashboard/recent-expenses?limit=5
```

Il parametro `limit` deve avere:

* default `5`;
* massimo `20`.

Ordinare per:

```text
createdAt desc
```

Non confondere gli ultimi inserimenti con le spese aventi data più recente.

Restituire almeno:

* ID;
* descrizione;
* importo;
* data della spesa;
* data di creazione;
* categoria;
* etichette;
* stato;
* metodo di pagamento.

Escludere le spese eliminate.

Mostrare tutti gli stati oppure soltanto quelli previsti dal progetto, purché siano distinti chiaramente.

---

# Endpoint prossime spese

```http
GET /api/v1/dashboard/upcoming-expenses?limit=5
```

Mostrare spese:

* `PLANNED`;
* non eliminate;
* con data uguale o successiva a oggi.

Ordinamento:

```text
expenseDate asc
expenseTime asc
createdAt asc
```

Restituire:

* ID;
* descrizione;
* importo;
* data;
* ora;
* categoria;
* etichette;
* giorni mancanti;
* stato.

Il parametro `limit` deve avere:

* default `5`;
* massimo `20`.

Non generare notifiche in questa fase.

---

# Query DTO backend

Creare almeno:

```text
DashboardPeriodQueryDto
MonthlyTrendQueryDto
DashboardListQueryDto
```

Validazioni:

```text
month:
  intero
  minimo 1
  massimo 12

year:
  intero
  intervallo ragionevole

months:
  intero
  valori consentiti o intervallo 1-24

limit:
  intero
  minimo 1
  massimo 20
```

Se mese e anno non vengono passati, usare il mese corrente nel fuso `Europe/Rome`.

Se viene passato soltanto uno tra mese e anno:

* restituire `400`;
* oppure applicare una regola coerente e chiaramente documentata.

Preferire il rifiuto delle richieste ambigue.

---

# Backend NestJS

Creare:

```text
DashboardModule
```

Struttura indicativa:

```text
apps/backend/src/dashboard/
├── dto/
│   ├── dashboard-period-query.dto.ts
│   ├── dashboard-list-query.dto.ts
│   └── monthly-trend-query.dto.ts
├── dashboard.controller.ts
├── dashboard.service.ts
├── dashboard.mapper.ts
├── dashboard.types.ts
├── dashboard.utils.ts
├── dashboard.module.ts
└── dashboard.service.spec.ts
```

Responsabilità:

* controller: validazione e inoltro;
* service: query e aggregazioni;
* mapper: serializzazione;
* utility: intervalli temporali e calcoli puri;
* test: regole e query.

Non inserire business logic nel controller.

---

# Query e prestazioni

Usare query aggregate del database quando possibile.

Preferire:

* `SUM`;
* `COUNT`;
* `GROUP BY`;
* query filtrate;
* query parallele indipendenti tramite `Promise.all`, quando sicuro.

Non caricare tutte le spese in memoria per poi aggregarle.

Valutare query SQL parametrizzate tramite Prisma soltanto quando Prisma non permette un’aggregazione efficiente.

In caso di query raw:

* usare esclusivamente query parametrizzate;
* non interpolare input utente;
* mantenere compatibilità con MariaDB;
* aggiungere test.

Verificare gli indici esistenti, soprattutto su:

```text
userId
expenseDate
status
categoryId
deletedAt
createdAt
```

Aggiungere una migrazione soltanto se servono realmente nuovi indici.

Non creare indici ridondanti.

---

# Precisione degli importi

Usare `Decimal` per:

* somme;
* differenze;
* medie;
* totali per categoria.

Non convertire prematuramente a `number`.

Convertire a stringa soltanto nel mapper API.

Le percentuali possono essere restituite come `number`, con arrotondamento coerente, per esempio a due decimali.

Non effettuare calcoli finanziari tramite floating point non controllati.

---

# Swagger

Documentare:

* tutti gli endpoint;
* autenticazione Bearer;
* query parameter;
* valori predefiniti;
* risposte;
* formati delle date;
* formati degli importi;
* significato delle metriche;
* stati inclusi ed esclusi;
* casi senza dati;
* errori di validazione.

Documentare almeno:

```text
200
400
401
500
```

---

# Frontend Angular

Creare o completare la route:

```text
/dashboard
```

La route deve essere:

* protetta da auth guard;
* caricata tramite lazy loading, se coerente con l’architettura;
* collegata alla voce Dashboard della sidebar.

Sostituire l’eventuale dashboard placeholder della Fase 2.

---

# Struttura visiva

La dashboard deve mantenere un’impostazione gestionale.

Ordine consigliato:

1. header e selezione periodo;
2. card KPI;
3. andamento giornaliero;
4. distribuzione per categoria;
5. andamento ultimi mesi;
6. ultimi inserimenti;
7. prossime spese.

Su desktop utilizzare una griglia equilibrata.

Evitare:

* card eccessivamente grandi;
* grafici puramente decorativi;
* animazioni invadenti;
* layout da landing page.

---

# Header dashboard

Mostrare:

* titolo “Dashboard”;
* descrizione sintetica;
* selettore mese;
* selettore anno;
* pulsanti mese precedente e successivo;
* pulsante “Mese corrente”;
* pulsante globale “Nuova spesa”.

Esempio:

```text
Dashboard
Panoramica delle tue spese di luglio 2026
```

Il cambio periodo deve aggiornare:

* query parameter;
* KPI;
* grafici;
* tabelle.

---

# KPI card

Creare o riutilizzare:

```text
StatCardComponent
```

Ogni card può avere:

* titolo;
* valore;
* icona;
* testo secondario;
* variazione;
* stato loading;
* stato vuoto;
* tooltip informativo.

Card richieste:

```text
Totale speso
Variazione mensile
Numero di spese
Media giornaliera
Categoria principale
Spese future
```

La prossima spesa può essere:

* una card separata;
* oppure parte della sezione prossime spese.

---

# Grafici Chart.js

Utilizzare Chart.js tramite una soluzione Angular compatibile con la versione installata.

Prima di installare una nuova libreria:

1. verificare se Chart.js o un wrapper sono già presenti;
2. verificare la compatibilità con la versione Angular;
3. evitare dipendenze non mantenute;
4. non introdurre più wrapper per la stessa libreria.

È consentito usare direttamente Chart.js se il wrapper crea problemi.

Creare componenti riutilizzabili.

---

# Grafico andamento giornaliero

Componente indicativo:

```text
DailyExpenseTrendChartComponent
```

Tipo:

* `line`;
* oppure `bar`.

Mostrare:

* asse X con giorni del mese;
* asse Y con importi;
* tooltip con data, totale e numero di spese;
* valori in euro;
* giorni senza spese;
* layout responsive.

Non mostrare decine di etichette sovrapposte su mobile.

Ridurre automaticamente la densità delle etichette quando necessario.

---

# Grafico distribuzione per categoria

Componente indicativo:

```text
CategoryDistributionChartComponent
```

Tipo:

```text
doughnut
```

Mostrare:

* colori delle categorie;
* tooltip con nome, importo e percentuale;
* legenda;
* totale centrale opzionale;
* riepilogo testuale accessibile.

Se ci sono troppe categorie:

* mostrare le principali;
* raggruppare opzionalmente le restanti in “Altre”;
* oppure usare una legenda scrollabile.

Non perdere informazioni senza documentare il raggruppamento.

Se non ci sono dati, mostrare un empty state invece di un grafico vuoto.

---

# Grafico andamento degli ultimi mesi

Componente indicativo:

```text
MonthlyExpenseTrendChartComponent
```

Tipo:

```text
line
```

oppure:

```text
bar
```

Consentire la scelta:

```text
Ultimi 6 mesi
Ultimi 12 mesi
```

La scelta può essere locale alla dashboard.

Mostrare:

* mese;
* totale;
* numero di spese nel tooltip;
* mesi senza spese;
* formattazione euro.

---

# Colori dei grafici

Per la distribuzione utilizzare i colori delle categorie.

Per grafici temporali utilizzare colori coerenti con il tema dell’applicazione.

Evitare:

* gradienti eccessivi;
* colori con scarso contrasto;
* informazioni affidate soltanto al colore.

Gestire eventuale tema scuro se già presente.

Non implementare un nuovo sistema di temi in questa fase.

---

# Ultimi inserimenti

Creare o riutilizzare un componente:

```text
RecentExpensesComponent
```

Mostrare una tabella compatta con:

* data;
* descrizione;
* importo;
* categoria;
* stato;
* azioni.

Azioni:

* apri dettaglio;
* modifica;
* duplica, se il componente esistente lo supporta senza duplicazioni.

Aggiungere un collegamento:

```text
Vedi tutte le spese
```

che porta a:

```text
/expenses
```

Non ricreare una seconda implementazione completa della tabella spese.

Riutilizzare i componenti della Fase 4.

---

# Prossime spese

Creare:

```text
UpcomingExpensesComponent
```

Mostrare:

* data;
* descrizione;
* importo;
* categoria;
* distanza temporale;
* azione per segnare completata;
* collegamento al dettaglio.

Raggruppamento visivo possibile:

```text
Oggi
Domani
Entro 7 giorni
Successive
```

Non implementare notifiche.

Dopo il cambio di stato, aggiornare:

* prossime spese;
* KPI;
* grafici;
* ultimi inserimenti, se necessario.

---

# Servizio Angular

Creare:

```text
DashboardService
```

Responsabilità:

* summary;
* andamento giornaliero;
* distribuzione categorie;
* andamento mensile;
* ultimi inserimenti;
* prossime spese.

Le chiamate HTTP non devono risiedere nei componenti.

È possibile creare:

```text
DashboardStore
```

basato su Angular Signals.

Stato indicativo:

```text
selectedMonth
selectedYear
summary
dailyTrend
categoryDistribution
monthlyTrend
recentExpenses
upcomingExpenses
loading
sectionLoading
error
monthlyTrendRange
```

Non introdurre NgRx.

---

# Caricamento dei dati

È possibile:

* usare un endpoint composito;
* effettuare chiamate parallele tramite `forkJoin`;
* caricare alcune sezioni in modo indipendente.

La dashboard deve evitare che un errore secondario renda inutilizzabile tutta la pagina.

Preferire gestione degli errori per sezione:

* KPI;
* grafici;
* ultimi inserimenti;
* prossime spese.

Mostrare un errore globale soltanto quando i dati principali non sono disponibili.

Prevedere un pulsante:

```text
Riprova
```

---

# Modelli TypeScript frontend

Definire almeno:

```text
DashboardPeriod
DashboardSummary
DashboardTopCategory
DashboardPlannedExpense
DailyTrendPoint
CategoryDistributionItem
MonthlyTrendPoint
RecentExpense
UpcomingExpense
DashboardPeriodQuery
MonthlyTrendQuery
```

Non usare `any`.

Separare i modelli API dai modelli Chart.js quando le strutture sono differenti.

---

# Loading state

Durante il caricamento mostrare skeleton per:

* card KPI;
* grafici;
* ultimi inserimenti;
* prossime spese.

Evitare di rimuovere completamente il layout durante ogni cambio mese.

Se possibile:

* mantenere i dati precedenti;
* mostrare un indicatore di aggiornamento;
* sostituire i dati quando la nuova richiesta termina.

Prevenire risultati fuori ordine quando l’utente cambia rapidamente mese.

Usare:

* cancellazione delle richieste precedenti;
* `switchMap`;
* oppure un meccanismo equivalente.

---

# Empty state

Gestire almeno:

## Nessuna spesa nel periodo

Messaggio:

```text
Non hai ancora registrato spese per luglio 2026.
```

Azioni:

```text
Aggiungi una spesa
Vai alle spese
```

## Nessuna spesa pianificata

Messaggio:

```text
Non ci sono spese future pianificate.
```

## Nessun dato storico

Mostrare un empty state nel grafico mensile senza generare errori.

Non utilizzare grafici con serie vuote e legende inutili.

---

# Formattazione

Usare:

```text
it-IT
EUR
```

Esempi:

```text
1.284,50 €
14 luglio 2026
Luglio 2026
```

Centralizzare:

* formattazione degli importi;
* etichette dei mesi;
* descrizione delle variazioni;
* giorni mancanti.

Non duplicare utility nei componenti.

---

# Variazioni e accessibilità

La variazione mensile non deve essere indicata soltanto tramite:

* verde;
* rosso;
* freccia.

Mostrare anche testo, per esempio:

```text
Aumento del 10,7%
Diminuzione del 6,2%
Nessuna variazione
Confronto non disponibile
```

Ricordare che, nel contesto delle spese:

* un aumento non è necessariamente positivo;
* una diminuzione non è necessariamente negativa.

Evitare etichette semantiche come “successo” per l’aumento delle spese.

---

# Accessibilità dei grafici

Ogni grafico deve avere:

* titolo;
* descrizione;
* canvas accessibile;
* riepilogo testuale;
* alternativa tabellare o elenco sintetico;
* tooltip utilizzabile;
* contrasto sufficiente.

Non affidare informazioni essenziali esclusivamente al canvas.

Per il grafico per categoria, mostrare anche un elenco con:

* nome;
* importo;
* percentuale.

---

# Responsive design

## Desktop

* KPI su più colonne;
* grafici affiancati;
* andamento mensile a larghezza completa;
* ultimi inserimenti e prossime spese affiancati.

## Tablet

* KPI su due colonne;
* grafici su una o due colonne in base allo spazio;
* tabelle con scroll controllato.

## Mobile

* KPI su singola colonna o carosello accessibile, preferendo la colonna;
* grafici a larghezza completa;
* legenda compatta;
* liste al posto di tabelle troppo larghe;
* selettore periodo facilmente utilizzabile;
* pulsante “Nuova spesa” sempre raggiungibile.

---

# Prestazioni frontend

Evitare la ricreazione inutile dei grafici.

Quando cambiano i dati:

* aggiornare dataset e label;
* distruggere correttamente eventuali istanze precedenti;
* evitare memory leak;
* usare `takeUntilDestroyed`;
* evitare subscribe annidati.

Non importare l’intero catalogo di Chart.js se è possibile registrare soltanto gli elementi necessari.

---

# Seed development

Aggiornare il seed development per rendere la dashboard significativa.

Creare o verificare:

* spese completate distribuite nel mese corrente;
* spese completate nel mese precedente;
* almeno 4 categorie con dati;
* alcuni giorni senza spese;
* almeno un giorno con più spese;
* dati negli ultimi 6 mesi;
* alcune spese future `PLANNED`;
* almeno una spesa `CANCELLED`, che non deve incidere sui totali;
* almeno una categoria personalizzata.

Il seed deve essere:

* idempotente;
* disponibile soltanto in development;
* coerente con l’utente demo esistente.

Non creare dati demo in produzione.

---

# Test backend

Scrivere test almeno per:

## Summary

* totale del mese;
* conteggio spese;
* esclusione di `PLANNED`;
* esclusione di `CANCELLED`;
* esclusione delle spese eliminate;
* isolamento tra utenti;
* confronto con mese precedente;
* passaggio gennaio/dicembre;
* mese precedente con totale zero;
* media giornaliera del mese corrente;
* media giornaliera di un mese passato;
* categoria principale;
* nessuna categoria disponibile;
* totale pianificato;
* prossima spesa.

## Andamento giornaliero

* tutti i giorni del mese presenti;
* giorni senza spese valorizzati a zero;
* febbraio;
* anno bisestile;
* esclusione stati non completati;
* ordinamento corretto.

## Distribuzione categorie

* somme corrette;
* percentuali corrette;
* ordinamento decrescente;
* categorie personalizzate;
* totale zero.

## Andamento mensile

* ultimi 6 mesi;
* ultimi 12 mesi;
* mesi senza spese;
* attraversamento dell’anno;
* conclusione nel mese selezionato.

## Liste dashboard

* ultimi inserimenti ordinati per `createdAt`;
* rispetto del limite;
* prossime spese ordinate per data;
* esclusione di date passate;
* esclusione di spese non pianificate.

---

# Test frontend

Scrivere test almeno per:

* caricamento dashboard;
* selezione mese;
* selezione anno;
* mese precedente;
* mese successivo;
* ritorno al mese corrente;
* sincronizzazione query parameter;
* rendering KPI;
* aumento;
* diminuzione;
* percentuale non disponibile;
* empty state;
* loading skeleton;
* errore e retry;
* rendering andamento giornaliero;
* rendering distribuzione per categoria;
* rendering andamento mensile;
* cambio 6/12 mesi;
* ultimi inserimenti;
* prossime spese;
* cambio rapido di stato;
* formattazione euro;
* componenti grafici senza memory leak evidente;
* riepiloghi accessibili.

Non testare soltanto la presenza del canvas.

Verificare anche la trasformazione corretta dei dati nei dataset.

---

# Verifica manuale

Al termine verificare almeno:

1. effettuare il login;
2. aprire la dashboard;
3. verificare il mese corrente;
4. controllare il totale delle spese completate;
5. verificare che pianificate e annullate non incidano sul totale;
6. cambiare mese;
7. cambiare anno;
8. usare mese precedente e successivo;
9. verificare il confronto con il mese precedente;
10. controllare l’andamento giornaliero;
11. controllare la distribuzione per categoria;
12. passare da 6 a 12 mesi;
13. aprire una spesa dagli ultimi inserimenti;
14. aprire una spesa futura;
15. segnare completata una spesa pianificata;
16. verificare l’aggiornamento della dashboard;
17. provare un mese senza dati;
18. verificare la dashboard da mobile;
19. verificare l’accesso con un secondo utente;
20. confermare l’isolamento dei dati.

---

# Verifica finale obbligatoria

Al termine:

1. eseguire `prisma format`;
2. eseguire `prisma validate`;
3. generare Prisma Client, se necessario;
4. applicare eventuali migrazioni;
5. eseguire il seed development;
6. eseguire test backend;
7. eseguire test frontend;
8. eseguire lint;
9. eseguire type checking;
10. eseguire build backend;
11. eseguire build frontend;
12. verificare Swagger;
13. verificare Docker Compose;
14. verificare manualmente la dashboard;
15. correggere tutti gli errori trovati.

Eseguire i comandi separatamente se l’ambiente presenta problemi nell’inoltro di stdout o stderr.

Non dichiarare superate verifiche non realmente eseguite.

---

# Vincoli

* Non implementare report mensili avanzati.
* Non implementare il calendario.
* Non implementare notifiche.
* Non implementare ricorrenze.
* Non implementare budget.
* Non effettuare aggregazioni caricando tutte le spese nel frontend.
* Non usare floating point non controllati per gli importi.
* Non restituire oggetti Prisma direttamente.
* Non accettare `userId` dal client.
* Non usare `any`.
* Non disabilitare TypeScript strict.
* Non effettuare chiamate HTTP direttamente nei componenti.
* Non introdurre NgRx.
* Non installare librerie non necessarie.
* Non lasciare grafici senza empty state.
* Non affidare informazioni soltanto ai colori.
* Non lasciare TODO bloccanti.
* Non ignorare errori di test, lint o build.
* Non sostituire codice funzionante delle fasi precedenti.

---

# Output finale richiesto all’agente

Concludere con un riepilogo contenente:

* funzionalità implementate;
* endpoint creati;
* DTO e mapper aggiunti;
* strategia utilizzata per gli intervalli temporali;
* regole applicate agli stati delle spese;
* aggregazioni implementate;
* query ottimizzate;
* componenti Angular creati o riutilizzati;
* grafici Chart.js implementati;
* strategia di gestione degli importi;
* test realmente eseguiti;
* build realmente eseguite;
* verifica Docker;
* problemi corretti;
* eventuali limitazioni residue reali.

Non limitarsi al riepilogo: implementare prima integralmente la fase.
