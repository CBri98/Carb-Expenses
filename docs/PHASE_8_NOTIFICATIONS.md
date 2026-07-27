# PHASE_8_NOTIFICATIONS.md

## Obiettivo

Implementare la **Fase 8 — Notifiche interne e promemoria per le spese** dell’applicazione descritta in `AGENTS.md`.

Al termine della fase, l’utente autenticato deve poter:

* impostare uno o più promemoria su una spesa pianificata;
* scegliere quando ricevere il promemoria;
* visualizzare notifiche interne nell’applicazione;
* vedere il numero di notifiche non lette;
* aprire una spesa direttamente dalla relativa notifica;
* segnare una notifica come letta;
* segnare tutte le notifiche come lette;
* eliminare o archiviare una notifica;
* consultare lo storico delle notifiche;
* ricevere notifiche per spese imminenti e scadute;
* evitare notifiche duplicate;
* modificare o rimuovere i promemoria;
* mantenere il sistema affidabile anche dopo riavvii del backend.

Questa fase deve implementare esclusivamente notifiche interne all’applicazione.

Non implementare ancora:

* invio email;
* notifiche push browser;
* SMS;
* notifiche mobile native;
* webhook;
* spese ricorrenti;
* generazione automatica di nuove spese;
* integrazioni con calendari esterni.

L’architettura deve essere predisposta per futuri canali di notifica, senza implementarli ora.

Implementare direttamente il codice nel repository.

Non limitarsi a descrivere la soluzione.

---

# Operazioni preliminari

Prima di modificare il codice:

1. leggere integralmente `AGENTS.md`;
2. leggere integralmente `docs/PHASE_8_NOTIFICATIONS.md`;
3. analizzare lo stato reale del repository;
4. eseguire `git status` e `git diff`;
5. verificare che le Fasi 1–7 siano funzionanti;
6. verificare:

   * autenticazione;
   * ownership degli utenti;
   * CRUD delle spese;
   * stati delle spese;
   * spese future;
   * calendario;
   * gestione delle date;
   * fuso orario;
   * topbar e sidebar;
   * toast;
   * componenti condivisi;
7. controllare le convenzioni già adottate per:

   * API;
   * DTO;
   * mapper;
   * errori;
   * paginazione;
   * soft delete;
   * Angular Signals;
8. verificare se `@nestjs/schedule` è già installato;
9. verificare la compatibilità delle nuove dipendenze;
10. correggere soltanto problemi realmente bloccanti;
11. evitare refactoring non necessari;
12. non ricominciare da zero.

Non modificare il sistema di autenticazione o il modello delle spese senza una necessità concreta.

---

# Ambito della fase

Implementare:

* modelli Prisma per promemoria e notifiche;
* migrazione Prisma;
* scheduler NestJS;
* generazione affidabile delle notifiche;
* prevenzione dei duplicati;
* promemoria predefiniti;
* promemoria personalizzati;
* notifiche per spese imminenti;
* notifiche per spese pianificate scadute;
* API REST;
* badge notifiche nella topbar;
* dropdown notifiche;
* pagina completa delle notifiche;
* gestione letto/non letto;
* azione “segna tutte come lette”;
* archiviazione o soft delete;
* apertura della spesa collegata;
* gestione dei promemoria nel form spesa;
* filtri e paginazione;
* polling leggero o aggiornamento periodico del conteggio;
* test backend;
* test frontend;
* Swagger;
* aggiornamento README.

Non implementare:

* ricorrenze;
* email;
* push notification;
* service worker dedicato alle notifiche;
* code distribuite esterne;
* Redis;
* RabbitMQ;
* Kafka;
* cron distribuiti multi-node avanzati;
* notifiche social;
* notifiche relative a budget.

---

# Concetti principali

Distinguere chiaramente:

## Promemoria

Un promemoria rappresenta la regola configurata dall’utente su una spesa.

Esempio:

```text
Avvisami 3 giorni prima.
```

Il promemoria non è ancora una notifica visualizzata.

## Notifica

Una notifica rappresenta un messaggio generato dal sistema quando il promemoria diventa esigibile.

Esempio:

```text
La spesa “Assicurazione auto” è prevista tra 3 giorni.
```

Una notifica può essere:

* non letta;
* letta;
* archiviata.

Una notifica deve mantenere il riferimento:

* all’utente;
* alla spesa;
* al promemoria che l’ha generata, quando applicabile.

---

# Tipi di notifica

Implementare almeno:

```text
EXPENSE_REMINDER
EXPENSE_DUE_TODAY
EXPENSE_OVERDUE
```

Significato:

## EXPENSE_REMINDER

Promemoria anticipato.

Esempio:

```text
La spesa “Assicurazione auto” è prevista tra 3 giorni.
```

## EXPENSE_DUE_TODAY

La spesa pianificata è prevista oggi.

Esempio:

```text
La spesa “Bolletta internet” è prevista per oggi.
```

## EXPENSE_OVERDUE

La spesa è ancora `PLANNED`, ma la sua data è passata.

Esempio:

```text
La spesa “Rata auto” risulta scaduta.
```

Predisporre un enum estendibile per futuri tipi.

Non usare stringhe libere sparse nel codice.

---

# Opzioni promemoria

Consentire almeno:

```text
Il giorno stesso
1 giorno prima
3 giorni prima
7 giorni prima
Data e ora personalizzate
```

Valori applicativi indicativi:

```text
SAME_DAY
ONE_DAY_BEFORE
THREE_DAYS_BEFORE
SEVEN_DAYS_BEFORE
CUSTOM
```

È possibile rappresentare i preset tramite numero di minuti o giorni, ma mantenere una struttura tipizzata.

Esempi:

```text
SAME_DAY           offsetMinutes = 0
ONE_DAY_BEFORE     offsetMinutes = 1440
THREE_DAYS_BEFORE  offsetMinutes = 4320
SEVEN_DAYS_BEFORE  offsetMinutes = 10080
```

Per `CUSTOM`, memorizzare direttamente:

```text
scheduledAt
```

Non consentire promemoria successivi alla data della spesa, salvo il promemoria automatico di scadenza gestito dal sistema.

---

# Regole di applicabilità

I promemoria devono poter essere associati principalmente a spese:

```text
PLANNED
```

Regole:

* una spesa `PLANNED` può avere uno o più promemoria;
* una spesa `COMPLETED` non deve generare nuovi promemoria;
* una spesa `CANCELLED` non deve generare nuovi promemoria;
* una spesa eliminata non deve generare notifiche;
* modificando la data della spesa, i promemoria relativi devono essere ricalcolati;
* modificando una spesa da `PLANNED` a `COMPLETED`, i promemoria futuri devono essere disattivati o annullati;
* modificando una spesa da `PLANNED` a `CANCELLED`, i promemoria futuri devono essere disattivati;
* riportando una spesa a `PLANNED`, i promemoria possono essere riattivati o ricreati secondo una regola coerente;
* non generare notifiche retroattive indesiderate per promemoria ormai passati.

Documentare chiaramente il comportamento scelto.

---

# Fuso orario

Usare:

```text
Europe/Rome
```

Regole:

* `expenseDate` resta una data locale;
* `expenseTime` resta opzionale;
* `scheduledAt` deve essere memorizzato come timestamp UTC;
* il calcolo del promemoria deve partire dalla data e ora locale della spesa;
* in assenza di `expenseTime`, usare un orario predefinito configurabile;
* l’orario predefinito consigliato è:

```text
09:00 Europe/Rome
```

Aggiungere una variabile d’ambiente:

```env
DEFAULT_EXPENSE_REMINDER_TIME=09:00
```

Gestire correttamente:

* ora legale;
* ora solare;
* cambio data;
* conversione locale → UTC;
* confronto tra timestamp.

Centralizzare la conversione temporale.

Non spargere calcoli manuali nei service.

---

# Modello dati Prisma

Analizzare lo schema esistente e adattare nomi e tipi alle convenzioni del progetto.

Non duplicare modelli già presenti.

## Enum ReminderType

```prisma
enum ReminderType {
  SAME_DAY
  ONE_DAY_BEFORE
  THREE_DAYS_BEFORE
  SEVEN_DAYS_BEFORE
  CUSTOM
}
```

## Enum NotificationType

```prisma
enum NotificationType {
  EXPENSE_REMINDER
  EXPENSE_DUE_TODAY
  EXPENSE_OVERDUE
}
```

## Enum NotificationStatus

È possibile usare timestamp separati oppure un enum.

Soluzione consigliata:

```prisma
enum NotificationStatus {
  UNREAD
  READ
  ARCHIVED
}
```

## ExpenseReminder

Struttura indicativa:

```prisma
model ExpenseReminder {
  id             String       @id @default(uuid()) @db.Char(36)
  userId         String       @map("user_id") @db.Char(36)
  expenseId      String       @map("expense_id") @db.Char(36)
  type           ReminderType
  offsetMinutes  Int?         @map("offset_minutes")
  scheduledAt    DateTime     @map("scheduled_at")
  isActive       Boolean      @default(true) @map("is_active")
  processedAt    DateTime?    @map("processed_at")
  cancelledAt    DateTime?    @map("cancelled_at")
  createdAt      DateTime     @default(now()) @map("created_at")
  updatedAt      DateTime     @updatedAt @map("updated_at")

  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  expense       Expense        @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  notifications Notification[]

  @@index([userId])
  @@index([expenseId])
  @@index([scheduledAt, isActive])
  @@index([processedAt])
  @@map("expense_reminders")
}
```

## Notification

Struttura indicativa:

```prisma
model Notification {
  id          String             @id @default(uuid()) @db.Char(36)
  userId      String             @map("user_id") @db.Char(36)
  expenseId   String?            @map("expense_id") @db.Char(36)
  reminderId  String?            @map("reminder_id") @db.Char(36)
  type        NotificationType
  status      NotificationStatus @default(UNREAD)
  title       String             @db.VarChar(150)
  message     String             @db.VarChar(500)
  scheduledAt DateTime           @map("scheduled_at")
  readAt      DateTime?          @map("read_at")
  archivedAt  DateTime?          @map("archived_at")
  createdAt   DateTime           @default(now()) @map("created_at")

  user     User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  expense  Expense?         @relation(fields: [expenseId], references: [id], onDelete: SetNull)
  reminder ExpenseReminder? @relation(fields: [reminderId], references: [id], onDelete: SetNull)

  @@index([userId, status])
  @@index([userId, createdAt])
  @@index([expenseId])
  @@index([reminderId])
  @@map("notifications")
}
```

Aggiungere le relazioni inverse necessarie:

```prisma
model User {
  // campi esistenti

  expenseReminders ExpenseReminder[]
  notifications    Notification[]
}
```

```prisma
model Expense {
  // campi esistenti

  reminders     ExpenseReminder[]
  notifications Notification[]
}
```

Adattare i tipi UUID allo schema corrente.

---

# Prevenzione dei duplicati

La generazione delle notifiche deve essere idempotente.

Una stessa combinazione di:

```text
utente
spesa
promemoria
tipo di notifica
data prevista
```

non deve produrre più notifiche equivalenti.

È possibile aggiungere una chiave idempotente:

```prisma
deduplicationKey String @unique @map("deduplication_key") @db.VarChar(255)
```

Esempio logico:

```text
expense-reminder:{reminderId}:{scheduledAt}
```

Per notifiche automatiche senza promemoria:

```text
expense-due-today:{expenseId}:{expenseDate}
expense-overdue:{expenseId}:{expenseDate}
```

La generazione deve usare:

* transazione;
* upsert;
* oppure vincolo univoco gestito correttamente.

Non affidarsi soltanto a un controllo applicativo seguito da insert, perché può produrre race condition.

---

# Migrazione

Creare una migrazione Prisma descrittiva, per esempio:

```text
add_notifications_and_expense_reminders
```

La migrazione deve aggiungere:

* enum;
* tabelle;
* relazioni;
* indici;
* vincoli di unicità necessari.

Non usare `prisma db push` come soluzione finale.

Eseguire:

```text
prisma format
prisma validate
prisma generate
```

---

# Scheduler NestJS

Utilizzare preferibilmente:

```text
@nestjs/schedule
```

soltanto se compatibile con la versione NestJS installata.

Configurare:

```text
ScheduleModule.forRoot()
```

Creare un servizio dedicato, per esempio:

```text
NotificationSchedulerService
```

Lo scheduler deve:

* cercare promemoria attivi con `scheduledAt <= now`;
* ignorare quelli già processati;
* ignorare spese eliminate;
* ignorare spese completate;
* ignorare spese annullate;
* creare la notifica;
* segnare il promemoria come processato;
* gestire errori senza bloccare l’intero ciclo;
* essere idempotente.

---

# Frequenza scheduler

Usare una frequenza ragionevole, per esempio:

```text
ogni minuto
```

oppure:

```text
ogni 5 minuti
```

Scegliere in base al livello di precisione richiesto.

Per questa applicazione è sufficiente una precisione al minuto.

Non eseguire controlli ogni secondo.

La frequenza deve poter essere configurata tramite variabile d’ambiente, se semplice da implementare.

Esempio:

```env
NOTIFICATION_SCHEDULER_CRON=*/1 * * * *
```

Non accettare configurazioni arbitrarie non validate in produzione.

---

# Concorrenza dello scheduler

Il sistema deve evitare elaborazioni duplicate.

In ambiente con una singola istanza backend è sufficiente:

* transazione;
* deduplication key;
* aggiornamento atomico.

Predisporre il codice per una futura esecuzione multiistanza, ma non introdurre ora:

* Redis lock;
* database advisory lock complessi;
* code esterne.

Documentare che la garanzia principale è fornita dal vincolo univoco e dall’idempotenza.

---

# Notifiche di scadenza odierna

Oltre ai promemoria configurati, il sistema deve poter generare una notifica automatica per una spesa:

```text
PLANNED
expenseDate = oggi
```

Tipo:

```text
EXPENSE_DUE_TODAY
```

Generarla una sola volta per spesa e data.

L’orario consigliato è quello predefinito:

```text
09:00 Europe/Rome
```

Se esiste già un promemoria `SAME_DAY` equivalente, evitare una doppia notifica.

Definire una regola chiara:

* usare il promemoria `SAME_DAY`;
* oppure usare la notifica automatica;

ma non entrambe.

Preferire che `SAME_DAY` rappresenti il meccanismo unico per il giorno stesso.

È possibile creare automaticamente un promemoria `SAME_DAY` quando richiesto dall’utente.

---

# Notifiche per spese scadute

Generare una notifica quando una spesa:

```text
status = PLANNED
expenseDate < oggi
```

Tipo:

```text
EXPENSE_OVERDUE
```

Regola consigliata:

* una sola notifica quando la spesa diventa scaduta;
* non una notifica ogni giorno.

La spesa deve restare evidenziata nel calendario e nella dashboard.

Non modificare automaticamente lo stato.

Se la data della spesa viene successivamente cambiata:

* ricalcolare la condizione;
* non eliminare necessariamente la vecchia notifica già letta;
* evitare una nuova notifica duplicata per la stessa precedente scadenza;
* consentire una nuova notifica se la nuova data viene nuovamente superata.

Usare una deduplication key che includa la data della spesa.

---

# Creazione e aggiornamento dei promemoria

I promemoria possono essere gestiti:

* durante la creazione della spesa;
* durante la modifica della spesa;
* tramite una sezione dedicata nel dettaglio.

Non è necessario rendere obbligatori i promemoria.

## Creazione spesa

Il payload può includere opzionalmente:

```json
{
  "reminders": [
    {
      "type": "THREE_DAYS_BEFORE"
    },
    {
      "type": "SAME_DAY"
    }
  ]
}
```

Oppure creare endpoint separati.

Preferire endpoint separati se modificare il DTO delle spese complica eccessivamente il CRUD esistente.

## Modifica data spesa

Quando cambia:

```text
expenseDate
expenseTime
```

ricalcolare tutti i promemoria attivi non ancora processati.

## Cambio stato

Quando la spesa diventa:

```text
COMPLETED
CANCELLED
```

disattivare i promemoria futuri.

## Soft delete

Quando una spesa viene eliminata:

* annullare i promemoria;
* non eliminare necessariamente le notifiche storiche;
* il riferimento alla spesa può restare oppure diventare nullo secondo il modello scelto.

---

# Backend NestJS

Creare:

```text
NotificationsModule
```

Struttura indicativa:

```text
apps/backend/src/notifications/
├── dto/
│   ├── create-expense-reminder.dto.ts
│   ├── update-expense-reminder.dto.ts
│   ├── notification-query.dto.ts
│   └── notification-status.dto.ts
├── notifications.controller.ts
├── notifications.service.ts
├── notification-reminders.service.ts
├── notification-scheduler.service.ts
├── notifications.mapper.ts
├── notifications.types.ts
├── notifications.utils.ts
├── notifications.module.ts
└── notifications.service.spec.ts
```

Responsabilità:

## NotificationsController

* lista notifiche;
* conteggio non lette;
* dettaglio;
* letto/non letto;
* segna tutte come lette;
* archiviazione.

## NotificationsService

* query;
* ownership;
* aggiornamento stato;
* mapper;
* paginazione.

## NotificationRemindersService

* creazione promemoria;
* modifica;
* eliminazione;
* ricalcolo;
* disattivazione.

## NotificationSchedulerService

* ricerca promemoria scaduti;
* generazione idempotente;
* notifiche overdue;
* logging sintetico.

Non inserire business logic nel controller.

---

# API notifiche

Utilizzare il prefisso:

```text
/api/v1/notifications
```

Tutti gli endpoint devono essere autenticati.

Implementare almeno:

```http
GET    /api/v1/notifications
GET    /api/v1/notifications/unread-count
GET    /api/v1/notifications/:id
PATCH  /api/v1/notifications/:id/read
PATCH  /api/v1/notifications/:id/unread
PATCH  /api/v1/notifications/:id/archive
PATCH  /api/v1/notifications/read-all
```

È possibile omettere `unread` se non ritenuto necessario, ma la scelta deve essere documentata.

---

# Lista notifiche

Endpoint:

```http
GET /api/v1/notifications
```

Query parameter:

```text
page
pageSize
status
type
expenseId
dateFrom
dateTo
sortDirection
```

Default:

```text
page=1
pageSize=20
sortDirection=desc
```

Ordinamento:

```text
createdAt desc
```

Risposta indicativa:

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "EXPENSE_REMINDER",
      "status": "UNREAD",
      "title": "Spesa in scadenza",
      "message": "La spesa “Assicurazione auto” è prevista tra 3 giorni.",
      "scheduledAt": "2026-07-17T07:00:00.000Z",
      "createdAt": "2026-07-17T07:00:02.000Z",
      "readAt": null,
      "expense": {
        "id": "uuid",
        "description": "Assicurazione auto",
        "amount": "320.00",
        "expenseDate": "2026-07-20",
        "status": "PLANNED",
        "category": {
          "id": "uuid",
          "name": "Auto",
          "color": "#9BAFD6",
          "icon": "bi-car-front"
        }
      }
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 14,
    "totalPages": 1
  }
}
```

Non restituire oggetti Prisma direttamente.

---

# Conteggio non lette

Endpoint:

```http
GET /api/v1/notifications/unread-count
```

Risposta:

```json
{
  "count": 4
}
```

Il conteggio deve includere soltanto:

```text
status = UNREAD
```

ed escludere:

```text
ARCHIVED
```

Deve essere limitato all’utente autenticato.

---

# Dettaglio notifica

Endpoint:

```http
GET /api/v1/notifications/:id
```

Restituire:

* notifica;
* eventuale spesa collegata;
* eventuale promemoria;
* stato.

Restituire `404` per notifiche:

* inesistenti;
* altrui;
* archiviate, se il progetto decide di escluderle dai normali endpoint.

---

# Segna come letta

Endpoint:

```http
PATCH /api/v1/notifications/:id/read
```

Comportamento:

* impostare `status = READ`;
* impostare `readAt`;
* operazione idempotente;
* non modificare notifiche altrui.

---

# Segna come non letta

Endpoint opzionale:

```http
PATCH /api/v1/notifications/:id/unread
```

Comportamento:

* impostare `status = UNREAD`;
* azzerare `readAt`.

---

# Segna tutte come lette

Endpoint:

```http
PATCH /api/v1/notifications/read-all
```

Aggiornare soltanto le notifiche:

* dell’utente autenticato;
* non archiviate;
* attualmente non lette.

Restituire il numero di notifiche aggiornate.

Esempio:

```json
{
  "updatedCount": 4
}
```

---

# Archiviazione

Endpoint:

```http
PATCH /api/v1/notifications/:id/archive
```

Comportamento:

* impostare `status = ARCHIVED`;
* impostare `archivedAt`;
* escludere la notifica dalla lista predefinita;
* mantenere il record nel database.

Non eliminare fisicamente le notifiche.

---

# API promemoria

Utilizzare il prefisso:

```text
/api/v1/expenses/:expenseId/reminders
```

Implementare almeno:

```http
GET    /api/v1/expenses/:expenseId/reminders
POST   /api/v1/expenses/:expenseId/reminders
PATCH  /api/v1/expenses/:expenseId/reminders/:reminderId
DELETE /api/v1/expenses/:expenseId/reminders/:reminderId
```

Tutti gli endpoint devono verificare:

* ownership della spesa;
* ownership del promemoria;
* stato della spesa;
* validità temporale.

---

# Creazione promemoria

Endpoint:

```http
POST /api/v1/expenses/:expenseId/reminders
```

Preset:

```json
{
  "type": "THREE_DAYS_BEFORE"
}
```

Personalizzato:

```json
{
  "type": "CUSTOM",
  "scheduledAt": "2026-07-18T09:00:00+02:00"
}
```

Regole:

* non accettare `scheduledAt` per preset, salvo necessità interna;
* richiedere `scheduledAt` per `CUSTOM`;
* non permettere duplicati equivalenti;
* non permettere un promemoria dopo la scadenza della spesa;
* non permettere un promemoria nel passato, salvo una tolleranza minima durante il salvataggio;
* non permettere promemoria su spese eliminate;
* non permettere promemoria su spese annullate;
* non permettere normalmente nuovi promemoria su spese completate.

---

# Aggiornamento promemoria

Endpoint:

```http
PATCH /api/v1/expenses/:expenseId/reminders/:reminderId
```

Consentire:

* cambio preset;
* cambio data personalizzata;
* attivazione;
* disattivazione.

Non consentire:

* cambio utente;
* cambio spesa;
* modifica di promemoria già processati, salvo disattivazione o eventuale ricreazione.

Preferire la creazione di un nuovo promemoria quando cambia completamente la regola di uno già processato.

---

# Eliminazione promemoria

Endpoint:

```http
DELETE /api/v1/expenses/:expenseId/reminders/:reminderId
```

Comportamento consigliato:

* soft cancellation;
* impostare `isActive = false`;
* impostare `cancelledAt`.

Non eliminare fisicamente se il promemoria ha generato notifiche.

Se non ha generato notifiche, è comunque preferibile mantenere una traccia coerente.

---

# DTO backend

Creare almeno:

```text
CreateExpenseReminderDto
UpdateExpenseReminderDto
NotificationQueryDto
NotificationStatusDto
```

Validazioni:

## Reminder type

* enum valido.

## Offset

* intero;
* non negativo;
* usato soltanto internamente o per configurazioni avanzate.

## ScheduledAt

* ISO 8601;
* obbligatorio per `CUSTOM`;
* opzionale o vietato per preset;
* non successivo alla data della spesa;
* non nel passato.

## Query notifiche

```text
page:
  intero
  minimo 1

pageSize:
  intero
  minimo 1
  massimo 100

status:
  enum valido

type:
  enum valido

expenseId:
  UUID valido

dateFrom/dateTo:
  date ISO valide
```

---

# Mapper backend

Creare:

```text
NotificationsMapper
```

Responsabilità:

* serializzazione date;
* stato;
* tipo;
* spesa collegata;
* categoria;
* importo come stringa;
* eventuale promemoria;
* esclusione di campi interni;
* esclusione della deduplication key.

Non esporre:

* hash;
* chiavi interne;
* dettagli tecnici dello scheduler;
* campi Prisma non necessari.

---

# Logging

Lo scheduler deve produrre log sintetici.

Esempi:

```text
Notification scheduler processed 12 reminders.
Notification scheduler generated 3 notifications.
Notification scheduler skipped 2 inactive reminders.
```

Non inserire nei log:

* token;
* dati sensibili;
* note complete delle spese;
* stack trace non gestiti in produzione.

Per errori relativi a un singolo promemoria:

* registrare ID tecnico;
* continuare il ciclo;
* non bloccare tutti gli altri.

---

# Swagger

Documentare:

* endpoint notifiche;
* endpoint promemoria;
* autenticazione Bearer;
* enum;
* query parameter;
* paginazione;
* stato letto;
* archiviazione;
* errori;
* timezone;
* formati delle date;
* comportamento dei preset;
* prevenzione duplicati.

Documentare almeno:

```text
200
201
204
400
401
404
409
500
```

---

# Frontend Angular

Creare o completare:

```text
/notifications
```

La route deve essere:

* protetta da auth guard;
* lazy loaded, se coerente;
* accessibile dalla topbar;
* eventualmente accessibile dalla sidebar.

Icona consigliata:

```text
bi-bell
```

---

# Campanella nella topbar

Aggiungere alla topbar un pulsante notifiche.

Mostrare:

* icona campanella;
* badge con conteggio non lette;
* badge nascosto quando il conteggio è zero;
* stato accessibile.

Esempio:

```text
Campanella
Badge: 4
```

ARIA label indicativa:

```text
Notifiche, 4 non lette
```

Il badge può mostrare:

```text
9+
```

oltre una certa soglia.

---

# Dropdown notifiche

Cliccando sulla campanella aprire un dropdown o pannello.

Mostrare le notifiche più recenti, per esempio:

```text
5
```

Ogni elemento deve mostrare:

* icona;
* titolo;
* messaggio breve;
* tempo relativo;
* stato letto/non letto;
* eventuale categoria;
* collegamento alla spesa.

Azioni:

* apri;
* segna come letta;
* segna tutte come lette;
* vai a tutte le notifiche.

Non caricare l’intero storico nel dropdown.

---

# Aggiornamento del conteggio

Implementare una strategia leggera.

Opzioni accettabili:

* caricamento all’avvio;
* aggiornamento dopo azioni locali;
* polling ogni 60–120 secondi;
* aggiornamento quando la finestra torna attiva.

Non implementare WebSocket in questa fase.

Evitare polling troppo frequente.

Strategia consigliata:

```text
polling ogni 60 secondi
```

con:

* sospensione quando l’utente non è autenticato;
* stop al logout;
* aggiornamento immediato dopo lettura o archiviazione;
* nessun memory leak.

---

# Pagina notifiche

Creare:

```text
NotificationsPageComponent
```

Struttura:

1. header;
2. riepilogo;
3. filtri;
4. lista;
5. paginazione.

Header:

```text
Notifiche
Promemoria e aggiornamenti sulle tue spese
```

Azioni:

```text
Segna tutte come lette
```

---

# Filtri pagina notifiche

Supportare:

* tutte;
* non lette;
* lette;
* archiviate;
* tipo;
* intervallo di date;
* spesa collegata opzionale.

La sezione filtri può essere collassabile, coerentemente con la pagina Spese.

Usare `ng-select` se già presente.

Sincronizzare i filtri con i query parameter.

Esempio:

```text
/notifications?status=UNREAD&type=EXPENSE_REMINDER&page=1
```

---

# Lista notifiche

Ogni elemento deve mostrare:

* icona del tipo;
* titolo;
* messaggio;
* data e ora;
* tempo relativo;
* stato;
* eventuale spesa;
* azioni.

Stile:

## Non letta

* superficie leggermente evidenziata;
* indicatore testuale o icona;
* non soltanto colore.

## Letta

* stile normale o attenuato.

## Archiviata

* non visibile nella lista predefinita;
* visibile con filtro specifico.

---

# Apertura dalla notifica

Cliccando una notifica collegata a una spesa:

1. segnarla come letta;
2. aprire il dettaglio della spesa;
3. oppure navigare a:

```text
/expenses/:id
```

Se la spesa non è più disponibile:

* mostrare comunque la notifica;
* mostrare un messaggio:

```text
La spesa collegata non è più disponibile.
```

Non generare un errore non gestito.

---

# Gestione promemoria nel form spesa

Estendere:

```text
ExpenseFormComponent
```

Aggiungere una sezione:

```text
Promemoria
```

Mostrare soltanto quando lo stato è:

```text
PLANNED
```

Opzioni:

```text
Il giorno stesso
1 giorno prima
3 giorni prima
7 giorni prima
Personalizzato
```

Consentire selezione multipla.

Esempio:

```text
✓ 3 giorni prima
✓ Il giorno stesso
```

Non permettere preset duplicati.

---

# Promemoria personalizzato

Per un promemoria custom mostrare:

* data;
* ora;
* riepilogo;
* validazione.

Esempio:

```text
18 luglio 2026 alle 09:00
```

La data non deve superare la data della spesa.

Se cambia la data della spesa e il promemoria diventa invalido:

* mostrare errore;
* richiedere correzione;
* oppure ricalcolare soltanto i preset.

Non spostare automaticamente un promemoria custom senza informare l’utente.

---

# Dettaglio spesa

Nel dettaglio mostrare una sezione:

```text
Promemoria
```

Contenuti:

* tipo;
* data prevista;
* stato;
* processato/non processato;
* attivo/disattivato.

Azioni:

* aggiungi;
* modifica;
* rimuovi.

Non mostrare campi tecnici come:

* deduplication key;
* ID interni;
* processedAt grezzo senza formattazione.

---

# Componenti Angular

Creare o riutilizzare:

```text
NotificationBellComponent
NotificationDropdownComponent
NotificationListComponent
NotificationListItemComponent
NotificationStatusBadgeComponent
NotificationTypeIconComponent
NotificationFiltersComponent
ExpenseReminderFormComponent
ExpenseReminderListComponent
UnreadNotificationBadgeComponent
PaginationComponent
EmptyStateComponent
LoadingSkeletonComponent
ConfirmDialogComponent
```

Riutilizzare:

```text
CategoryBadgeComponent
ExpenseStatusBadgeComponent
PageHeaderComponent
ng-select
toast service
```

Non creare duplicati di componenti esistenti.

---

# Servizi Angular

Creare:

```text
NotificationService
ExpenseReminderService
```

## NotificationService

Responsabilità:

* lista;
* conteggio non lette;
* dettaglio;
* letta;
* non letta;
* segna tutte;
* archivia.

## ExpenseReminderService

Responsabilità:

* lista promemoria della spesa;
* creazione;
* modifica;
* cancellazione.

Le chiamate HTTP non devono risiedere nei componenti.

---

# Stato Angular

È possibile creare:

```text
NotificationStore
```

basato su Signals.

Stato indicativo:

```text
notifications
recentNotifications
unreadCount
loading
dropdownLoading
error
filters
pagination
isDropdownOpen
```

Computed:

```text
hasUnreadNotifications
displayUnreadCount
activeFilterCount
```

Non introdurre NgRx.

Usare:

* Signals;
* computed;
* RxJS;
* `switchMap`;
* `takeUntilDestroyed`.

---

# Modelli TypeScript

Definire almeno:

```text
Notification
NotificationType
NotificationStatus
NotificationExpense
NotificationQueryParams
PaginatedNotificationResponse
UnreadNotificationCount
ExpenseReminder
ReminderType
CreateExpenseReminderRequest
UpdateExpenseReminderRequest
ReminderPresetOption
```

Non usare `any`.

Separare:

* risposta API;
* payload;
* stato UI;
* valore form.

---

# Query parameter frontend

Pagina notifiche:

```text
/notifications?page=1&status=UNREAD&type=EXPENSE_REMINDER
```

Regole:

* refresh conserva i filtri;
* avanti e indietro funzionano;
* reset rimuove i parametri;
* cambio filtro torna a pagina 1;
* evitare richieste duplicate;
* non inserire valori vuoti.

---

# Toast e feedback

Mostrare messaggi come:

```text
Promemoria aggiunto.
Promemoria aggiornato.
Promemoria rimosso.
Notifica segnata come letta.
Tutte le notifiche sono state segnate come lette.
Notifica archiviata.
```

Errori:

```text
Non è stato possibile salvare il promemoria.
La data del promemoria non è valida.
Il promemoria deve precedere la spesa.
Non è stato possibile caricare le notifiche.
```

Non mostrare errori tecnici.

---

# Empty state

## Nessuna notifica

```text
Non hai ancora ricevuto notifiche.
```

## Nessuna notifica non letta

```text
Hai letto tutte le notifiche.
```

## Nessun risultato con filtri

```text
Nessuna notifica corrisponde ai filtri applicati.
```

Azioni:

```text
Azzera filtri
Vai al calendario
```

---

# Loading state

Mostrare skeleton per:

* campanella;
* dropdown;
* lista;
* conteggio;
* promemoria nel form.

Non bloccare tutta l’applicazione per il caricamento del conteggio.

Se il conteggio fallisce:

* non interrompere la navigazione;
* nascondere temporaneamente il badge;
* riprovare al ciclo successivo.

---

# Accessibilità

Garantire:

* campanella con `aria-label`;
* badge leggibile dagli screen reader;
* dropdown navigabile da tastiera;
* focus management;
* stato letto non indicato soltanto dal colore;
* pulsanti icona con label;
* aggiornamenti annunciabili;
* form promemoria accessibile;
* errori associati ai campi;
* modali con focus trap;
* tempo relativo accompagnato da data completa accessibile.

---

# Responsive design

## Desktop

* campanella nella topbar;
* dropdown compatto;
* pagina completa con filtri laterali o superiori;
* form promemoria integrato.

## Tablet

* dropdown adattato;
* filtri su più righe;
* lista a larghezza completa.

## Mobile

* dropdown sostituibile con pannello o offcanvas;
* pagina notifiche a card;
* filtri collassabili;
* promemoria in form quasi a schermo intero;
* azioni facilmente selezionabili.

Mantenere:

* Reddit Sans;
* tema light;
* palette pastello;
* stile gestionale.

---

# Prestazioni

Il conteggio non lette deve usare una query `COUNT`.

Non recuperare tutte le notifiche per calcolare il badge.

La lista deve essere paginata server-side.

Lo scheduler deve interrogare soltanto:

* promemoria attivi;
* non processati;
* scaduti entro il momento corrente.

Usare gli indici definiti.

Non elaborare continuamente l’intera tabella.

---

# Sicurezza e ownership

Ogni endpoint deve verificare l’utente autenticato.

Un utente non deve poter:

* leggere notifiche altrui;
* modificare notifiche altrui;
* archiviare notifiche altrui;
* creare promemoria su spese altrui;
* modificare promemoria altrui;
* conoscere l’esistenza di spese altrui.

Non accettare `userId` dal client.

Restituire `404` per risorse inesistenti o non appartenenti all’utente.

---

# Seed development

Aggiornare il seed development con:

* una spesa pianificata tra 7 giorni;
* una spesa pianificata tra 3 giorni;
* una spesa prevista oggi;
* una spesa pianificata già scaduta;
* promemoria attivi;
* alcune notifiche non lette;
* alcune notifiche lette;
* una notifica archiviata.

Il seed deve essere:

* idempotente;
* coerente con l’utente demo;
* eseguito soltanto in development.

Non creare notifiche demo in produzione.

---

# Test backend

Scrivere test almeno per:

## Promemoria

* creazione preset;
* creazione custom;
* custom senza data;
* data successiva alla spesa;
* data nel passato;
* duplicato;
* spesa altrui;
* spesa completata;
* spesa annullata;
* modifica;
* disattivazione;
* ricalcolo dopo cambio data;
* disattivazione dopo cambio stato;
* soft delete della spesa.

## Scheduler

* promemoria non ancora dovuto;
* promemoria dovuto;
* promemoria già processato;
* promemoria inattivo;
* spesa completata;
* spesa annullata;
* spesa eliminata;
* idempotenza;
* deduplication key;
* più scheduler run consecutivi;
* errore su un elemento senza bloccare gli altri.

## Notifiche

* lista paginata;
* filtro stato;
* filtro tipo;
* conteggio non lette;
* dettaglio;
* segna letta;
* segna non letta;
* segna tutte;
* archiviazione;
* ownership;
* esclusione archiviate dalla lista predefinita;
* spesa collegata non più disponibile.

## Scadenze

* notifica giorno stesso;
* notifica overdue;
* overdue generata una sola volta;
* cambio data e nuova scadenza;
* esclusione completate;
* esclusione annullate.

---

# Test frontend

Scrivere test almeno per:

* rendering campanella;
* badge zero;
* badge con conteggio;
* limite `9+`;
* apertura dropdown;
* caricamento recenti;
* segna letta;
* segna tutte;
* apertura spesa;
* polling;
* stop polling al logout;
* pagina notifiche;
* filtri;
* query parameter;
* paginazione;
* archiviazione;
* empty state;
* loading;
* errore;
* retry;
* form promemoria;
* preset multipli;
* prevenzione duplicati;
* custom date;
* validazione data;
* visualizzazione promemoria nel dettaglio;
* modifica;
* eliminazione;
* cambio stato spesa e aggiornamento promemoria;
* accessibilità essenziale.

---

# Verifica manuale

Al termine verificare almeno:

1. effettuare il login;
2. visualizzare la campanella;
3. verificare il conteggio non lette;
4. aprire il dropdown;
5. aprire una notifica;
6. verificare che venga segnata come letta;
7. segnare tutte come lette;
8. aprire la pagina notifiche;
9. filtrare per non lette;
10. filtrare per tipo;
11. archiviare una notifica;
12. creare una spesa futura;
13. aggiungere un promemoria a 3 giorni;
14. aggiungere un promemoria per il giorno stesso;
15. aggiungere un promemoria personalizzato;
16. modificare la data della spesa;
17. verificare il ricalcolo;
18. segnare la spesa come completata;
19. verificare la disattivazione dei promemoria;
20. eseguire manualmente o attendere un ciclo scheduler in development;
21. verificare la generazione della notifica;
22. ripetere il ciclo e verificare l’assenza di duplicati;
23. verificare una spesa scaduta;
24. verificare mobile;
25. accedere con un secondo utente;
26. confermare l’isolamento dei dati.

---

# Verifica finale obbligatoria

Al termine:

1. eseguire `prisma format`;
2. eseguire `prisma validate`;
3. generare Prisma Client;
4. applicare la migrazione;
5. eseguire il seed development;
6. eseguire test backend;
7. eseguire test frontend;
8. eseguire lint;
9. eseguire type checking;
10. eseguire build backend;
11. eseguire build frontend;
12. verificare Swagger;
13. verificare Docker Compose;
14. verificare lo scheduler;
15. verificare l’idempotenza;
16. verificare desktop e mobile;
17. correggere tutti gli errori trovati.

Eseguire i comandi separatamente se l’ambiente presenta problemi con stdout o stderr.

Non dichiarare superate verifiche non realmente eseguite.

---

# Variabili d’ambiente

Aggiornare `.env.example` con almeno:

```env
DEFAULT_EXPENSE_REMINDER_TIME=09:00
NOTIFICATION_SCHEDULER_CRON=*/1 * * * *
NOTIFICATION_POLL_INTERVAL_MS=60000
```

Validare le configurazioni all’avvio, se il progetto dispone già di un sistema di validazione delle variabili.

Non inserire valori sensibili.

---

# README

Documentare:

* funzionamento dei promemoria;
* tipi disponibili;
* scheduler;
* timezone;
* variabili d’ambiente;
* comportamento delle spese completate e annullate;
* idempotenza;
* polling frontend;
* limiti della fase;
* assenza di email e push notification.

---

# Vincoli

* Non implementare ricorrenze.
* Non generare nuove spese automaticamente.
* Non implementare email.
* Non implementare push notification.
* Non implementare WebSocket.
* Non introdurre Redis.
* Non introdurre code esterne.
* Non inviare notifiche a utenti diversi dal proprietario.
* Non accettare `userId` dal client.
* Non duplicare notifiche.
* Non elaborare tutta la tabella a ogni ciclo.
* Non usare `any`.
* Non disabilitare TypeScript strict.
* Non effettuare chiamate HTTP direttamente nei componenti.
* Non introdurre NgRx.
* Non eliminare fisicamente le notifiche.
* Non duplicare la business logic delle spese.
* Non cambiare automaticamente lo stato di una spesa scaduta.
* Non lasciare TODO bloccanti.
* Non ignorare errori di test, lint o build.
* Non forzare dipendenze incompatibili.
* Non riscrivere componenti funzionanti delle fasi precedenti.

---

# Output finale richiesto all’agente

Concludere con un riepilogo contenente:

* funzionalità implementate;
* modelli Prisma aggiunti;
* migrazione creata;
* enum aggiunti;
* endpoint notifiche;
* endpoint promemoria;
* strategia scheduler;
* frequenza scheduler;
* strategia di idempotenza;
* comportamento su cambio data;
* comportamento su cambio stato;
* comportamento sulle spese scadute;
* componenti Angular creati o riutilizzati;
* strategia di polling;
* test realmente eseguiti;
* build realmente eseguite;
* verifica Swagger;
* verifica Docker;
* verifica scheduler;
* problemi corretti;
* eventuali limitazioni residue reali.

Non limitarsi al riepilogo: implementare prima integralmente la fase.
