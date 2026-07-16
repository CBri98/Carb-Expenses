# PHASE_7_CALENDAR.md

## Obiettivo

Implementare la **Fase 7 — Calendario e gestione visuale delle spese future** dell’applicazione descritta in `AGENTS.md`.

Al termine della fase, l’utente autenticato deve poter:

* visualizzare le spese in un calendario;
* consultare principalmente le spese pianificate;
* visualizzare anche spese completate e annullate tramite filtri;
* navigare tra mesi, settimane e giorni;
* aprire il dettaglio di una spesa dal calendario;
* creare una spesa cliccando su una data;
* modificare una spesa esistente;
* spostare una spesa pianificata a un’altra data;
* cambiare rapidamente lo stato di una spesa;
* consultare una vista agenda o elenco;
* filtrare gli eventi;
* distinguere chiaramente scadenze passate, odierne e future;
* mantenere periodo, vista e filtri nei query parameter.

Questa fase deve riutilizzare il CRUD delle spese già implementato.

Non creare un secondo sistema indipendente per gli eventi del calendario.

Le spese restano la fonte autorevole dei dati.

Implementare direttamente il codice nel repository.

Non limitarsi a descrivere la soluzione.

---

# Operazioni preliminari

Prima di modificare il codice:

1. leggere integralmente `AGENTS.md`;
2. leggere integralmente `docs/PHASE_7_CALENDAR.md`;
3. analizzare lo stato reale del repository;
4. eseguire `git status` e `git diff`;
5. verificare che le Fasi 1–6 siano funzionanti;
6. verificare:

   * autenticazione;
   * categorie;
   * etichette;
   * CRUD spese;
   * stati delle spese;
   * date e orari;
   * dashboard;
   * report mensili;
7. controllare i componenti condivisi già disponibili;
8. verificare la versione Angular effettivamente installata;
9. verificare la compatibilità delle eventuali librerie calendario prima di installarle;
10. correggere soltanto problemi realmente bloccanti;
11. evitare refactoring non necessari;
12. non ricominciare da zero.

Non modificare la strategia di gestione delle date già adottata senza una motivazione concreta.

---

# Ambito della fase

Implementare:

* modulo backend calendario;
* endpoint specifico per intervalli temporali;
* trasformazione delle spese in eventi calendario;
* vista mensile;
* vista settimanale;
* vista giornaliera o agenda;
* vista elenco;
* filtri;
* apertura dettaglio;
* creazione da una data selezionata;
* modifica da calendario;
* spostamento tramite drag and drop, se supportato in sicurezza;
* cambio rapido di stato;
* gestione delle spese pianificate scadute;
* sincronizzazione con query parameter;
* responsive design;
* accessibilità;
* test backend;
* test frontend;
* Swagger;
* aggiornamento README.

Non implementare ancora:

* notifiche automatiche;
* promemoria;
* email;
* notifiche push;
* spese ricorrenti;
* generazione automatica di occorrenze;
* sincronizzazione con Google Calendar;
* sincronizzazione con calendari esterni;
* allegati;
* budget;
* previsioni.

La fase deve predisporre il calendario per la futura integrazione con avvisi e ricorrenze, senza implementarle ora.

---

# Principio fondamentale

Il calendario non deve introdurre un modello `CalendarEvent` separato per duplicare le spese.

Gli eventi del calendario devono essere una rappresentazione delle entità:

```text
Expense
```

Ogni evento deve mantenere il riferimento alla spesa originale.

Le operazioni effettuate dal calendario devono utilizzare:

* endpoint delle spese esistenti;
* oppure endpoint calendario sottili che delegano alla stessa business logic.

Non duplicare:

* ownership;
* validazione categorie;
* validazione etichette;
* normalizzazione importi;
* cambio stato;
* modifica spesa.

---

# Route frontend

Creare o completare:

```text
/calendar
```

Esempio:

```text
/calendar?view=month&date=2026-07-16
```

Con filtri:

```text
/calendar?view=month&date=2026-07-16&status=PLANNED&categoryId=uuid
```

La route deve essere:

* protetta da auth guard;
* lazy loaded, se coerente con il progetto;
* collegata alla sidebar.

Aggiungere alla sidebar:

```text
Calendario
```

Icona suggerita:

```text
bi-calendar-event
```

---

# Viste richieste

Implementare almeno:

```text
MONTH
WEEK
LIST
```

È possibile aggiungere:

```text
DAY
```

se supportato senza complicazioni eccessive.

Etichette frontend:

```text
MONTH   Mese
WEEK    Settimana
DAY     Giorno
LIST    Elenco
```

Vista predefinita:

```text
MONTH
```

Su dispositivi mobili è possibile usare `LIST` come vista iniziale, se migliora concretamente l’usabilità.

La preferenza della vista deve essere rappresentata nell’URL.

---

# Libreria calendario

Prima di installare una libreria:

1. verificare se è già presente nel progetto;
2. verificare la compatibilità con la versione Angular installata;
3. verificare le peer dependency;
4. evitare `--force`;
5. evitare `--legacy-peer-deps`;
6. non installare più librerie calendario;
7. non introdurre wrapper non mantenuti.

È possibile utilizzare FullCalendar con integrazione Angular, se compatibile con il progetto.

Plugin eventualmente necessari:

```text
dayGrid
timeGrid
list
interaction
```

Installare soltanto i plugin realmente utilizzati.

Se la libreria presenta incompatibilità con Angular o con la configurazione corrente:

* non forzare l’installazione;
* implementare una vista calendario gestionale più semplice;
* mantenere comunque le funzionalità fondamentali.

---

# Fuso orario e gestione date

Usare il fuso orario applicativo:

```text
Europe/Rome
```

Le date delle spese devono essere trattate come date locali.

Regole:

* `expenseDate` resta nel formato `YYYY-MM-DD`;
* `expenseTime` resta separato;
* una spesa senza ora deve essere trattata come evento giornaliero;
* una spesa con ora deve mostrare l’orario;
* non spostare automaticamente la data per conversioni UTC;
* i timestamp tecnici restano in UTC;
* il calendario deve usare locale italiano;
* la settimana deve iniziare di lunedì.

Centralizzare la conversione:

```text
Expense → CalendarEvent
Calendar selection → Expense form date
Calendar drop → Expense update payload
```

Non inserire parsing manuale duplicato nei componenti.

---

# Stati mostrati

Il calendario deve poter visualizzare:

```text
PLANNED
COMPLETED
CANCELLED
```

## Comportamento predefinito

Per impostazione predefinita mostrare:

```text
PLANNED
COMPLETED
```

Le spese `CANCELLED` possono essere:

* escluse di default;
* attivabili tramite filtro.

## Soft delete

Le spese eliminate non devono essere mostrate.

## Aspetto visivo

Ogni stato deve essere chiaramente distinguibile.

Esempio:

```text
PLANNED     stile principale della categoria
COMPLETED   stile attenuato con indicatore completata
CANCELLED   stile barrato o molto attenuato
```

Non affidare la distinzione esclusivamente al colore.

Mostrare anche:

* icona;
* testo;
* simbolo;
* badge.

---

# Spese pianificate scadute

Una spesa è scaduta quando:

```text
status = PLANNED
expenseDate < data corrente
```

Le spese pianificate scadute devono:

* restare visibili;
* essere evidenziate;
* avere un badge “Scaduta”;
* poter essere segnate come completate;
* poter essere spostate;
* poter essere annullate.

Non convertirle automaticamente in `COMPLETED` o `CANCELLED`.

Non implementare notifiche in questa fase.

---

# Backend NestJS

Creare:

```text
CalendarModule
```

Struttura indicativa:

```text
apps/backend/src/calendar/
├── dto/
│   └── calendar-expenses-query.dto.ts
├── calendar.controller.ts
├── calendar.service.ts
├── calendar.mapper.ts
├── calendar.types.ts
├── calendar.module.ts
└── calendar.service.spec.ts
```

Responsabilità:

* controller: validazione e inoltro;
* service: recupero delle spese nell’intervallo;
* mapper: trasformazione in eventi calendario;
* test: ownership, intervalli e stati.

Non duplicare il service completo delle spese.

Riutilizzare utility e business logic già presenti.

---

# Endpoint calendario

Implementare:

```http
GET /api/v1/calendar/expenses
```

Query parameter:

```text
start
end
status
categoryId
labelIds
paymentMethod
search
```

Esempio:

```text
/api/v1/calendar/expenses?start=2026-07-01&end=2026-08-01&status=PLANNED
```

Usare preferibilmente un intervallo:

```text
start inclusivo
end esclusivo
```

Documentare chiaramente la convenzione.

---

# Validazione intervallo

## start

* obbligatorio;
* formato `YYYY-MM-DD`;
* data valida.

## end

* obbligatorio;
* formato `YYYY-MM-DD`;
* data valida;
* successivo a `start`.

## Limite intervallo

Imporre un intervallo massimo ragionevole, per esempio:

```text
366 giorni
```

Evitare richieste senza limiti temporali.

Restituire `400` per intervalli non validi.

---

# Filtri backend

Supportare:

## Stato

Uno o più stati:

```text
status=PLANNED,COMPLETED
```

Oppure un formato coerente con le convenzioni del progetto.

## Categoria

```text
categoryId=uuid
```

## Etichette

```text
labelIds=id1,id2
```

Usare la stessa semantica della pagina Spese, preferibilmente `ANY`.

## Metodo di pagamento

```text
paymentMethod=DEBIT_CARD
```

## Ricerca

Cercare almeno in:

* descrizione;
* esercente.

Tutti i filtri devono:

* rispettare ownership;
* escludere soft deleted;
* essere applicati server-side.

---

# Risposta evento calendario

Esempio:

```json
{
  "id": "expense-uuid",
  "expenseId": "expense-uuid",
  "title": "Assicurazione auto",
  "amount": "320.00",
  "expenseDate": "2026-07-20",
  "expenseTime": null,
  "allDay": true,
  "status": "PLANNED",
  "isOverdue": false,
  "merchant": "Compagnia assicurativa",
  "category": {
    "id": "category-uuid",
    "name": "Auto",
    "color": "#9BAFD6",
    "icon": "bi-car-front"
  },
  "labels": [
    {
      "id": "label-uuid",
      "name": "Spesa annuale",
      "color": "#E9B6A7",
      "icon": "bi-calendar-check"
    }
  ],
  "paymentMethod": "DIRECT_DEBIT"
}
```

Il mapper deve inoltre fornire le proprietà necessarie al calendario senza esporre oggetti Prisma.

È possibile restituire:

* dati applicativi neutrali;
* oppure una struttura già vicina a FullCalendar.

Preferire una struttura applicativa indipendente dalla libreria frontend.

---

# Ordinamento backend

Ordinare gli eventi per:

```text
expenseDate asc
expenseTime asc
createdAt asc
```

Le spese senza ora devono essere gestite coerentemente.

Non affidarsi all’ordinamento del client come unica garanzia.

---

# Ownership

Ogni query deve essere limitata all’utente autenticato.

Un utente non deve poter visualizzare nel calendario:

* spese altrui;
* categorie altrui;
* etichette altrui;
* spese eliminate.

Non accettare `userId` dal client.

---

# Modifica data tramite calendario

Per spostare una spesa usare preferibilmente l’endpoint esistente:

```http
PATCH /api/v1/expenses/:id
```

Payload:

```json
{
  "expenseDate": "2026-07-24"
}
```

Se viene modificato anche l’orario:

```json
{
  "expenseDate": "2026-07-24",
  "expenseTime": "14:30"
}
```

Non creare un endpoint duplicato salvo reale necessità.

Se viene creato un endpoint dedicato, deve delegare alla business logic di `ExpensesService`.

---

# Creazione dal calendario

Cliccando o selezionando una data:

1. aprire `QuickExpenseModalComponent` o `ExpenseFormComponent`;
2. precompilare `expenseDate`;
3. se viene selezionato uno slot orario, precompilare `expenseTime`;
4. proporre `PLANNED` per date future;
5. non sovrascrivere una scelta manuale;
6. salvare tramite `ExpenseService`;
7. aggiornare il calendario senza ricaricare tutta l’applicazione;
8. mostrare un toast.

Non creare un secondo form per il calendario.

Riutilizzare il form della Fase 4.

---

# Apertura dettaglio

Cliccando su un evento:

* aprire un pannello laterale;
* oppure una modale di dettaglio;
* oppure navigare a `/expenses/:id`.

Preferire il riutilizzo di:

```text
ExpenseDetailComponent
```

Mostrare almeno:

* descrizione;
* importo;
* data;
* ora;
* stato;
* categoria;
* etichette;
* metodo di pagamento;
* esercente;
* note.

Azioni:

* modifica;
* segna completata;
* segna pianificata;
* annulla;
* duplica;
* elimina.

---

# Drag and drop

Implementare il trascinamento soltanto se:

* la libreria lo supporta in modo stabile;
* non compromette accessibilità;
* non introduce problemi con il calendario mobile;
* i test possono coprire il comportamento;
* è possibile effettuare rollback in caso di errore API.

## Elementi spostabili

Per impostazione predefinita rendere spostabili soltanto:

```text
PLANNED
```

Le spese `COMPLETED` e `CANCELLED` non devono essere trascinabili, salvo futura decisione esplicita.

## Comportamento

Quando una spesa viene spostata:

1. mostrare immediatamente la nuova posizione;
2. chiamare l’API;
3. mostrare un indicatore di salvataggio;
4. in caso di successo, confermare con toast;
5. in caso di errore, ripristinare la posizione precedente;
6. mostrare un messaggio comprensibile.

## Conferma

Non è necessario chiedere conferma per ogni trascinamento.

Mostrare però chiaramente:

```text
Scadenza spostata al 24 luglio 2026.
```

## Accessibilità

Fornire un’alternativa al drag and drop:

* pulsante “Cambia data”;
* form data accessibile da tastiera.

Non rendere il trascinamento l’unico modo per modificare la data.

---

# Cambio rapido di stato

Dal calendario consentire:

```text
Segna come completata
Segna come pianificata
Annulla spesa
```

Usare:

```http
PATCH /api/v1/expenses/:id/status
```

Dopo il cambio stato aggiornare:

* evento;
* stile;
* badge;
* eventuali riepiloghi locali.

Non ricaricare necessariamente tutto il calendario se è sufficiente aggiornare un evento.

---

# Eliminazione

Utilizzare l’eliminazione soft già implementata:

```http
DELETE /api/v1/expenses/:id
```

Richiedere conferma.

Dopo l’eliminazione:

* rimuovere l’evento;
* mostrare toast;
* mantenere vista, data e filtri.

---

# Frontend Angular

Creare:

```text
CalendarPageComponent
```

Componenti indicativi:

```text
CalendarToolbarComponent
CalendarFiltersComponent
CalendarLegendComponent
CalendarExpenseEventComponent
CalendarExpenseDetailComponent
CalendarListViewComponent
OverdueExpensesPanelComponent
```

Riutilizzare:

```text
ExpenseFormComponent
QuickExpenseModalComponent
ExpenseDetailComponent
CategoryBadgeComponent
LabelBadgeComponent
ExpenseStatusBadgeComponent
PaymentMethodBadgeComponent
ConfirmDialogComponent
LoadingSkeletonComponent
EmptyStateComponent
```

Non creare componenti duplicati con funzioni equivalenti.

---

# Struttura della pagina

Ordine consigliato:

1. header;
2. toolbar calendario;
3. filtri collassabili;
4. legenda;
5. calendario;
6. pannello scadenze;
7. dettaglio o modale.

Header:

```text
Calendario
Visualizza e gestisci le spese pianificate
```

Azioni:

```text
Nuova spesa
Oggi
```

---

# Toolbar calendario

Mostrare:

* periodo corrente;
* precedente;
* successivo;
* oggi;
* selettore vista;
* nuova spesa;
* filtri.

Esempio:

```text
‹
Luglio 2026
›

Oggi
Mese
Settimana
Elenco
```

La toolbar deve essere responsive.

Su mobile:

* ridurre il testo;
* evitare controlli su una sola riga troppo larga;
* consentire la navigazione facilmente.

---

# Filtri calendario

Implementare filtri per:

* stato;
* categoria;
* etichette;
* metodo di pagamento;
* ricerca.

Usare `ng-select` se già introdotto e funzionante.

Non installare un secondo componente select.

La sezione può essere collassabile tramite accordion, coerentemente con la pagina Spese.

Quando chiusa mostrare:

* numero filtri attivi;
* breve riepilogo;
* azione reset.

I filtri devono essere sincronizzati con i query parameter.

---

# Legenda

Mostrare una legenda per:

* pianificata;
* completata;
* annullata;
* scaduta;
* evento con orario;
* evento giornaliero.

La legenda non deve affidarsi soltanto ai colori.

Esempio:

```text
○ Pianificata
✓ Completata
× Annullata
! Scaduta
```

---

# Aspetto degli eventi

Ogni evento deve mostrare almeno:

* descrizione;
* importo;
* stato visivo.

Quando lo spazio lo consente mostrare anche:

* categoria;
* ora;
* icona.

Su vista mensile gli eventi devono essere compatti.

Esempio:

```text
09:00 · 45,00 €
Visita medica
```

Oppure per evento giornaliero:

```text
120,00 € · Assicurazione auto
```

Usare il colore della categoria come accento.

Non usare necessariamente il colore pieno come sfondo, perché alcune categorie possono avere colori chiari.

Preferire:

* bordo;
* indicatore laterale;
* icona;
* badge.

Garantire contrasto leggibile.

---

# Vista mensile

La vista mensile deve:

* iniziare di lunedì;
* mostrare i giorni del mese;
* distinguere i giorni fuori mese;
* evidenziare oggi;
* mostrare eventi;
* permettere navigazione;
* mostrare un indicatore “altri” quando gli eventi sono numerosi;
* aprire l’elenco completo del giorno.

Cliccando su un giorno vuoto:

* aprire il form nuova spesa;
* precompilare la data.

---

# Vista settimanale

La vista settimanale deve:

* mostrare giorni e orari;
* distinguere eventi giornalieri ed eventi con ora;
* consentire selezione di uno slot;
* precompilare data e ora;
* mostrare eventi pianificati;
* consentire drag and drop, se implementato.

Le spese senza ora devono apparire nell’area giornaliera.

---

# Vista elenco

La vista elenco deve essere pienamente utilizzabile anche senza la libreria calendario.

Raggruppare gli eventi per:

```text
Oggi
Domani
Questa settimana
Più avanti
Scadute
```

Oppure per data.

Ogni elemento deve mostrare:

* data;
* ora;
* descrizione;
* importo;
* categoria;
* stato;
* azioni.

Questa vista deve essere particolarmente curata su mobile.

---

# Pannello scadenze

Creare opzionalmente:

```text
OverdueExpensesPanelComponent
```

Mostrare spese:

```text
PLANNED
expenseDate < oggi
```

Ordinare dalla più vecchia.

Azioni rapide:

* completa;
* cambia data;
* annulla;
* apri dettaglio.

Non mostrare notifiche automatiche.

Il pannello può essere:

* una card laterale;
* una sezione sopra il calendario;
* un accordion.

---

# Servizio Angular

Creare:

```text
CalendarService
```

Responsabilità:

* recupero eventi per intervallo;
* mapping della query;
* gestione dei filtri;
* eventuale adattamento alla libreria calendario.

Le modifiche alle spese devono continuare a utilizzare:

```text
ExpenseService
```

Non duplicare metodi CRUD in `CalendarService`.

È possibile creare:

```text
CalendarStore
```

basato su Angular Signals.

Stato indicativo:

```text
currentDate
currentView
visibleRange
events
filters
loading
error
selectedExpense
isExpenseFormOpen
isDetailOpen
activeFilterCount
```

Non introdurre NgRx.

---

# Caricamento degli eventi

Il calendario deve caricare soltanto l’intervallo visibile.

Esempio:

* vista mensile: intervallo mostrato dalla griglia;
* vista settimanale: settimana corrente;
* vista elenco: intervallo definito.

Non caricare tutte le spese dell’utente.

Quando cambia:

* periodo;
* vista;
* filtro;

annullare richieste obsolete tramite:

* `switchMap`;
* meccanismo equivalente.

Evitare condizioni di gara.

---

# Cache

È consentita una cache leggera per intervallo e filtri, purché:

* venga invalidata dopo modifiche;
* non mostri dati di un utente precedente;
* non complichi eccessivamente la fase.

Non introdurre un sistema di caching complesso.

---

# Query parameter frontend

Supportare almeno:

```text
view
date
status
categoryId
labelIds
paymentMethod
search
```

Esempio:

```text
/calendar?view=week&date=2026-07-16&status=PLANNED
```

Regole:

* ricaricando la pagina, vista e periodo devono restare;
* avanti e indietro del browser devono funzionare;
* non inserire valori vuoti;
* il reset filtri deve mantenere vista e data;
* evitare loop tra router e calendario;
* evitare richieste duplicate.

---

# Modelli TypeScript

Definire almeno:

```text
CalendarView
CalendarEvent
CalendarExpenseEvent
CalendarEventCategory
CalendarEventLabel
CalendarQueryParams
CalendarFilters
CalendarDateRange
CalendarSelection
CalendarDropChange
```

Non utilizzare `any`.

Separare:

* risposta API;
* modello applicativo;
* oggetto richiesto dalla libreria calendario;
* stato UI.

---

# Formattazione

Usare:

```text
it-IT
EUR
Europe/Rome
```

Esempi:

```text
16 luglio 2026
gio 16
14:30
1.250,50 €
```

Riutilizzare utility già esistenti per:

* valuta;
* data;
* giorni mancanti;
* stato.

Non duplicare formattatori.

---

# Loading state

Durante il caricamento:

* mantenere visibile la struttura del calendario;
* mostrare overlay leggero o skeleton;
* non azzerare inutilmente il periodo;
* evitare lampeggi;
* disabilitare operazioni incoerenti.

Per la prima apertura è possibile mostrare uno skeleton completo.

---

# Empty state

Se non esistono eventi nell’intervallo:

```text
Non ci sono spese nel periodo selezionato.
```

Azioni:

```text
Aggiungi una spesa
Azzera i filtri
```

Se esistono eventi ma i filtri non producono risultati:

```text
Nessuna spesa corrisponde ai filtri applicati.
```

Non mostrare un calendario tecnicamente rotto o senza spiegazione.

---

# Gestione errori

Gestire:

```text
400 intervallo o filtri non validi
401 utente non autenticato
404 spesa non trovata
409 aggiornamento non applicabile
500 errore interno
```

Per un errore di caricamento mostrare:

```text
Non è stato possibile caricare il calendario.
```

Azione:

```text
Riprova
```

Per un errore durante il drag and drop:

```text
Non è stato possibile cambiare la data. La modifica è stata annullata.
```

Ripristinare la posizione precedente.

---

# Accessibilità

Garantire:

* navigazione da tastiera;
* focus visibile;
* pulsanti con label;
* eventi selezionabili da tastiera;
* alternativa al drag and drop;
* legenda testuale;
* stato non indicato soltanto dal colore;
* calendario comprensibile agli screen reader;
* vista elenco alternativa;
* modali con focus trap;
* annunci degli aggiornamenti importanti.

Se la libreria calendario non garantisce sufficiente accessibilità:

* integrare attributi ARIA;
* assicurare che la vista elenco copra tutte le operazioni fondamentali.

---

# Responsive design

## Desktop

* calendario completo;
* toolbar su una riga;
* filtri collassabili;
* eventuale pannello laterale;
* vista mensile o settimanale.

## Tablet

* toolbar su più righe;
* filtri in griglia;
* calendario a larghezza completa;
* dettaglio in offcanvas.

## Mobile

* vista elenco favorita;
* vista mensile semplificata;
* toolbar compatta;
* filtri collassabili;
* dettaglio e form quasi a schermo intero;
* pulsante nuova spesa sempre raggiungibile;
* nessuna interazione dipendente unicamente dal drag and drop.

Mantenere:

* Reddit Sans;
* palette pastello;
* tema light;
* stili già introdotti nella Fase 4.5.

---

# Test backend

Scrivere test almeno per:

## Intervalli

* intervallo valido;
* `start` mancante;
* `end` mancante;
* data non valida;
* `start` successivo a `end`;
* intervallo troppo ampio;
* convenzione end esclusivo.

## Ownership

* utente vede soltanto le proprie spese;
* esclusione spese altrui;
* esclusione soft deleted.

## Stati

* filtro pianificate;
* filtro completate;
* filtro annullate;
* più stati;
* spesa pianificata scaduta;
* calcolo `isOverdue`.

## Filtri

* categoria;
* etichette;
* metodo di pagamento;
* ricerca;
* combinazione filtri.

## Mapping

* evento giornaliero senza ora;
* evento con ora;
* categoria;
* etichette;
* importo serializzato;
* ordinamento.

---

# Test frontend

Scrivere test almeno per:

* caricamento pagina;
* vista mese predefinita;
* cambio vista;
* navigazione precedente;
* navigazione successiva;
* oggi;
* sincronizzazione query parameter;
* caricamento intervallo visibile;
* applicazione filtri;
* reset filtri;
* conteggio filtri attivi;
* rendering evento pianificato;
* rendering completato;
* rendering annullato;
* rendering scaduto;
* apertura dettaglio;
* creazione cliccando su una data;
* precompilazione data;
* precompilazione ora;
* modifica spesa;
* cambio stato;
* eliminazione;
* drag and drop riuscito;
* rollback drag and drop;
* alternativa “Cambia data”;
* vista elenco;
* empty state;
* loading;
* errore e retry;
* accessibilità essenziale.

Se il drag and drop non viene implementato, documentare la decisione e testare la modifica data tramite form.

---

# Verifica manuale

Al termine verificare almeno:

1. effettuare il login;
2. aprire il calendario;
3. verificare il mese corrente;
4. cambiare mese;
5. cambiare settimana;
6. tornare a oggi;
7. passare alla vista elenco;
8. visualizzare spese pianificate;
9. visualizzare spese completate;
10. attivare le annullate tramite filtro;
11. applicare filtro categoria;
12. applicare filtro etichette;
13. cercare una spesa;
14. cliccare su un giorno vuoto;
15. creare una spesa con data precompilata;
16. aprire il dettaglio;
17. modificare la data;
18. segnare una spesa come completata;
19. annullare una spesa;
20. eliminare una spesa;
21. verificare una spesa pianificata scaduta;
22. spostare una spesa tramite drag and drop, se implementato;
23. verificare rollback in caso di errore;
24. verificare la vista mobile;
25. accedere con un secondo utente;
26. confermare l’isolamento dei dati.

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
14. verificare manualmente il calendario;
15. verificare desktop, tablet e mobile;
16. correggere tutti gli errori trovati.

Eseguire i comandi separatamente se l’ambiente presenta problemi di inoltro di stdout o stderr.

Non dichiarare superate verifiche non realmente eseguite.

---

# Vincoli

* Non implementare notifiche.
* Non implementare promemoria automatici.
* Non implementare ricorrenze.
* Non duplicare il modello Expense.
* Non creare un modello CalendarEvent persistente.
* Non duplicare la business logic delle spese.
* Non caricare tutte le spese dell’utente.
* Non accettare `userId` dal client.
* Non usare `any`.
* Non disabilitare TypeScript strict.
* Non forzare peer dependency.
* Non usare `--legacy-peer-deps`.
* Non usare `--force`.
* Non introdurre NgRx.
* Non installare più librerie calendario.
* Non rendere il drag and drop obbligatorio.
* Non affidare informazioni soltanto ai colori.
* Non sostituire i componenti funzionanti delle fasi precedenti.
* Non lasciare TODO bloccanti.
* Non ignorare errori di test, lint o build.

---

# Output finale richiesto all’agente

Concludere con un riepilogo contenente:

* funzionalità implementate;
* libreria calendario utilizzata;
* plugin installati;
* motivazioni di eventuali funzionalità non implementate;
* endpoint creati;
* DTO e mapper aggiunti;
* strategia per date e fuso orario;
* viste disponibili;
* filtri disponibili;
* comportamento del drag and drop;
* alternativa accessibile al trascinamento;
* componenti Angular creati o riutilizzati;
* test realmente eseguiti;
* build realmente eseguite;
* verifica Swagger;
* verifica Docker;
* problemi corretti;
* eventuali limitazioni residue reali.

Non limitarsi al riepilogo: implementare prima integralmente la fase.
