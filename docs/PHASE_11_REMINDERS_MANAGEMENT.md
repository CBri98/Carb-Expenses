# PHASE_11_REMINDERS_MANAGEMENT.md

## Obiettivo

Implementare la **Fase 11 — Gestione centralizzata dei promemoria** dell’applicazione descritta in `AGENTS.md`.

Al termine della fase, l’utente autenticato deve poter:

* visualizzare in un’unica pagina tutti i promemoria associati alle proprie spese;
* distinguere promemoria attivi, imminenti, processati, annullati e non più validi;
* ricercare un promemoria tramite la spesa collegata;
* filtrare per stato, tipo, periodo, categoria e origine;
* ordinare i promemoria;
* aprire direttamente la spesa collegata;
* modificare un promemoria non ancora processato;
* disattivare o annullare un promemoria;
* riattivare un promemoria ancora temporalmente valido;
* rimuovere definitivamente soltanto i promemoria che possono essere eliminati in sicurezza;
* selezionare più promemoria;
* eseguire operazioni massive;
* distinguere i promemoria creati manualmente da quelli generati da una ricorrenza;
* consultare un riepilogo delle prossime scadenze;
* mantenere lo storico delle notifiche già generate.

Questa fase deve estendere il sistema di promemoria introdotto nella Fase 8.

Non creare un secondo modello indipendente di promemoria.

Non duplicare:

* scheduler;
* notifiche;
* calcolo di `scheduledAt`;
* ownership;
* modifica della spesa;
* gestione delle ricorrenze.

Implementare direttamente il codice nel repository.

Non limitarsi a descrivere la soluzione.

---

# Roadmap aggiornata

La parte finale della roadmap deve essere:

```text
Fase 10 — Impostazioni e personalizzazione
Fase 11 — Gestione centralizzata dei promemoria
Fase 12 — Polish, testing e release
```

Il documento finale di rilascio deve essere:

```text
docs/PHASE_12_POLISH_RELEASE.md
```

Non eseguire la Fase 12 durante questa fase.

---

# Operazioni preliminari

Prima di modificare il codice:

1. leggere integralmente `AGENTS.md`;
2. leggere integralmente `docs/PHASE_11_REMINDERS_MANAGEMENT.md`;
3. leggere le parti rilevanti di:

   * `docs/PHASE_8_NOTIFICATIONS.md`;
   * `docs/PHASE_9_RECURRENCES.md`;
   * `docs/PHASE_10_SETTINGS.md`;
4. analizzare lo stato reale del repository;
5. eseguire `git status` e `git diff`;
6. verificare che siano realmente presenti:

   * `ExpenseReminder`;
   * notifiche;
   * scheduler;
   * promemoria nel form spesa;
   * promemoria nel dettaglio spesa;
   * ricorrenze;
   * template promemoria delle ricorrenze;
   * pagina impostazioni;
7. verificare i campi reali del modello Prisma;
8. verificare gli endpoint già implementati;
9. riutilizzare mapper, DTO e service esistenti;
10. non creare endpoint duplicati;
11. correggere soltanto problemi realmente bloccanti;
12. evitare refactoring non necessari;
13. non ricominciare da zero.

Se l’implementazione delle fasi precedenti differisce dalla specifica, adattare questa fase allo stato reale del repository mantenendo gli stessi obiettivi funzionali.

---

# Ambito della fase

Implementare:

* pagina globale `/reminders`;
* endpoint globale paginato dei promemoria;
* riepilogo dei promemoria;
* ricerca;
* filtri;
* ordinamento;
* paginazione server-side;
* dettaglio sintetico;
* collegamento alla spesa;
* collegamento alla ricorrenza di origine;
* modifica di promemoria non processati;
* annullamento;
* riattivazione;
* eliminazione sicura;
* selezione multipla;
* operazioni massive;
* distinzione tra origine manuale e ricorrente;
* empty state;
* loading state;
* error state;
* sincronizzazione con query parameter;
* aggiornamento del conteggio dopo operazioni;
* test backend;
* test frontend;
* Swagger;
* aggiornamento README.

Non implementare:

* nuove notifiche push;
* email;
* SMS;
* WebSocket;
* nuove frequenze di ricorrenza;
* un secondo scheduler;
* modifica massiva delle spese;
* modifica retroattiva delle notifiche già generate;
* eliminazione fisica indiscriminata dello storico;
* promemoria senza una spesa collegata;
* promemoria condivisi tra utenti.

---

# Distinzione tra promemoria e notifiche

La pagina Promemoria non deve duplicare la pagina Notifiche.

## Promemoria

Rappresenta una regola temporale associata a una spesa.

Esempio:

```text
Avvisa 3 giorni prima della rata auto.
```

Contiene informazioni come:

* tipo;
* offset;
* data di esecuzione;
* stato;
* spesa collegata;
* origine;
* eventuale elaborazione.

## Notifica

Rappresenta il messaggio prodotto quando il promemoria viene eseguito.

Esempio:

```text
La rata auto è prevista tra 3 giorni.
```

La pagina `/reminders` gestisce le regole.

La pagina `/notifications` gestisce i messaggi già generati.

L’annullamento di un promemoria non deve eliminare le notifiche storiche già prodotte.

---

# Stati applicativi dei promemoria

Se il modello esistente dispone già di:

```text
isActive
processedAt
cancelledAt
scheduledAt
```

non aggiungere necessariamente un nuovo enum Prisma.

È possibile derivare uno stato applicativo.

Implementare almeno:

```text
ACTIVE
UPCOMING
DUE
PROCESSED
CANCELLED
EXPIRED
INVALID
```

## ACTIVE

Promemoria attivo, non processato e programmato nel futuro.

## UPCOMING

Sottoinsieme visivo di `ACTIVE`, previsto entro una finestra breve, per esempio 7 giorni.

Non è obbligatorio salvarlo nel database.

## DUE

Promemoria attivo, non processato e con:

```text
scheduledAt <= now
```

Potrebbe essere in attesa del prossimo ciclo scheduler.

## PROCESSED

Promemoria che ha già prodotto una notifica o è stato elaborato.

## CANCELLED

Promemoria disattivato esplicitamente.

## EXPIRED

Promemoria non processato la cui data è ormai trascorsa e che non può essere riattivato secondo le regole applicative.

Usarlo soltanto se distinto da `DUE` nell’implementazione reale.

## INVALID

Promemoria non più eseguibile perché:

* la spesa è completata;
* la spesa è annullata;
* la spesa è eliminata;
* la data del promemoria non è più coerente;
* la spesa collegata non è disponibile.

Non memorizzare stati derivabili se non necessario.

---

# Origine del promemoria

Distinguere almeno:

```text
MANUAL
RECURRENCE
SYSTEM
```

## MANUAL

Creato manualmente dall’utente nel form o dettaglio della spesa.

## RECURRENCE

Creato automaticamente a partire da un template di una ricorrenza.

## SYSTEM

Creato automaticamente dal sistema, se l’implementazione dispone di promemoria tecnici come il giorno stesso.

Se l’origine è già memorizzata, riutilizzarla.

Se non è memorizzata e non può essere derivata con certezza, valutare una migrazione aggiungendo:

```prisma
enum ReminderSource {
  MANUAL
  RECURRENCE
  SYSTEM
}
```

e nel modello:

```prisma
source ReminderSource @default(MANUAL)
```

Non aggiungere il campo se l’informazione può essere derivata in maniera affidabile e stabile.

Esempio di derivazione possibile:

```text
expense.generatedByRecurrence = true
```

Questa derivazione però identifica l’origine della spesa, non necessariamente chi ha creato il promemoria.

Preferire un campo esplicito se è necessario distinguere correttamente:

* promemoria copiato dalla ricorrenza;
* promemoria aggiunto manualmente a una spesa ricorrente.

---

# Modello Prisma

Riutilizzare il modello `ExpenseReminder` già esistente.

Struttura indicativa di riferimento:

```prisma
model ExpenseReminder {
  id            String       @id @default(uuid())
  userId        String       @map("user_id")
  expenseId     String       @map("expense_id")
  type          ReminderType
  source        ReminderSource @default(MANUAL)
  offsetMinutes Int?         @map("offset_minutes")
  scheduledAt   DateTime     @map("scheduled_at")
  isActive      Boolean      @default(true) @map("is_active")
  processedAt   DateTime?    @map("processed_at")
  cancelledAt   DateTime?    @map("cancelled_at")
  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")

  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  expense       Expense        @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  notifications Notification[]

  @@index([userId, scheduledAt])
  @@index([userId, isActive])
  @@index([expenseId])
  @@index([processedAt])
  @@map("expense_reminders")
}
```

Adattare:

* tipi UUID;
* nomi;
* relazioni;
* enum;
* indici;

allo schema reale.

Non ricreare il modello.

---

# Eventuale migrazione

Creare una nuova migrazione soltanto se necessaria.

Possibili motivazioni:

* aggiunta di `ReminderSource`;
* aggiunta di indici necessari alla pagina globale;
* aggiunta di un campo `deletedAt` se l’architettura richiede soft delete distinta dalla cancellazione;
* correzione di vincoli mancanti.

Nome indicativo:

```text
extend_expense_reminder_management
```

Non modificare migrazioni già applicate.

Non usare `prisma db push` come soluzione finale.

Eseguire:

```text
prisma format
prisma validate
prisma generate
```

---

# Eliminazione, annullamento e storico

Distinguere chiaramente le operazioni.

## Annullamento

È l’operazione normale.

Comportamento:

```text
isActive = false
cancelledAt = now
```

Il record resta nel database.

Usare per:

* promemoria futuri;
* promemoria generati da ricorrenza;
* promemoria collegati a notifiche;
* promemoria che devono mantenere storico.

## Eliminazione definitiva

Consentirla soltanto quando il promemoria:

* non è stato processato;
* non ha notifiche collegate;
* non è necessario per audit o storico;
* appartiene all’utente;
* non proviene da un template ricorrente che deve conservarne traccia.

Se queste condizioni non sono soddisfatte:

* restituire `409`;
* proporre l’annullamento;
* non eliminare in cascata notifiche.

## Promemoria processato

Un promemoria processato non deve essere modificabile o eliminabile fisicamente.

Può essere:

* consultato;
* filtrato;
* collegato alla notifica;
* eventualmente archiviato visivamente tramite filtri.

---

# Riattivazione

Consentire la riattivazione soltanto quando:

* il promemoria non è processato;
* la spesa è `PLANNED`;
* la spesa non è eliminata;
* `scheduledAt` è nel futuro;
* la data resta coerente con la spesa;
* non esiste un promemoria attivo equivalente.

Comportamento:

```text
isActive = true
cancelledAt = null
```

Se il promemoria è ormai nel passato:

* non riattivarlo;
* richiedere una nuova data;
* oppure creare un nuovo promemoria.

Non spostare automaticamente la data senza informare l’utente.

---

# Modifica

Consentire la modifica soltanto per promemoria:

* non processati;
* collegati a una spesa `PLANNED`;
* non eliminati;
* appartenenti all’utente.

Campi modificabili:

```text
type
scheduledAt
isActive
```

Per i preset:

* ricalcolare `scheduledAt`;
* usare data e ora della spesa;
* usare il fuso `Europe/Rome`.

Per `CUSTOM`:

* richiedere data e ora;
* impedire una data successiva alla spesa;
* impedire una data nel passato.

Non consentire:

* cambio utente;
* cambio spesa;
* cambio origine;
* modifica di `processedAt`;
* modifica delle notifiche collegate.

---

# Effetti della modifica sulla ricorrenza

Modificare un singolo promemoria generato da una ricorrenza non deve modificare:

* il template della ricorrenza;
* i promemoria delle altre spese;
* le occorrenze future.

Mostrare un’informazione:

```text
Questa modifica riguarda soltanto il promemoria della spesa selezionata.
```

Per cambiare il comportamento delle occorrenze future, l’utente deve aprire la ricorrenza.

Aggiungere un collegamento:

```text
Apri ricorrenza
```

quando disponibile.

---

# Backend NestJS

Estendere preferibilmente:

```text
NotificationsModule
```

oppure creare:

```text
RemindersModule
```

La scelta deve dipendere dall’architettura reale.

Creare un modulo separato è consigliato se:

* `NotificationsModule` è già molto grande;
* i promemoria possiedono controller e query autonome;
* migliora la separazione delle responsabilità.

Struttura indicativa:

```text
apps/backend/src/reminders/
├── dto/
│   ├── reminder-query.dto.ts
│   ├── update-reminder.dto.ts
│   ├── reminder-bulk-action.dto.ts
│   └── reminder-summary-query.dto.ts
├── reminders.controller.ts
├── reminders.service.ts
├── reminders.mapper.ts
├── reminders.types.ts
├── reminders.utils.ts
├── reminders.module.ts
└── reminders.service.spec.ts
```

Riutilizzare:

```text
NotificationRemindersService
ClockService
ExpenseService
```

dove appropriato.

Non duplicare il calcolo di `scheduledAt`.

---

# API globale dei promemoria

Utilizzare il prefisso:

```text
/api/v1/reminders
```

Tutti gli endpoint devono essere autenticati.

Implementare almeno:

```http
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

Mantenere anche gli endpoint contestuali esistenti:

```http
GET    /api/v1/expenses/:expenseId/reminders
POST   /api/v1/expenses/:expenseId/reminders
PATCH  /api/v1/expenses/:expenseId/reminders/:reminderId
DELETE /api/v1/expenses/:expenseId/reminders/:reminderId
```

Gli endpoint globali e contestuali devono delegare alla stessa business logic.

Non creare comportamenti diversi.

---

# Lista globale

Endpoint:

```http
GET /api/v1/reminders
```

Query parameter:

```text
page
pageSize
search
status
type
source
expenseStatus
categoryId
recurrenceRuleId
scheduledFrom
scheduledTo
expenseDateFrom
expenseDateTo
sortBy
sortDirection
```

Default:

```text
page=1
pageSize=20
sortBy=scheduledAt
sortDirection=asc
```

Limite massimo:

```text
pageSize=100
```

---

# Ricerca

Il parametro:

```text
search
```

deve cercare almeno in:

* descrizione della spesa;
* esercente;
* nome della categoria;
* nome della ricorrenza, se presente.

La ricerca deve:

* essere server-side;
* essere normalizzata;
* rispettare ownership;
* escludere soft deleted secondo le regole;
* avere una lunghezza massima ragionevole.

Non caricare tutti i promemoria nel frontend.

---

# Filtri

## Stato promemoria

Supportare:

```text
ACTIVE
UPCOMING
DUE
PROCESSED
CANCELLED
INVALID
```

Se alcuni stati sono derivati, tradurli in condizioni database nel service.

## Tipo

Supportare:

```text
SAME_DAY
ONE_DAY_BEFORE
THREE_DAYS_BEFORE
SEVEN_DAYS_BEFORE
CUSTOM
```

Adattare agli enum realmente presenti.

## Origine

Supportare:

```text
MANUAL
RECURRENCE
SYSTEM
```

## Stato spesa

Supportare:

```text
PLANNED
COMPLETED
CANCELLED
```

## Categoria

```text
categoryId
```

## Ricorrenza

```text
recurrenceRuleId
```

## Data promemoria

```text
scheduledFrom
scheduledTo
```

## Data spesa

```text
expenseDateFrom
expenseDateTo
```

---

# Ordinamento

Supportare almeno:

```text
scheduledAt
createdAt
updatedAt
expenseDate
expenseDescription
status
```

Ordinamenti predefiniti:

* attivi e imminenti: `scheduledAt asc`;
* processati e annullati: `scheduledAt desc`.

Il client non deve poter specificare un nome colonna SQL arbitrario.

Usare una whitelist.

---

# Risposta lista

Esempio indicativo:

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "THREE_DAYS_BEFORE",
      "source": "MANUAL",
      "status": "ACTIVE",
      "scheduledAt": "2026-07-20T07:00:00.000Z",
      "scheduledAtLocal": "2026-07-20T09:00:00+02:00",
      "isActive": true,
      "processedAt": null,
      "cancelledAt": null,
      "createdAt": "2026-07-10T15:00:00.000Z",
      "expense": {
        "id": "uuid",
        "description": "Assicurazione auto",
        "amount": "320.00",
        "expenseDate": "2026-07-23",
        "expenseTime": null,
        "status": "PLANNED",
        "category": {
          "id": "uuid",
          "name": "Auto",
          "color": "#9BAFD6",
          "icon": "car-front"
        },
        "recurrence": null
      },
      "notification": null,
      "allowedActions": {
        "canEdit": true,
        "canCancel": true,
        "canReactivate": false,
        "canDelete": true
      }
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 12,
    "totalPages": 1
  }
}
```

Adattare al wrapper API standard.

Non restituire oggetti Prisma direttamente.

---

# Allowed actions

Il backend deve determinare le azioni consentite.

Restituire opzionalmente:

```text
canEdit
canCancel
canReactivate
canDelete
```

Il frontend può usare questi valori per disabilitare i pulsanti.

La sicurezza deve comunque essere verificata nuovamente nel backend.

Non affidarsi al solo frontend.

---

# Riepilogo

Endpoint:

```http
GET /api/v1/reminders/summary
```

Restituire almeno:

```json
{
  "activeCount": 8,
  "upcomingCount": 4,
  "dueCount": 1,
  "processedCount": 22,
  "cancelledCount": 3,
  "nextReminder": {
    "id": "uuid",
    "scheduledAt": "2026-07-20T07:00:00.000Z",
    "expenseId": "uuid",
    "expenseDescription": "Assicurazione auto"
  }
}
```

Definire `upcoming` come una finestra configurabile o fissa.

Valore consigliato:

```text
7 giorni
```

È possibile accettare:

```text
upcomingDays
```

con intervallo limitato, per esempio 1–30.

Non calcolare il riepilogo recuperando tutta la lista.

Usare query aggregate.

---

# Dettaglio promemoria

Endpoint:

```http
GET /api/v1/reminders/:id
```

Restituire:

* dati promemoria;
* stato derivato;
* spesa;
* categoria;
* etichette;
* ricorrenza, se presente;
* notifica generata, se presente;
* azioni consentite.

Restituire `404` per:

* promemoria inesistente;
* promemoria di un altro utente.

Non rivelare l’esistenza di dati altrui.

---

# Modifica promemoria

Endpoint:

```http
PATCH /api/v1/reminders/:id
```

Payload preset:

```json
{
  "type": "SEVEN_DAYS_BEFORE"
}
```

Payload custom:

```json
{
  "type": "CUSTOM",
  "scheduledAt": "2026-07-19T09:00:00+02:00"
}
```

Dopo la modifica:

* ricalcolare i campi;
* verificare duplicati;
* mantenere l’origine;
* aggiornare `updatedAt`;
* non modificare notifiche già create;
* restituire il reminder aggiornato.

---

# Annullamento

Endpoint:

```http
PATCH /api/v1/reminders/:id/cancel
```

L’operazione deve essere idempotente.

Se già annullato:

* restituire lo stato corrente;
* non generare errore inutile.

Non annullare:

* notifiche già prodotte;
* altri promemoria della spesa;
* template della ricorrenza.

---

# Riattivazione

Endpoint:

```http
PATCH /api/v1/reminders/:id/reactivate
```

Restituire:

```text
409 Conflict
```

quando:

* data già trascorsa;
* spesa non pianificata;
* duplicato equivalente;
* promemoria processato;
* spesa eliminata.

Il messaggio deve spiegare l’azione necessaria.

Esempio:

```text
Il promemoria non può essere riattivato perché la data prevista è già trascorsa. Modifica prima la data.
```

---

# Eliminazione singola

Endpoint:

```http
DELETE /api/v1/reminders/:id
```

Risposta possibile:

```text
204 No Content
```

oppure wrapper standard.

Restituire `409` se:

* processato;
* collegato a notifiche;
* necessario per storico;
* generato da ricorrenza e non eliminabile secondo le regole.

In questi casi suggerire l’annullamento.

---

# Operazioni massive

Consentire la selezione di massimo:

```text
100 promemoria
```

per richiesta.

Non accettare liste illimitate.

DTO indicativo:

```json
{
  "ids": [
    "uuid-1",
    "uuid-2"
  ]
}
```

Validare:

* array;
* UUID;
* nessun duplicato;
* massimo 100;
* almeno un ID.

---

# Annullamento massivo

Endpoint:

```http
PATCH /api/v1/reminders/bulk/cancel
```

Comportamento:

* annullare quelli consentiti;
* ignorare quelli già annullati;
* non annullare dati altrui;
* restituire risultato dettagliato.

Esempio:

```json
{
  "requestedCount": 5,
  "updatedCount": 4,
  "skippedCount": 1,
  "errors": [
    {
      "id": "uuid",
      "reason": "ALREADY_PROCESSED"
    }
  ]
}
```

Non fallire l’intera operazione per un singolo elemento non valido, salvo ownership o payload completamente invalido.

---

# Riattivazione massiva

Endpoint:

```http
PATCH /api/v1/reminders/bulk/reactivate
```

Riattivare soltanto gli elementi validi.

Restituire un risultato per elemento o riepilogo con errori.

Non modificare automaticamente date passate.

---

# Eliminazione massiva

Endpoint:

```http
DELETE /api/v1/reminders/bulk
```

Body:

```json
{
  "ids": ["uuid-1", "uuid-2"]
}
```

Eliminare soltanto quelli realmente eliminabili.

Per gli altri:

* mantenerli;
* restituire motivazione;
* proporre annullamento nel frontend.

---

# Ownership e sicurezza

Ogni query deve includere:

```text
userId = utente autenticato
```

Un utente non deve poter:

* visualizzare promemoria altrui;
* conoscere il conteggio altrui;
* modificare promemoria altrui;
* annullare promemoria altrui;
* eliminare promemoria altrui;
* usare ID altrui in operazioni massive.

Non accettare `userId` dal client.

Per operazioni massive:

* verificare che ogni record appartenga all’utente;
* non restituire dettagli su record altrui;
* trattarli come non trovati.

---

# DTO backend

Creare almeno:

```text
ReminderQueryDto
ReminderSummaryQueryDto
UpdateReminderDto
ReminderBulkActionDto
```

Validazioni:

## Page

```text
intero
minimo 1
```

## Page size

```text
intero
minimo 1
massimo 100
```

## Search

```text
stringa
trim
massimo 150 caratteri
```

## Date

```text
ISO 8601
intervallo coerente
```

## Status, type, source

```text
enum validi
```

## IDs massivi

```text
UUID
1–100 elementi
nessun duplicato
```

---

# Mapper backend

Creare o estendere:

```text
RemindersMapper
```

Responsabilità:

* stato derivato;
* serializzazione date;
* dati della spesa;
* categoria;
* etichette;
* ricorrenza;
* notifica collegata;
* azioni consentite;
* importo come stringa;
* origine.

Non esporre:

* deduplication key;
* campi scheduler interni;
* dettagli Prisma;
* dati utente non necessari.

---

# Prestazioni backend

La pagina deve utilizzare:

* paginazione server-side;
* filtri database;
* conteggi aggregati;
* select mirati;
* indici.

Non caricare:

* tutte le notifiche;
* tutte le spese;
* tutte le ricorrenze;
* tutti i promemoria;

per costruire la risposta.

Verificare indici almeno su:

```text
userId
scheduledAt
isActive
processedAt
cancelledAt
expenseId
source
```

Aggiungere indici soltanto se necessari.

Non creare indici ridondanti.

---

# Fuso orario

Usare:

```text
Europe/Rome
```

Il backend deve mantenere:

* `scheduledAt` come timestamp UTC;
* date della spesa come date locali.

Il frontend deve mostrare:

```text
20 luglio 2026, 09:00
```

Non mostrare direttamente UTC all’utente.

Riutilizzare:

```text
ClockService
date utilities
timezone utilities
```

Non usare `new Date()` indiscriminatamente nella business logic.

---

# Scheduler

La pagina globale non deve modificare il funzionamento dello scheduler.

Verificare però che lo scheduler:

* ignori promemoria annullati;
* ignori promemoria eliminati;
* ignori promemoria processati;
* elabori promemoria riattivati validi;
* mantenga idempotenza;
* non produca duplicati dopo modifiche.

Aggiungere test di regressione per questi casi.

---

# Swagger

Documentare:

* endpoint globali;
* filtri;
* stati;
* origine;
* paginazione;
* ordinamento;
* operazioni massive;
* condizioni di modifica;
* condizioni di cancellazione;
* condizioni di eliminazione;
* errori;
* ownership;
* timezone.

Documentare almeno:

```text
200
204
400
401
404
409
500
```

---

# Frontend Angular

Creare la route:

```text
/reminders
```

La route deve essere:

* protetta da auth guard;
* lazy loaded, se coerente;
* collegata alla sidebar.

Aggiungere alla sidebar:

```text
Promemoria
```

Icona suggerita:

```text
bi-alarm
```

Non confonderla con:

```text
Notifiche
```

che mantiene la campanella.

---

# Pagina promemoria

Creare:

```text
RemindersPageComponent
```

Struttura consigliata:

1. header;
2. card riepilogo;
3. filtri collassabili;
4. toolbar azioni massive;
5. tabella desktop;
6. card mobile;
7. paginazione;
8. modale modifica;
9. dialog conferma.

Header:

```text
Promemoria
Gestisci gli avvisi programmati per le tue spese
```

Azioni:

```text
Nuova spesa pianificata
```

Non è necessario creare un promemoria senza prima selezionare una spesa.

---

# Card riepilogo

Mostrare almeno:

```text
Attivi
Entro 7 giorni
Da elaborare
Processati
Annullati
```

Mostrare inoltre:

```text
Prossimo promemoria
```

Esempio:

```text
Assicurazione auto
20 luglio 2026 alle 09:00
```

Le card possono agire come filtri rapidi.

Cliccando:

```text
Annullati
```

applicare il relativo filtro e aggiornare l’URL.

---

# Filtri

Creare:

```text
ReminderFiltersComponent
```

Filtri:

* ricerca;
* stato;
* tipo;
* origine;
* stato spesa;
* categoria;
* ricorrenza;
* data promemoria da/a;
* data spesa da/a.

Usare:

```text
ng-select
```

già presente.

La sezione deve essere collassabile come quella della pagina Spese.

Quando chiusa mostrare:

* numero filtri attivi;
* riepilogo;
* reset.

---

# Query parameter frontend

Esempio:

```text
/reminders?page=1&status=ACTIVE&type=THREE_DAYS_BEFORE
```

Supportare almeno:

```text
page
pageSize
search
status
type
source
expenseStatus
categoryId
recurrenceRuleId
scheduledFrom
scheduledTo
expenseDateFrom
expenseDateTo
sortBy
sortDirection
```

Regole:

* refresh conserva lo stato;
* avanti e indietro funzionano;
* cambio filtro torna a pagina 1;
* reset mantiene eventuale page size;
* non inserire valori vuoti;
* evitare richieste duplicate;
* usare `switchMap`.

---

# Tabella desktop

Colonne consigliate:

```text
Selezione
Spesa
Promemoria
Data promemoria
Data spesa
Tipo
Origine
Stato
Azioni
```

## Spesa

Mostrare:

* descrizione;
* importo;
* categoria;
* eventuale icona ricorrenza.

## Promemoria

Mostrare:

* tipo leggibile;
* eventuale orario;
* testo sintetico.

## Stato

Usare badge:

```text
Attivo
Imminente
Da elaborare
Processato
Annullato
Non valido
```

## Azioni

Mostrare soltanto quelle consentite:

* apri spesa;
* modifica;
* annulla;
* riattiva;
* elimina;
* apri notifica;
* apri ricorrenza.

---

# Vista mobile

Su mobile usare card.

Ogni card deve mostrare:

* checkbox;
* descrizione spesa;
* importo;
* data promemoria;
* tipo;
* stato;
* categoria;
* origine;
* menu azioni.

Non comprimere la tabella desktop fino a renderla inutilizzabile.

---

# Selezione multipla

Consentire:

* selezione singola;
* seleziona pagina corrente;
* deseleziona tutto.

Non implementare inizialmente:

```text
seleziona tutti i record di tutte le pagine
```

salvo gestione esplicita e sicura server-side.

Mostrare:

```text
4 promemoria selezionati
```

Azioni massive disponibili in base alla selezione:

* annulla;
* riattiva;
* elimina.

Prima dell’azione mostrare conferma.

---

# Risultato operazioni massive

Dopo un’operazione mostrare un riepilogo.

Esempio:

```text
4 promemoria annullati.
1 promemoria non è stato modificato perché era già processato.
```

Non mostrare soltanto:

```text
Operazione fallita
```

quando il risultato è parziale.

Aggiornare:

* lista;
* riepilogo;
* selezione;
* eventuali conteggi.

---

# Modale modifica

Creare o riutilizzare:

```text
ExpenseReminderFormComponent
```

Non creare un secondo form.

La modale deve mostrare:

* spesa collegata;
* data della spesa;
* stato della spesa;
* tipo;
* data e ora custom;
* riepilogo temporale;
* origine.

Per promemoria ricorrenti mostrare:

```text
Questo promemoria è stato generato dalla ricorrenza “Affitto”.
La modifica riguarda soltanto questa spesa.
```

Azioni:

```text
Salva
Annulla
Apri ricorrenza
```

---

# Apertura spesa

Cliccando la descrizione o l’azione:

```text
Apri spesa
```

navigare a:

```text
/expenses/:id
```

È possibile aggiungere un query parameter di ritorno:

```text
returnUrl=/reminders
```

soltanto se il progetto dispone già di questa convenzione.

Non introdurre meccanismi di navigazione complessi.

---

# Apertura notifica

Per promemoria processati con notifica collegata mostrare:

```text
Apri notifica
```

Navigare a:

```text
/notifications
```

oppure aprire il dettaglio della notifica, se esistente.

Non creare una nuova notifica.

---

# Apertura ricorrenza

Se la spesa è stata generata da una ricorrenza mostrare:

```text
Apri ricorrenza
```

Navigare a:

```text
/recurrences/:id
```

Non modificare il template della ricorrenza dalla pagina Promemoria.

---

# Componenti Angular

Creare o riutilizzare:

```text
RemindersPageComponent
ReminderSummaryCardsComponent
ReminderFiltersComponent
ReminderTableComponent
ReminderCardComponent
ReminderStatusBadgeComponent
ReminderTypeBadgeComponent
ReminderSourceBadgeComponent
ReminderBulkActionsComponent
ExpenseReminderFormComponent
PaginationComponent
ConfirmDialogComponent
LoadingSkeletonComponent
EmptyStateComponent
```

Riutilizzare:

```text
CategoryBadgeComponent
ExpenseStatusBadgeComponent
PageHeaderComponent
ng-select
toast service
```

Non creare duplicati.

---

# Servizio Angular

Creare:

```text
ReminderManagementService
```

oppure estendere:

```text
ExpenseReminderService
```

se mantiene una responsabilità chiara.

Metodi indicativi:

```text
getReminders
getSummary
getReminder
updateReminder
cancelReminder
reactivateReminder
deleteReminder
bulkCancel
bulkReactivate
bulkDelete
```

Le chiamate HTTP non devono risiedere nei componenti.

---

# Store Angular

Creare preferibilmente:

```text
ReminderManagementStore
```

basato su Signals.

Stato indicativo:

```text
reminders
summary
loading
summaryLoading
error
filters
pagination
selection
editingReminder
bulkActionLoading
```

Computed:

```text
selectedCount
hasSelection
activeFilterCount
canBulkCancel
canBulkReactivate
canBulkDelete
```

Usare:

* Signals;
* computed;
* RxJS;
* `switchMap`;
* `takeUntilDestroyed`.

Non introdurre NgRx.

---

# Modelli TypeScript

Definire almeno:

```text
ReminderListItem
ReminderDetail
ReminderStatus
ReminderSource
ReminderAllowedActions
ReminderSummary
ReminderQueryParams
ReminderBulkActionRequest
ReminderBulkActionResult
UpdateReminderRequest
PaginatedReminderResponse
```

Non usare `any`.

Separare:

* risposta API;
* stato UI;
* query;
* form;
* operazioni massive.

---

# Loading state

Mostrare skeleton per:

* card riepilogo;
* tabella;
* card mobile;
* modale.

Durante il cambio filtri:

* mantenere la struttura;
* mostrare aggiornamento;
* evitare lampeggio completo.

Durante un’operazione massiva:

* disabilitare soltanto le azioni coinvolte;
* non bloccare l’intera applicazione.

---

# Empty state

## Nessun promemoria

```text
Non hai ancora configurato promemoria.
```

Azioni:

```text
Crea una spesa pianificata
Vai al calendario
```

## Nessun risultato

```text
Nessun promemoria corrisponde ai filtri applicati.
```

Azione:

```text
Azzera filtri
```

## Tutti processati

È possibile mostrare:

```text
Non ci sono promemoria attivi. Tutti i promemoria programmati sono stati elaborati o annullati.
```

---

# Error state

Gestire:

```text
400 filtri non validi
401 utente non autenticato
404 promemoria non trovato
409 operazione non consentita
500 errore interno
```

Messaggi frontend:

```text
Non è stato possibile caricare i promemoria.
Il promemoria non può più essere modificato.
Il promemoria è già stato elaborato.
Il promemoria non può essere riattivato perché la data è trascorsa.
```

Aggiungere:

```text
Riprova
```

quando opportuno.

---

# Toast

Successo:

```text
Promemoria aggiornato.
Promemoria annullato.
Promemoria riattivato.
Promemoria eliminato.
4 promemoria annullati.
```

Errore:

```text
Non è stato possibile aggiornare il promemoria.
Alcuni promemoria non sono stati modificati.
```

Evitare toast duplicati.

---

# Accessibilità

Garantire:

* checkbox con label;
* intestazioni tabella corrette;
* selezione da tastiera;
* menu azioni accessibile;
* stato non indicato soltanto dal colore;
* badge con testo;
* modale con focus trap;
* conferme comprensibili;
* annunci delle operazioni massive;
* date con testo completo;
* pulsanti icona con `aria-label`.

---

# Responsive design

## Desktop

* card riepilogo su più colonne;
* filtri in griglia;
* tabella completa;
* toolbar massiva fissa sopra la tabella.

## Tablet

* card su due colonne;
* filtri su più righe;
* tabella con scroll controllato.

## Mobile

* card;
* filtri collassabili;
* date leggibili;
* toolbar massiva compatta;
* modale quasi a schermo intero;
* azioni nel menu.

Mantenere:

* Reddit Sans;
* palette selezionata dall’utente;
* light mode;
* dark mode;
* accent color;
* densità tabella configurata nelle Impostazioni.

---

# Integrazione con le Impostazioni

Applicare:

* tema;
* colore principale;
* densità tabelle;
* page size predefinita.

Il valore della route ha precedenza sulla preferenza.

Esempio:

```text
settings.defaultPageSize = 50
/reminders?pageSize=20
```

deve usare:

```text
20
```

per quella navigazione.

Non aggiungere nuove impostazioni specifiche dei promemoria salvo reale utilità.

---

# Seed development

Aggiornare il seed development con:

* promemorio manuale attivo;
* promemoria manuale custom;
* promemoria imminente;
* promemoria dovuto;
* promemoria processato;
* promemoria annullato;
* promemoria generato da ricorrenza;
* promemoria collegato a una notifica;
* promemoria non eliminabile;
* promemoria eliminabile.

Il seed deve essere:

* idempotente;
* associato all’utente demo;
* eseguito soltanto in development.

---

# Test backend

Scrivere test almeno per:

## Lista

* paginazione;
* ordinamento;
* ricerca descrizione;
* ricerca esercente;
* filtro stato;
* filtro tipo;
* filtro origine;
* filtro categoria;
* filtro ricorrenza;
* intervallo scheduledAt;
* intervallo data spesa;
* ownership;
* esclusione dati altrui.

## Stato derivato

* attivo;
* imminente;
* dovuto;
* processato;
* annullato;
* non valido;
* spesa completata;
* spesa annullata;
* spesa eliminata.

## Modifica

* preset valido;
* custom valido;
* custom nel passato;
* custom successivo alla spesa;
* promemoria processato;
* promemoria altrui;
* duplicato equivalente;
* origine invariata.

## Annullamento

* attivo;
* già annullato;
* processato;
* ownership;
* scheduler ignora annullato.

## Riattivazione

* valido;
* data trascorsa;
* spesa completata;
* spesa annullata;
* duplicato;
* processato.

## Eliminazione

* eliminabile;
* processato;
* con notifica;
* generato da ricorrenza;
* ownership;
* `409`.

## Operazioni massive

* tutti validi;
* risultato parziale;
* duplicati nel payload;
* più di 100 ID;
* ID altrui;
* elementi già processati;
* transazione e consistenza.

## Riepilogo

* conteggi;
* prossimo promemoria;
* utente senza promemoria;
* isolamento utenti.

---

# Test frontend

Scrivere test almeno per:

* caricamento pagina;
* riepilogo;
* filtro rapido da card;
* ricerca;
* filtri;
* query parameter;
* ordinamento;
* paginazione;
* page size da impostazioni;
* tabella desktop;
* card mobile;
* selezione singola;
* seleziona pagina;
* annullamento massivo;
* risultato parziale;
* riattivazione massiva;
* eliminazione massiva;
* modifica preset;
* modifica custom;
* errore validazione;
* promemoria processato non modificabile;
* apertura spesa;
* apertura notifica;
* apertura ricorrenza;
* empty state;
* loading;
* error state;
* retry;
* light mode;
* dark mode;
* accessibilità essenziale.

---

# Verifica manuale

Al termine verificare almeno:

1. effettuare il login;
2. aprire `/reminders`;
3. verificare le card riepilogo;
4. filtrare gli attivi;
5. filtrare i processati;
6. filtrare gli annullati;
7. cercare una spesa;
8. filtrare per categoria;
9. filtrare per tipo;
10. filtrare per origine;
11. ordinare per data;
12. cambiare pagina;
13. aprire una spesa;
14. modificare un promemoria preset;
15. modificare un promemoria custom;
16. annullare un promemoria;
17. verificare che lo scheduler lo ignori;
18. riattivare un promemoria valido;
19. tentare la riattivazione di uno scaduto;
20. eliminare un promemoria eliminabile;
21. tentare di eliminare uno processato;
22. selezionare più promemoria;
23. annullarli in massa;
24. verificare un risultato parziale;
25. aprire la notifica collegata;
26. aprire la ricorrenza collegata;
27. verificare light mode;
28. verificare dark mode;
29. verificare mobile;
30. accedere con un secondo utente;
31. confermare l’isolamento dei dati.

---

# Verifica finale obbligatoria

Al termine:

1. eseguire `prisma format`;
2. eseguire `prisma validate`;
3. generare Prisma Client;
4. applicare eventuale migrazione;
5. eseguire seed development;
6. eseguire test backend;
7. eseguire test frontend;
8. eseguire lint;
9. eseguire type checking;
10. eseguire build backend;
11. eseguire build frontend;
12. verificare Swagger;
13. verificare Docker Compose;
14. verificare lo scheduler;
15. verificare idempotenza;
16. verificare operazioni massive;
17. verificare light e dark mode;
18. verificare desktop e mobile;
19. correggere tutti gli errori trovati.

Eseguire i comandi separatamente se l’ambiente presenta problemi con stdout o stderr.

Non dichiarare superate verifiche non realmente eseguite.

---

# README

Documentare:

* pagina Promemoria;
* differenza tra promemoria e notifiche;
* stati;
* origine;
* modifica;
* annullamento;
* riattivazione;
* eliminazione;
* operazioni massive;
* limiti;
* comportamento dei promemoria ricorrenti;
* conservazione delle notifiche storiche.

---

# Vincoli

* Non implementare il polish release.
* Non creare un secondo modello promemoria.
* Non duplicare lo scheduler.
* Non duplicare il calcolo di `scheduledAt`.
* Non eliminare notifiche storiche.
* Non modificare il template di una ricorrenza dalla pagina Promemoria.
* Non modificare spese in massa.
* Non riattivare date trascorse automaticamente.
* Non eliminare fisicamente promemoria processati.
* Non accettare `userId` dal client.
* Non caricare tutti i promemoria nel frontend.
* Non usare `any`.
* Non disabilitare TypeScript strict.
* Non effettuare chiamate HTTP direttamente nei componenti.
* Non introdurre NgRx.
* Non usare `--force`.
* Non usare `--legacy-peer-deps`.
* Non lasciare TODO bloccanti.
* Non ignorare errori di test, lint o build.
* Non riscrivere funzionalità funzionanti delle fasi precedenti.

---

# Output finale richiesto all’agente

Concludere con un riepilogo contenente:

* funzionalità implementate;
* modulo backend creato o esteso;
* eventuale migrazione;
* eventuale origine dei promemoria;
* endpoint globali;
* filtri;
* ordinamenti;
* stati derivati;
* regole di modifica;
* regole di annullamento;
* regole di riattivazione;
* regole di eliminazione;
* operazioni massive;
* componenti Angular creati o riutilizzati;
* integrazione con spese;
* integrazione con notifiche;
* integrazione con ricorrenze;
* integrazione con impostazioni;
* test realmente eseguiti;
* build realmente eseguite;
* verifica Swagger;
* verifica Docker;
* verifica scheduler;
* problemi corretti;
* eventuali limitazioni residue reali.

Non limitarsi al riepilogo: implementare prima integralmente la fase.
