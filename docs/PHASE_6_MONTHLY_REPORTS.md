# PHASE_6_MONTHLY_REPORTS.md

## Obiettivo

Implementare la **Fase 6 — Consultazione mensile e confronto tra periodi** dell’applicazione descritta in `AGENTS.md`.

Al termine della fase, l’utente autenticato deve poter:

* consultare il riepilogo completo di un mese;
* navigare tra mesi e anni;
* analizzare totali, medie e distribuzione delle spese;
* consultare l’elenco delle spese del periodo;
* confrontare due mesi;
* visualizzare differenze assolute e percentuali;
* confrontare le categorie tra i periodi;
* confrontare l’andamento giornaliero;
* distinguere spese completate, pianificate e annullate;
* utilizzare grafici Chart.js responsive e accessibili;
* mantenere i periodi selezionati nei query parameter.

Le aggregazioni devono essere calcolate dal backend.

Non caricare tutte le spese nel frontend per costruire report o confronti.

Implementare direttamente il codice nel repository.

Non limitarsi a descrivere la soluzione.

---

# Operazioni preliminari

Prima di modificare il codice:

1. leggere integralmente `AGENTS.md`;
2. leggere integralmente `docs/PHASE_6_MONTHLY_REPORTS.md`;
3. analizzare lo stato reale del repository;
4. eseguire `git status` e `git diff`;
5. verificare che le Fasi 1–5 siano funzionanti;
6. verificare autenticazione, categorie, etichette, spese e dashboard;
7. controllare le convenzioni già adottate per:

   * API;
   * mapper;
   * gestione degli importi;
   * intervalli temporali;
   * Chart.js;
   * componenti condivisi;
   * error handling;
8. riutilizzare le utility temporali e finanziarie della dashboard;
9. correggere soltanto eventuali problemi bloccanti;
10. evitare refactoring non necessari;
11. non ricominciare da zero.

Non duplicare logiche già implementate nella dashboard.

---

# Ambito della fase

Implementare:

* modulo backend per report e confronti;
* report dettagliato di un singolo mese;
* confronto tra due mesi;
* riepilogo per categoria;
* andamento giornaliero;
* variazioni assolute e percentuali;
* confronto tra spese completate e pianificate;
* pagina Angular del report mensile;
* pagina Angular di confronto;
* grafici Chart.js;
* tabella comparativa;
* navigazione tra mesi;
* sincronizzazione con query parameter;
* loading state;
* empty state;
* error state;
* test backend;
* test frontend;
* Swagger;
* aggiornamento README.

Non implementare ancora:

* calendario;
* notifiche;
* promemoria;
* ricorrenze;
* budget;
* confronto annuale avanzato;
* previsioni finanziarie;
* esportazione PDF;
* report inviati via email;
* confronto tra più di due mesi nella prima versione.

Predisporre l’architettura per consentire in futuro il confronto fino a sei mesi, senza implementarlo ora.

---

# Route frontend

Creare o completare:

```text
/reports/monthly
/reports/compare
```

Esempi:

```text
/reports/monthly?month=7&year=2026
```

```text
/reports/compare?monthA=6&yearA=2026&monthB=7&yearB=2026
```

Le route devono essere:

* protette da auth guard;
* lazy loaded, se coerente con l’architettura;
* collegate alla sidebar.

Aggiungere alla sidebar una sezione coerente, per esempio:

```text
Analisi
  Report mensile
  Confronto mesi
```

Icone suggerite:

```text
Report mensile   bi-calendar3
Confronto mesi   bi-bar-chart
```

---

# Regole generali sui periodi

Ogni periodo mensile deve essere identificato da:

```text
month
year
```

Validazioni:

```text
month:
  intero
  minimo 1
  massimo 12

year:
  intero
  minimo ragionevole
  massimo ragionevole
```

Usare come intervallo indicativo:

```text
2000–2100
```

oppure una convenzione già presente nel progetto.

Se mese e anno non vengono forniti nella pagina mensile:

* usare il mese corrente;
* usare l’anno corrente;
* aggiornare l’URL con i valori effettivi.

Nel confronto, entrambi i periodi devono essere espliciti.

Non accettare un mese senza il relativo anno.

---

# Fuso orario e date

Usare:

```text
Europe/Rome
```

Le date delle spese rappresentano date locali.

Le query mensili devono includere:

* il primo giorno del mese;
* l’ultimo giorno del mese;
* senza variazioni dovute alla conversione UTC.

Riutilizzare le utility temporali della dashboard.

Non duplicare in `ReportsModule` logiche differenti per il calcolo dei mesi.

Gestire correttamente:

* febbraio;
* anni bisestili;
* passaggio dicembre/gennaio;
* mesi con 28, 29, 30 o 31 giorni;
* mese corrente;
* mesi futuri.

---

# Stati inclusi nei report

## Spese effettive

Per i totali effettivamente sostenuti includere:

```text
COMPLETED
```

Escludere:

```text
PLANNED
CANCELLED
```

## Spese pianificate

Mostrare separatamente le spese:

```text
PLANNED
```

Le spese pianificate non devono essere sommate al totale effettivamente speso.

## Spese annullate

Le spese:

```text
CANCELLED
```

devono:

* essere escluse dai totali principali;
* poter essere conteggiate separatamente nel riepilogo;
* essere distinguibili nell’elenco del mese.

## Soft delete

Le spese soft deleted devono essere escluse da:

* totali;
* conteggi;
* grafici;
* confronti;
* elenco mensile;
* esportazioni future.

---

# Modulo backend

Creare o completare:

```text
ReportsModule
```

Struttura indicativa:

```text
apps/backend/src/reports/
├── dto/
│   ├── monthly-report-query.dto.ts
│   ├── month-comparison-query.dto.ts
│   └── report-expenses-query.dto.ts
├── reports.controller.ts
├── reports.service.ts
├── reports.mapper.ts
├── reports.types.ts
├── reports.utils.ts
├── reports.module.ts
└── reports.service.spec.ts
```

Responsabilità:

* controller: ricezione e validazione;
* service: query e aggregazioni;
* mapper: serializzazione di Decimal e date;
* utility: calcoli puri e allineamento dei giorni;
* test: regole temporali, percentuali e ownership.

Non inserire business logic nei controller.

---

# Endpoint REST

Utilizzare il prefisso:

```text
/api/v1/reports
```

Tutti gli endpoint devono essere autenticati.

Implementare almeno:

```http
GET /api/v1/reports/monthly
GET /api/v1/reports/monthly/expenses
GET /api/v1/reports/month-comparison
GET /api/v1/reports/category-comparison
GET /api/v1/reports/daily-comparison
```

È possibile utilizzare un endpoint composito per il confronto, purché:

* non diventi eccessivamente pesante;
* mantenga una risposta tipizzata;
* sia semplice da testare;
* non duplichi query inutilmente.

---

# Report mensile

Endpoint:

```http
GET /api/v1/reports/monthly?month=7&year=2026
```

Il report deve restituire almeno:

* identificazione del periodo;
* totale completato;
* totale pianificato;
* numero di spese completate;
* numero di spese pianificate;
* numero di spese annullate;
* media giornaliera;
* media per transazione;
* giorno con la spesa maggiore;
* singola spesa più alta;
* categoria principale;
* distribuzione per categoria;
* andamento giornaliero;
* breakdown per metodo di pagamento;
* eventuale confronto sintetico con il mese precedente.

Esempio indicativo:

```json
{
  "period": {
    "month": 7,
    "year": 2026,
    "label": "Luglio 2026",
    "daysInMonth": 31,
    "isCurrentMonth": true
  },
  "summary": {
    "completedTotal": "1284.50",
    "plannedTotal": "420.00",
    "completedCount": 32,
    "plannedCount": 3,
    "cancelledCount": 1,
    "dailyAverage": "91.75",
    "transactionAverage": "40.14"
  },
  "highestSpendingDay": {
    "date": "2026-07-12",
    "total": "246.00",
    "expenseCount": 4
  },
  "highestExpense": {
    "id": "uuid",
    "description": "Assicurazione auto",
    "amount": "320.00",
    "expenseDate": "2026-07-08",
    "category": {
      "id": "uuid",
      "name": "Auto",
      "color": "#8EA8D8",
      "icon": "bi-car-front"
    }
  },
  "topCategory": {
    "id": "uuid",
    "name": "Spesa alimentare",
    "color": "#9BC7B5",
    "icon": "bi-basket",
    "total": "350.00",
    "percentage": 27.25
  },
  "previousMonthComparison": {
    "previousTotal": "1160.00",
    "absoluteChange": "124.50",
    "percentageChange": 10.73,
    "direction": "INCREASE"
  }
}
```

Adattare la risposta al formato API standard del progetto.

---

# Totale e medie

## Totale completato

Somma delle spese:

```text
status = COMPLETED
```

nel periodo selezionato.

## Media giornaliera

Per un mese passato:

```text
completedTotal / giorni del mese
```

Per il mese corrente:

```text
completedTotal / giorni trascorsi inclusa la data corrente
```

Per un mese futuro senza spese completate:

```text
0
```

## Media per transazione

Formula:

```text
completedTotal / completedCount
```

Se il conteggio è zero:

```text
0
```

Non generare `NaN` o divisioni per zero.

---

# Giorno con la spesa maggiore

Determinare il giorno con il totale maggiore di spese `COMPLETED`.

Restituire:

* data;
* totale;
* numero di spese.

In caso di parità usare una regola stabile, per esempio:

```text
giorno cronologicamente precedente
```

Se non esistono spese completate:

```text
null
```

Non restituire un oggetto fittizio.

---

# Spesa singola più alta

Determinare la singola spesa `COMPLETED` con importo maggiore.

In caso di parità ordinare per:

1. data più recente;
2. data di creazione più recente;
3. ID come ordinamento stabile.

Se non esistono spese:

```text
null
```

---

# Distribuzione per categoria

Il report mensile deve contenere o rendere disponibile una lista con:

* categoria;
* importo totale;
* numero di spese;
* percentuale;
* importo medio.

Esempio:

```json
{
  "categoryId": "uuid",
  "name": "Ristoranti",
  "color": "#EAB5A8",
  "icon": "bi-cup-hot",
  "total": "184.00",
  "expenseCount": 5,
  "averageAmount": "36.80",
  "percentage": 14.32
}
```

Ordinare per totale decrescente.

Le categorie senza spese non devono essere incluse.

---

# Andamento giornaliero mensile

Restituire una voce per ogni giorno del mese.

Esempio:

```json
{
  "date": "2026-07-01",
  "day": 1,
  "completedTotal": "35.40",
  "plannedTotal": "0.00",
  "completedCount": 2,
  "plannedCount": 0
}
```

Anche i giorni senza spese devono essere presenti con valori zero.

Questo dataset deve poter alimentare:

* grafico giornaliero;
* riepilogo tabellare;
* confronto tra mesi.

---

# Metodi di pagamento

Restituire un breakdown delle spese completate per metodo di pagamento.

Esempio:

```json
{
  "paymentMethod": "DEBIT_CARD",
  "total": "620.00",
  "expenseCount": 15,
  "percentage": 48.27
}
```

Ordinare per totale decrescente.

Non includere metodi senza spese.

---

# Elenco spese mensili

Endpoint:

```http
GET /api/v1/reports/monthly/expenses
```

Query:

```text
month
year
page
pageSize
search
categoryId
labelIds
status
paymentMethod
sortBy
sortDirection
```

Questo endpoint può riutilizzare il servizio della Fase 4, purché:

* non duplichi logica;
* imponga il periodo mensile;
* mantenga ownership;
* escluda soft deleted;
* restituisca paginazione server-side.

Non caricare tutte le spese del mese in una sola risposta.

La pagina report deve poter mostrare:

* tutte;
* completate;
* pianificate;
* annullate.

---

# Confronto tra due mesi

Endpoint principale:

```http
GET /api/v1/reports/month-comparison
```

Query:

```text
monthA
yearA
monthB
yearB
```

Esempio:

```text
/api/v1/reports/month-comparison?monthA=6&yearA=2026&monthB=7&yearB=2026
```

La risposta deve contenere:

* riepilogo periodo A;
* riepilogo periodo B;
* differenze;
* confronto per categoria;
* confronto giornaliero;
* confronto metodi di pagamento;
* metriche completate e pianificate.

---

# Metriche del confronto

Confrontare almeno:

```text
Totale completato
Totale pianificato
Numero di spese completate
Numero di spese pianificate
Media giornaliera
Media per transazione
Spesa singola più alta
Numero di categorie utilizzate
```

Per ogni metrica restituire:

* valore periodo A;
* valore periodo B;
* differenza assoluta;
* differenza percentuale;
* direzione.

Esempio:

```json
{
  "metric": "COMPLETED_TOTAL",
  "periodAValue": "1160.00",
  "periodBValue": "1284.50",
  "absoluteChange": "124.50",
  "percentageChange": 10.73,
  "direction": "INCREASE"
}
```

Direzioni:

```text
INCREASE
DECREASE
UNCHANGED
NOT_COMPARABLE
```

---

# Regole percentuali

Formula:

```text
(periodB - periodA) / periodA * 100
```

Casi particolari:

## Entrambi zero

```text
absoluteChange = 0
percentageChange = 0
direction = UNCHANGED
```

## Periodo A uguale a zero e periodo B maggiore di zero

```text
percentageChange = null
direction = NOT_COMPARABLE
```

## Periodo A maggiore di zero e periodo B uguale a zero

```text
percentageChange = -100
direction = DECREASE
```

Non restituire:

* `Infinity`;
* `NaN`;
* percentuali arbitrarie.

---

# Confronto categorie

Endpoint:

```http
GET /api/v1/reports/category-comparison
```

Query:

```text
monthA
yearA
monthB
yearB
```

Restituire l’unione delle categorie presenti nei due mesi.

Esempio:

```json
{
  "categoryId": "uuid",
  "name": "Ristoranti",
  "color": "#EAB5A8",
  "icon": "bi-cup-hot",
  "periodATotal": "90.00",
  "periodBTotal": "184.00",
  "absoluteChange": "94.00",
  "percentageChange": 104.44,
  "direction": "INCREASE"
}
```

Se una categoria compare soltanto in uno dei due mesi:

* usare zero per il mese senza spese;
* applicare le regole percentuali definite;
* non omettere la categoria.

Ordinamento suggerito:

```text
massimo tra periodATotal e periodBTotal, decrescente
```

---

# Confronto andamento giornaliero

Endpoint:

```http
GET /api/v1/reports/daily-comparison
```

Query:

```text
monthA
yearA
monthB
yearB
mode
```

Modalità supportate:

```text
CALENDAR_DAY
NORMALIZED
```

## CALENDAR_DAY

Confronta:

```text
giorno 1 con giorno 1
giorno 2 con giorno 2
```

La serie deve arrivare al numero massimo di giorni tra i due mesi.

Per i giorni non esistenti in uno dei mesi usare:

```text
null
```

Esempio:

```json
{
  "day": 31,
  "periodATotal": null,
  "periodBTotal": "24.00"
}
```

## NORMALIZED

Facoltativo per questa fase.

Se implementato, confronta l’avanzamento percentuale del mese.

Non implementarlo se complica eccessivamente il codice.

La modalità predefinita deve essere:

```text
CALENDAR_DAY
```

---

# Precisione degli importi

Utilizzare `Decimal` per:

* totali;
* differenze;
* medie;
* somme per categoria;
* somme per metodo di pagamento.

Non convertire prematuramente in `number`.

Nel mapper API serializzare gli importi come stringhe:

```json
"1284.50"
```

Le percentuali possono essere numeri arrotondati a due cifre decimali.

Centralizzare l’arrotondamento.

Non duplicare logiche finanziarie nel frontend.

---

# Prestazioni backend

Usare query aggregate efficienti.

Preferire:

* `SUM`;
* `COUNT`;
* `GROUP BY`;
* filtri per utente e periodo;
* query parallele indipendenti tramite `Promise.all`.

Non caricare tutte le spese in memoria per poi aggregarle.

Verificare gli indici esistenti su:

```text
userId
expenseDate
status
categoryId
paymentMethod
deletedAt
```

Aggiungere una migrazione soltanto se serve realmente un nuovo indice.

Non creare indici duplicati.

In caso di query raw:

* utilizzare query parametrizzate;
* non interpolare input utente;
* mantenere compatibilità MariaDB;
* aggiungere test.

---

# DTO backend

Creare almeno:

```text
MonthlyReportQueryDto
MonthlyExpensesQueryDto
MonthComparisonQueryDto
DailyComparisonQueryDto
```

Validazioni:

```text
month, monthA, monthB:
  intero
  1–12

year, yearA, yearB:
  intero
  intervallo consentito

page:
  intero
  minimo 1

pageSize:
  intero
  minimo 1
  massimo 100

mode:
  enum valido
```

Non accettare parametri non previsti, se il progetto usa whitelist rigida.

---

# Mapper backend

Creare o completare:

```text
ReportsMapper
```

Responsabilità:

* conversione Decimal;
* serializzazione date;
* costruzione oggetti periodo;
* trasformazione delle metriche;
* trasformazione confronto categorie;
* trasformazione andamento giornaliero.

Non restituire direttamente risultati Prisma o query raw.

---

# Swagger

Documentare:

* tutti gli endpoint;
* autenticazione Bearer;
* query parameter;
* periodi;
* metriche;
* direzioni;
* stati inclusi;
* importi come stringhe;
* percentuali nullable;
* casi senza dati;
* errori di validazione.

Documentare almeno:

```text
200
400
401
500
```

Inserire esempi di confronto tra due mesi.

---

# Frontend — Pagina report mensile

Creare:

```text
MonthlyReportPageComponent
```

Struttura consigliata:

1. header;
2. selettore periodo;
3. card riepilogo;
4. grafico andamento giornaliero;
5. grafico distribuzione categorie;
6. breakdown metodi di pagamento;
7. informazioni principali;
8. elenco spese del mese.

---

# Header report mensile

Mostrare:

```text
Report mensile
Analisi completa delle spese di luglio 2026
```

Controlli:

* mese precedente;
* mese successivo;
* selettore mese;
* selettore anno;
* pulsante “Mese corrente”;
* pulsante “Confronta con un altro mese”.

Il periodo deve essere sincronizzato con l’URL.

---

# Card riepilogo

Mostrare almeno:

```text
Totale speso
Totale pianificato
Numero di spese
Media giornaliera
Media per spesa
Categoria principale
```

È possibile aggiungere:

```text
Spesa più alta
Giorno più costoso
```

Riutilizzare:

```text
StatCardComponent
CategoryBadgeComponent
ExpenseStatusBadgeComponent
```

Non duplicare componenti della dashboard.

---

# Grafico andamento giornaliero

Creare o riutilizzare:

```text
DailyExpenseTrendChartComponent
```

Mostrare:

* totale completato;
* totale pianificato opzionale;
* giorni del mese;
* tooltip con data, importo e conteggio;
* giorni senza spese.

Non duplicare il componente della dashboard se può essere esteso in modo pulito.

Il componente deve accettare dataset configurabili.

---

# Grafico distribuzione categorie

Riutilizzare o estendere:

```text
CategoryDistributionChartComponent
```

Mostrare:

* categorie;
* totale;
* percentuale;
* numero di spese.

Affiancare un elenco accessibile con:

* categoria;
* importo;
* percentuale.

---

# Breakdown metodi di pagamento

Creare:

```text
PaymentMethodBreakdownComponent
```

Visualizzazione possibile:

* barre orizzontali;
* tabella compatta;
* grafico doughnut.

Preferire una visualizzazione semplice e gestionale.

Mostrare:

* metodo;
* importo;
* numero di transazioni;
* percentuale.

---

# Elenco spese del mese

Riutilizzare i componenti della Fase 4.

Mostrare:

* ricerca;
* stato;
* categoria;
* etichette;
* metodo di pagamento;
* ordinamento;
* paginazione.

Il periodo mensile deve restare fisso.

Non permettere ai filtri interni di modificare mese e anno del report.

Riutilizzare:

```text
ExpenseTableComponent
ExpenseCardComponent
PaginationComponent
ExpenseStatusBadgeComponent
PaymentMethodBadgeComponent
```

---

# Frontend — Pagina confronto

Creare:

```text
MonthComparisonPageComponent
```

Struttura consigliata:

1. selezione periodo A e B;
2. card confronto principali;
3. grafico totali;
4. grafico confronto categorie;
5. grafico andamento giornaliero;
6. tabella comparativa;
7. riepilogo testuale.

---

# Selettore periodi

Creare o riutilizzare:

```text
MonthSelectorComponent
```

Per ogni periodo consentire:

* mese;
* anno.

Etichette:

```text
Periodo A
Periodo B
```

Aggiungere azione:

```text
Scambia periodi
```

La funzione deve scambiare:

* mese;
* anno;
* query parameter;
* dati caricati.

Aggiungere scorciatoie:

```text
Mese corrente vs precedente
Ultimi due mesi
```

Non consentire richieste incomplete.

Consentire il confronto dello stesso mese con sé stesso, ma mostrare un messaggio informativo.

---

# Card confronto

Mostrare almeno:

```text
Totale speso
Numero di spese
Media giornaliera
Media per transazione
Totale pianificato
Spesa più alta
```

Ogni card deve mostrare:

* valore periodo A;
* valore periodo B;
* differenza assoluta;
* differenza percentuale;
* direzione testuale.

Esempio:

```text
Totale speso

Giugno 2026
1.160,00 €

Luglio 2026
1.284,50 €

Differenza
+124,50 € (+10,73%)
```

Non affidare la variazione soltanto ai colori.

---

# Grafico confronto totali

Creare:

```text
MonthlyTotalsComparisonChartComponent
```

Tipo consigliato:

```text
bar
```

Mostrare almeno:

* completato;
* pianificato;
* numero di spese, se utile su un asse separato o in un altro grafico.

Evitare doppi assi poco leggibili se non necessari.

---

# Grafico confronto categorie

Creare:

```text
CategoryComparisonChartComponent
```

Tipo consigliato:

```text
bar
```

Preferire barre orizzontali se le categorie sono numerose.

Mostrare:

* valore periodo A;
* valore periodo B;
* nome categoria;
* tooltip con differenza.

Consentire opzionalmente:

```text
Mostra solo categorie con variazioni
```

Non nascondere categorie senza una scelta esplicita dell’utente.

---

# Grafico confronto giornaliero

Creare:

```text
DailyComparisonChartComponent
```

Tipo consigliato:

```text
line
```

Mostrare:

* serie periodo A;
* serie periodo B;
* asse X con giorno del mese;
* tooltip con data completa;
* valori nulli per giorni inesistenti.

Non trasformare un giorno inesistente in zero, perché zero e assenza del giorno sono concetti diversi.

---

# Tabella comparativa categorie

Mostrare:

* categoria;
* periodo A;
* periodo B;
* differenza assoluta;
* differenza percentuale;
* direzione.

Ordinamento:

* differenza assoluta;
* totale periodo A;
* totale periodo B;
* nome categoria.

Consentire:

* aumento;
* diminuzione;
* invariate;
* non comparabili.

---

# Riepilogo testuale

Generare un riepilogo deterministico basato sui dati.

Esempi:

```text
A luglio hai speso 124,50 € in più rispetto a giugno.
```

```text
La categoria con l’aumento maggiore è Ristoranti, con 94,00 € in più.
```

```text
Le spese per Trasporti sono diminuite del 18,4%.
```

Non utilizzare AI generativa.

Il testo deve essere costruito tramite regole applicative.

Evitare giudizi finanziari come:

```text
Hai speso troppo.
```

Utilizzare descrizioni neutrali.

---

# Servizi Angular

Creare:

```text
ReportsService
```

Responsabilità:

* report mensile;
* lista spese mensile;
* confronto generale;
* confronto categorie;
* confronto giornaliero.

È possibile creare:

```text
MonthlyReportStore
MonthComparisonStore
```

basati su Angular Signals.

Non introdurre NgRx.

---

# Stato frontend

Gestire almeno:

```text
selectedPeriod
comparisonPeriodA
comparisonPeriodB
monthlyReport
monthlyExpenses
comparison
categoryComparison
dailyComparison
loading
sectionLoading
error
filters
pagination
```

Usare:

* Signals;
* computed;
* RxJS;
* `switchMap`;
* `takeUntilDestroyed`.

Prevenire risultati fuori ordine durante cambi rapidi dei periodi.

---

# Modelli TypeScript

Definire almeno:

```text
MonthlyPeriod
MonthlyReport
MonthlyReportSummary
HighestSpendingDay
HighestExpense
CategoryReportItem
PaymentMethodReportItem
DailyReportPoint
MonthComparison
ComparisonMetric
ComparisonDirection
CategoryComparisonItem
DailyComparisonPoint
MonthlyReportQuery
MonthComparisonQuery
```

Non utilizzare `any`.

Separare:

* risposta API;
* dataset grafici;
* stato UI;
* query parameter.

---

# Query parameter frontend

## Report mensile

```text
/reports/monthly?month=7&year=2026
```

## Confronto

```text
/reports/compare?monthA=6&yearA=2026&monthB=7&yearB=2026
```

Regole:

* aggiornare l’URL quando cambia un periodo;
* ripristinare lo stato al refresh;
* supportare avanti e indietro del browser;
* non inserire parametri vuoti;
* evitare loop tra router e store;
* non effettuare richieste duplicate.

---

# Loading state

Mostrare skeleton per:

* card;
* grafici;
* tabelle;
* breakdown;
* confronto.

Durante il cambio periodo:

* mantenere possibilmente la struttura;
* mostrare aggiornamento in corso;
* evitare il lampeggio completo della pagina.

Gestire errori per sezione quando possibile.

---

# Empty state

## Mese senza spese

Mostrare:

```text
Non risultano spese per luglio 2026.
```

Azioni:

```text
Aggiungi una spesa
Vai alle spese
```

## Nessuna spesa completata

Se esistono soltanto spese pianificate:

```text
Non risultano spese completate, ma sono presenti spese pianificate.
```

## Confronto senza dati

Se entrambi i periodi sono vuoti:

```text
Non ci sono dati da confrontare nei periodi selezionati.
```

Se uno solo è vuoto, mostrare comunque il confronto con valori zero e percentuali non comparabili.

---

# Accessibilità

Garantire:

* label per tutti i selettori;
* focus visibile;
* navigazione da tastiera;
* grafici con riepiloghi testuali;
* tabelle alternative;
* differenze non indicate soltanto dal colore;
* percentuali accompagnate da testo;
* pulsanti icona con `aria-label`;
* loading annunciabile;
* errori comprensibili.

---

# Responsive design

## Desktop

* selettori periodi affiancati;
* card su più colonne;
* grafici affiancati;
* tabella completa.

## Tablet

* card su due colonne;
* grafici a larghezza completa quando necessario;
* toolbar su più righe.

## Mobile

* selettori impilati;
* card su singola colonna;
* grafici a larghezza completa;
* tabella sostituita da card o scroll controllato;
* filtri collassabili;
* pulsanti facilmente selezionabili.

Mantenere la palette light e pastello introdotta nella rifinitura frontend.

---

# Chart.js

Riutilizzare la configurazione Chart.js della dashboard.

Non installare un secondo wrapper.

Centralizzare:

* formattazione euro;
* tooltip;
* colori;
* font;
* responsive options;
* gestione legenda;
* tema light.

Evitare la ricreazione inutile delle istanze.

Distruggere correttamente i grafici quando necessario.

---

# Test backend

Scrivere test almeno per:

## Report mensile

* totale completato;
* totale pianificato;
* conteggio annullate;
* esclusione soft deleted;
* isolamento utenti;
* media giornaliera;
* media per transazione;
* giorno con spesa maggiore;
* parità tra giorni;
* spesa singola più alta;
* categoria principale;
* distribuzione categorie;
* metodi di pagamento;
* mese vuoto;
* febbraio bisestile;
* passaggio anno.

## Elenco mensile

* periodo fisso;
* paginazione;
* ricerca;
* filtri;
* ordinamento;
* ownership.

## Confronto

* differenza assoluta;
* differenza percentuale;
* entrambi zero;
* periodo A uguale a zero;
* periodo B uguale a zero;
* stesso periodo;
* mesi di durata diversa;
* attraversamento anno;
* confronto categorie;
* categoria presente in un solo mese;
* confronto giornaliero;
* giorno 31 assente;
* esclusione di planned dai totali completati.

---

# Test frontend

Scrivere test almeno per:

* caricamento report mensile;
* periodo predefinito;
* selezione mese;
* selezione anno;
* navigazione precedente e successiva;
* query parameter;
* rendering card;
* mese vuoto;
* rendering grafici;
* breakdown metodi di pagamento;
* elenco paginato;
* filtri elenco;
* apertura confronto;
* selezione periodo A;
* selezione periodo B;
* scambio periodi;
* confronto con stesso mese;
* percentuale non comparabile;
* rendering confronto categorie;
* rendering confronto giornaliero;
* giorni inesistenti rappresentati come null;
* loading;
* error state;
* retry;
* riepilogo testuale;
* accessibilità dei grafici.

Non verificare soltanto la presenza del canvas.

Testare anche la trasformazione dei dataset.

---

# Verifica manuale

Al termine verificare almeno:

1. effettuare il login;
2. aprire il report mensile;
3. verificare il mese corrente;
4. cambiare mese;
5. cambiare anno;
6. usare mese precedente e successivo;
7. verificare totale completato;
8. verificare totale pianificato;
9. verificare che le annullate non incidano sul totale;
10. controllare giorno più costoso;
11. controllare spesa più alta;
12. controllare categorie;
13. controllare metodi di pagamento;
14. filtrare l’elenco;
15. aprire il confronto;
16. confrontare mese corrente e precedente;
17. scambiare i periodi;
18. confrontare mesi con durate differenti;
19. provare un periodo vuoto;
20. verificare da mobile;
21. accedere con un secondo utente;
22. confermare l’isolamento dei dati.

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
14. verificare manualmente report e confronto;
15. correggere tutti gli errori trovati.

Eseguire i comandi separatamente se l’ambiente presenta problemi di inoltro di stdout o stderr.

Non dichiarare superate verifiche non realmente eseguite.

---

# Vincoli

* Non implementare calendario.
* Non implementare notifiche.
* Non implementare ricorrenze.
* Non implementare budget.
* Non implementare confronto tra più di due mesi.
* Non effettuare aggregazioni caricando tutte le spese nel frontend.
* Non usare floating point non controllati per gli importi.
* Non restituire oggetti Prisma direttamente.
* Non accettare `userId` dal client.
* Non usare `any`.
* Non disabilitare TypeScript strict.
* Non duplicare utility temporali e finanziarie.
* Non effettuare chiamate HTTP direttamente nei componenti.
* Non introdurre NgRx.
* Non installare nuove librerie per i grafici se Chart.js è già configurato.
* Non affidare informazioni soltanto ai colori.
* Non lasciare TODO bloccanti.
* Non ignorare errori di test, lint o build.
* Non riscrivere componenti funzionanti delle fasi precedenti.

---

# Output finale richiesto all’agente

Concludere con un riepilogo contenente:

* funzionalità implementate;
* endpoint creati;
* DTO e mapper aggiunti;
* utility riutilizzate;
* metriche disponibili;
* regole applicate agli stati;
* strategia per importi e percentuali;
* componenti Angular creati o riutilizzati;
* grafici implementati;
* test realmente eseguiti;
* build realmente eseguite;
* verifica Swagger;
* verifica Docker;
* problemi corretti;
* eventuali limitazioni residue reali.

Non limitarsi al riepilogo: implementare prima integralmente la fase.
