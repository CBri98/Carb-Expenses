# PHASE_9_RECURRENCES.md

## Obiettivo

Implementare la **Fase 9 — Spese ricorrenti** dell’applicazione descritta in `AGENTS.md`.

Al termine della fase, l’utente autenticato deve poter:

* creare una regola di spesa ricorrente;
* scegliere frequenza e intervallo;
* impostare data di inizio e data di fine opzionale;
* definire i dati della spesa da generare;
* visualizzare le prossime occorrenze;
* generare automaticamente le spese pianificate;
* modificare una ricorrenza;
* sospendere e riattivare una ricorrenza;
* terminare definitivamente una ricorrenza;
* eliminare una regola non ancora utilizzata;
* riconoscere le spese generate automaticamente;
* aprire la ricorrenza dalla spesa generata;
* evitare la generazione di occorrenze duplicate;
* mantenere affidabilità dopo riavvii del backend;
* integrare le spese generate con calendario, dashboard, report e notifiche.

Questa fase deve implementare regole ricorrenti interne all’applicazione.

Non implementare:

* sincronizzazione con banche;
* addebiti reali;
* pagamenti automatici;
* sincronizzazione con Google Calendar;
* sincronizzazione con calendari esterni;
* ricorrenze condivise tra utenti;
* modelli di previsione basati su intelligenza artificiale;
* regole contabili complesse;
* rate con interessi o piani di ammortamento;
* modifica automatica degli importi tramite indicizzazione.

Le ricorrenze devono generare normali entità `Expense`.

Non creare un sistema parallelo di spese virtuali non compatibile con il CRUD esistente.

Implementare direttamente il codice nel repository.

Non limitarsi a descrivere la soluzione.

---

# Operazioni preliminari

Prima di modificare il codice:

1. leggere integralmente `AGENTS.md`;
2. leggere integralmente `docs/PHASE_9_RECURRENCES.md`;
3. analizzare lo stato reale del repository;
4. eseguire `git status` e `git diff`;
5. verificare che le Fasi 1–8 siano funzionanti;
6. verificare:

   * autenticazione;
   * ownership;
   * categorie;
   * etichette;
   * CRUD delle spese;
   * stati delle spese;
   * gestione date e fuso orario;
   * calendario;
   * dashboard;
   * report;
   * notifiche;
   * promemoria;
   * scheduler NestJS;
7. controllare le convenzioni già adottate per:

   * moduli NestJS;
   * DTO;
   * mapper;
   * servizi;
   * transazioni Prisma;
   * scheduler;
   * idempotenza;
   * paginazione;
   * soft delete;
   * Angular Signals;
8. riutilizzare il sistema scheduler già introdotto nella Fase 8;
9. evitare un secondo scheduler indipendente se non necessario;
10. correggere soltanto problemi realmente bloccanti;
11. evitare refactoring non necessari;
12. non ricominciare da zero.

Non modificare il sistema di notifiche se non per integrare correttamente le spese generate.

---

# Ambito della fase

Implementare:

* modello Prisma delle regole ricorrenti;
* relazione tra ricorrenze e spese generate;
* migrazione Prisma;
* frequenze ricorrenti;
* intervalli personalizzati;
* data di inizio;
* data di fine opzionale;
* limite opzionale del numero di occorrenze;
* prossima esecuzione;
* generazione anticipata delle occorrenze;
* scheduler idempotente;
* prevenzione dei duplicati;
* sospensione;
* riattivazione;
* terminazione;
* modifica della regola;
* gestione delle occorrenze già generate;
* gestione dei promemoria sulle spese generate;
* API REST;
* pagina Angular delle ricorrenze;
* form di creazione e modifica;
* dettaglio della ricorrenza;
* anteprima delle prossime date;
* visualizzazione delle spese generate;
* filtri e paginazione;
* test backend;
* test frontend;
* Swagger;
* aggiornamento README;
* aggiornamento seed development.

Non implementare:

* notifiche email;
* pagamenti reali;
* modifica retroattiva indiscriminata delle spese completate;
* ricorrenze con formule arbitrarie;
* linguaggio RRULE completo inserito manualmente dall’utente;
* ricorrenze condivise;
* ricorrenze multi-valuta;
* suddivisione automatica di una spesa tra più utenti;
* generazione infinita anticipata.

---

# Principio fondamentale

Una ricorrenza è una regola che genera normali record:

```text
Expense
```

Ogni spesa generata deve:

* appartenere all’utente;
* avere un proprio ID;
* essere modificabile tramite il CRUD esistente;
* apparire nella pagina Spese;
* apparire nel calendario;
* contribuire alla dashboard e ai report secondo il proprio stato;
* poter avere promemoria;
* mantenere il riferimento alla ricorrenza di origine;
* mantenere il riferimento alla specifica occorrenza pianificata.

La ricorrenza non deve sostituire il modello `Expense`.

---

# Casi d’uso principali

Esempi:

```text
Affitto ogni mese il giorno 1
Abbonamento streaming ogni mese il giorno 15
Assicurazione auto ogni anno
Spesa condominiale ogni 3 mesi
Palestra ogni 4 settimane
Pulizie domestiche ogni 2 settimane
Rata auto ogni mese per 36 occorrenze
Bolletta stimata ogni 2 mesi
```

---

# Frequenze supportate

Implementare almeno:

```text
DAILY
WEEKLY
MONTHLY
YEARLY
```

Etichette frontend:

```text
DAILY      Giornaliera
WEEKLY     Settimanale
MONTHLY    Mensile
YEARLY     Annuale
```

Ogni frequenza deve supportare un intervallo intero positivo.

Esempi:

```text
interval = 1 + WEEKLY  → ogni settimana
interval = 2 + WEEKLY  → ogni 2 settimane
interval = 3 + MONTHLY → ogni 3 mesi
interval = 1 + YEARLY  → ogni anno
```

Non creare enum distinti per “trimestrale” o “bimestrale”.

Rappresentarli tramite:

```text
frequency
interval
```

---

# Stati della ricorrenza

Implementare almeno:

```text
ACTIVE
PAUSED
COMPLETED
CANCELLED
```

Significato:

## ACTIVE

La regola può generare nuove occorrenze.

## PAUSED

La regola è temporaneamente sospesa.

Non deve generare nuove occorrenze mentre è in pausa.

## COMPLETED

La regola ha raggiunto:

* la data di fine;
* il numero massimo di occorrenze;
* oppure non possiede più esecuzioni future.

## CANCELLED

La regola è stata terminata manualmente.

Non deve generare nuove occorrenze.

Le spese già generate devono restare nel database.

---

# Modello dati Prisma

Analizzare lo schema esistente e adattare nomi e tipi alle convenzioni già presenti.

Non duplicare enum, relazioni o campi esistenti.

## Enum RecurrenceFrequency

```prisma
enum RecurrenceFrequency {
  DAILY
  WEEKLY
  MONTHLY
  YEARLY
}
```

## Enum RecurrenceStatus

```prisma
enum RecurrenceStatus {
  ACTIVE
  PAUSED
  COMPLETED
  CANCELLED
}
```

## RecurrenceRule

Struttura indicativa:

```prisma
model RecurrenceRule {
  id                  String              @id @default(uuid()) @db.Char(36)
  userId              String              @map("user_id") @db.Char(36)
  categoryId          String              @map("category_id") @db.Char(36)

  name                String              @db.VarChar(150)
  description         String              @db.VarChar(150)
  amount              Decimal             @db.Decimal(12, 2)
  merchant            String?             @db.VarChar(150)
  paymentMethod       PaymentMethod       @default(OTHER) @map("payment_method")
  notes               String?             @db.Text

  frequency           RecurrenceFrequency
  interval            Int                 @default(1)
  status              RecurrenceStatus    @default(ACTIVE)

  startDate           DateTime            @map("start_date") @db.Date
  endDate             DateTime?           @map("end_date") @db.Date
  nextOccurrenceDate  DateTime?           @map("next_occurrence_date") @db.Date
  lastGeneratedDate   DateTime?           @map("last_generated_date") @db.Date

  maxOccurrences      Int?                @map("max_occurrences")
  generatedCount      Int                 @default(0) @map("generated_count")

  expenseTime         DateTime?           @map("expense_time") @db.Time(0)
  generateDaysAhead   Int                 @default(30) @map("generate_days_ahead")

  isActive            Boolean             @default(true) @map("is_active")
  pausedAt            DateTime?           @map("paused_at")
  completedAt         DateTime?           @map("completed_at")
  cancelledAt         DateTime?           @map("cancelled_at")
  createdAt           DateTime            @default(now()) @map("created_at")
  updatedAt           DateTime            @updatedAt @map("updated_at")
  deletedAt           DateTime?           @map("deleted_at")

  user                User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  category            Category            @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  labels              RecurrenceRuleLabel[]
  expenses            Expense[]

  @@index([userId, status])
  @@index([nextOccurrenceDate, status])
  @@index([userId, categoryId])
  @@index([deletedAt])
  @@map("recurrence_rules")
}
```

Adattare il modello allo schema corrente.

Non mantenere contemporaneamente `isActive` e `status` se risultano ridondanti nell’architettura reale.

Preferire un’unica fonte autorevole per lo stato.

---

# Etichette della ricorrenza

Una ricorrenza può avere più etichette.

Creare una relazione dedicata:

```prisma
model RecurrenceRuleLabel {
  recurrenceRuleId String @map("recurrence_rule_id") @db.Char(36)
  labelId          String @map("label_id") @db.Char(36)

  recurrenceRule RecurrenceRule @relation(fields: [recurrenceRuleId], references: [id], onDelete: Cascade)
  label          Label          @relation(fields: [labelId], references: [id], onDelete: Cascade)

  @@id([recurrenceRuleId, labelId])
  @@index([labelId])
  @@map("recurrence_rule_labels")
}
```

Aggiungere la relazione inversa a `Label`.

Le etichette vengono copiate sulle spese generate.

---

# Collegamento con Expense

Aggiungere a `Expense` almeno:

```prisma
recurrenceRuleId     String?   @map("recurrence_rule_id") @db.Char(36)
occurrenceDate       DateTime? @map("occurrence_date") @db.Date
generatedByRecurrence Boolean  @default(false) @map("generated_by_recurrence")
```

Relazione:

```prisma
recurrenceRule RecurrenceRule? @relation(fields: [recurrenceRuleId], references: [id], onDelete: SetNull)
```

Aggiungere un vincolo che impedisca duplicati:

```prisma
@@unique([recurrenceRuleId, occurrenceDate])
```

Verificare la compatibilità del vincolo con valori `NULL` in MariaDB.

In alternativa creare una chiave idempotente:

```prisma
recurrenceKey String? @unique @map("recurrence_key") @db.VarChar(255)
```

Esempio:

```text
recurrence:{recurrenceRuleId}:{occurrenceDate}
```

La strategia deve impedire definitivamente che la stessa occorrenza venga generata due volte.

---

# Relazioni inverse

Aggiornare almeno:

```prisma
model User {
  recurrenceRules RecurrenceRule[]
}
```

```prisma
model Category {
  recurrenceRules RecurrenceRule[]
}
```

```prisma
model Label {
  recurrenceRules RecurrenceRuleLabel[]
}
```

```prisma
model Expense {
  recurrenceRule RecurrenceRule?
}
```

Non creare relazioni duplicate.

---

# Migrazione

Creare una migrazione descrittiva, per esempio:

```text
add_recurrence_rules
```

La migrazione deve comprendere:

* enum;
* tabella delle ricorrenze;
* relazione etichette;
* campi su `Expense`;
* indici;
* vincoli di unicità;
* relazioni.

Non usare `prisma db push` come soluzione finale.

Eseguire:

```text
prisma format
prisma validate
prisma generate
```

---

# Dati della spesa generata

Ogni occorrenza deve copiare dalla regola:

* descrizione;
* importo;
* categoria;
* etichette;
* metodo di pagamento;
* esercente;
* note;
* ora;
* riferimento alla ricorrenza;
* data dell’occorrenza.

Lo stato iniziale deve essere:

```text
PLANNED
```

Non generare automaticamente spese `COMPLETED`.

L’utente deve segnarle come completate quando vengono effettivamente sostenute.

---

# Nome e descrizione della ricorrenza

Distinguere:

## Nome della regola

Usato per identificare la ricorrenza nell’interfaccia.

Esempio:

```text
Affitto appartamento
```

## Descrizione della spesa

Copiata nelle spese generate.

Esempio:

```text
Affitto mensile
```

È possibile usare inizialmente lo stesso valore, ma il modello deve consentire una distinzione chiara.

---

# Date e fuso orario

Usare:

```text
Europe/Rome
```

Regole:

* `startDate`, `endDate`, `nextOccurrenceDate` e `occurrenceDate` sono date locali;
* `expenseTime` resta separato;
* i timestamp tecnici restano UTC;
* non cambiare giorno durante la serializzazione;
* lo scheduler deve calcolare le date nel fuso applicativo;
* la settimana inizia di lunedì;
* i giorni del mese devono essere gestiti esplicitamente.

Centralizzare i calcoli in una utility dedicata.

---

# Ricorrenza giornaliera

Formula:

```text
prossima data = data corrente + interval giorni
```

Esempio:

```text
startDate = 2026-07-01
frequency = DAILY
interval = 3
```

Occorrenze:

```text
1 luglio
4 luglio
7 luglio
10 luglio
```

---

# Ricorrenza settimanale

Formula:

```text
prossima data = data corrente + interval settimane
```

La prima versione può mantenere lo stesso giorno della settimana di `startDate`.

Esempio:

```text
startDate = lunedì 6 luglio
frequency = WEEKLY
interval = 2
```

Occorrenze:

```text
6 luglio
20 luglio
3 agosto
```

Non implementare ancora più giorni della stessa settimana, come lunedì e venerdì, salvo che ciò sia già facilmente supportato dall’architettura.

Documentare questa limitazione.

---

# Ricorrenza mensile

La ricorrenza mensile deve mantenere il giorno del mese di `startDate`.

Esempio:

```text
startDate = 15 gennaio
```

Occorrenze:

```text
15 febbraio
15 marzo
15 aprile
```

## Giorni non presenti nel mese

Definire una regola esplicita.

Strategia consigliata:

```text
Usare l’ultimo giorno disponibile del mese.
```

Esempio:

```text
startDate = 31 gennaio
```

Occorrenze:

```text
28 febbraio 2027
31 marzo 2027
30 aprile 2027
```

Per anno bisestile:

```text
29 febbraio
```

Non spostare permanentemente il giorno base da 31 a 28.

Conservare il giorno originale della regola.

Valutare un campo:

```text
anchorDay
```

oppure ricavarlo sempre da `startDate`.

---

# Ricorrenza annuale

La ricorrenza annuale deve mantenere:

* giorno;
* mese.

Esempio:

```text
15 giugno di ogni anno
```

## Caso 29 febbraio

Definire una regola esplicita.

Strategia consigliata:

```text
In anni non bisestili usare il 28 febbraio.
```

Documentare la decisione.

Non generare errori o saltare silenziosamente l’anno.

---

# Data di fine

`endDate` è opzionale.

Quando presente:

* non generare occorrenze successive;
* completare la regola quando non esistono altre date valide;
* consentire un’ultima occorrenza esattamente in `endDate`;
* validare che `endDate >= startDate`.

---

# Numero massimo di occorrenze

`maxOccurrences` è opzionale.

Regole:

* intero maggiore di zero;
* il conteggio comprende tutte le spese generate dalla regola;
* quando `generatedCount >= maxOccurrences`, impostare `COMPLETED`;
* non generare altre spese;
* se sono presenti sia `endDate` sia `maxOccurrences`, applicare il limite raggiunto per primo.

Esempio:

```text
Rata mensile per 36 mesi
```

---

# Orizzonte di generazione

Non generare tutte le occorrenze future al momento della creazione.

Utilizzare un orizzonte anticipato:

```text
generateDaysAhead
```

Valore predefinito consigliato:

```text
30 giorni
```

Esempio:

* oggi: 16 luglio;
* orizzonte: 30 giorni;
* generare le occorrenze fino al 15 agosto incluso.

Consentire un intervallo ragionevole, per esempio:

```text
1–365 giorni
```

Un orizzonte più ampio può essere utile per:

* rate;
* assicurazioni;
* report futuri;
* calendario.

Non generare mai occorrenze senza limite temporale.

---

# Strategia di generazione

Lo scheduler deve:

1. recuperare ricorrenze `ACTIVE`;
2. escludere soft deleted;
3. individuare quelle con `nextOccurrenceDate` entro l’orizzonte;
4. generare una o più occorrenze fino al limite;
5. aggiornare `lastGeneratedDate`;
6. aggiornare `nextOccurrenceDate`;
7. incrementare `generatedCount`;
8. impostare `COMPLETED` quando necessario;
9. mantenere idempotenza;
10. continuare sulle altre regole in caso di errore isolato.

---

# Scheduler NestJS

Riutilizzare:

```text
@nestjs/schedule
```

già introdotto nella Fase 8.

Creare, per esempio:

```text
RecurrenceSchedulerService
```

Non inizializzare una seconda volta `ScheduleModule.forRoot()` se già configurato a livello applicativo.

Frequenza consigliata:

```text
ogni ora
```

Non è necessario eseguire il generatore ogni minuto.

Variabile d’ambiente:

```env
RECURRENCE_SCHEDULER_CRON=0 * * * *
```

Aggiungere anche:

```env
DEFAULT_RECURRENCE_GENERATION_DAYS_AHEAD=30
MAX_RECURRENCE_GENERATION_DAYS_AHEAD=365
```

Validare la configurazione.

---

# Idempotenza

La generazione deve essere idempotente.

Una stessa combinazione:

```text
recurrenceRuleId
occurrenceDate
```

deve produrre una sola spesa.

Usare:

* vincolo univoco;
* transazione;
* upsert o insert gestito;
* chiave idempotente.

Non affidarsi soltanto a:

```text
SELECT seguito da INSERT
```

senza vincolo database.

Eseguire test con:

* scheduler ripetuto;
* esecuzione concorrente;
* riavvio backend;
* occorrenza già esistente.

---

# Transazioni

Ogni generazione deve aggiornare in modo coerente:

* spesa;
* etichette della spesa;
* contatore;
* ultima data generata;
* prossima data;
* stato della regola.

Utilizzare una transazione Prisma.

Evitare che venga creata la spesa senza aggiornare la ricorrenza o viceversa.

---

# Integrazione con i promemoria

Le spese generate devono poter ricevere promemoria.

## Preset sulla ricorrenza

Consentire alla regola di definire promemoria predefiniti.

Esempio:

```text
Affitto:
- 3 giorni prima
- il giorno stesso
```

Quando viene generata una nuova spesa:

* copiare i preset;
* creare `ExpenseReminder`;
* calcolare `scheduledAt`;
* evitare duplicati.

È possibile creare una relazione dedicata:

```text
RecurrenceReminderTemplate
```

oppure salvare template strutturati secondo le convenzioni del progetto.

Non collegare direttamente lo stesso `ExpenseReminder` a più spese.

Ogni spesa deve avere i propri promemoria.

---

# Template promemoria Prisma

Struttura indicativa:

```prisma
model RecurrenceReminderTemplate {
  id               String         @id @default(uuid()) @db.Char(36)
  recurrenceRuleId String         @map("recurrence_rule_id") @db.Char(36)
  type             ReminderType
  offsetMinutes    Int?           @map("offset_minutes")
  customTime       DateTime?      @map("custom_time") @db.Time(0)
  createdAt        DateTime       @default(now()) @map("created_at")

  recurrenceRule RecurrenceRule @relation(fields: [recurrenceRuleId], references: [id], onDelete: Cascade)

  @@index([recurrenceRuleId])
  @@map("recurrence_reminder_templates")
}
```

Adattare al sistema promemoria già esistente.

Per una ricorrenza non usare normalmente date custom assolute, perché sarebbero valide soltanto per una specifica occorrenza.

Supportare:

* offset;
* ora del giorno;
* preset.

---

# Modifica di una ricorrenza

La modifica deve distinguere:

```text
SOLO_REGOLA_FUTURA
REGOLA_E_OCCORRENZE_FUTURE
```

Nella prima versione è sufficiente supportare chiaramente due scelte:

## Applica soltanto alle nuove occorrenze

Modifica la regola.

Non modificare le spese già generate.

## Aggiorna anche le spese future non completate

Modifica:

* spese generate dalla regola;
* con data futura o odierna;
* ancora `PLANNED`;
* non eliminate.

Non modificare automaticamente:

* spese `COMPLETED`;
* spese `CANCELLED`;
* spese manualmente scollegate;
* spese passate.

Chiedere una scelta esplicita nel frontend.

---

# Campi modificabili

Consentire la modifica di:

* nome;
* descrizione;
* importo;
* categoria;
* etichette;
* metodo di pagamento;
* esercente;
* note;
* ora;
* frequenza;
* intervallo;
* data di fine;
* numero massimo di occorrenze;
* orizzonte di generazione;
* template promemoria.

Modificare frequenza, intervallo o data di inizio richiede il ricalcolo di:

```text
nextOccurrenceDate
```

Non creare duplicati con occorrenze già generate.

---

# Modifica della data di inizio

Se la regola non ha ancora generato spese:

* consentire liberamente la modifica.

Se ha già generato spese:

* non modificare retroattivamente le occorrenze passate;
* ricalcolare soltanto le future;
* mostrare un avviso;
* evitare sovrapposizioni con date già generate.

Potrebbe essere più sicuro impedire la modifica della data di inizio dopo la prima generazione e chiedere di creare una nuova regola.

Scegliere una regola coerente e documentarla.

Preferire la soluzione più sicura.

---

# Modifica manuale di una spesa generata

Una spesa generata deve poter essere modificata manualmente.

La modifica di una singola spesa non deve modificare automaticamente la regola.

Esempio:

```text
Affitto normalmente 800 €
Ad agosto modificato manualmente a 850 €
```

Le occorrenze successive devono restare a 800 €, salvo modifica della regola.

Mostrare nel dettaglio:

```text
Generata dalla ricorrenza “Affitto appartamento”
```

Azione:

```text
Apri ricorrenza
```

---

# Scollegamento dalla ricorrenza

È facoltativo implementare:

```text
Scollega dalla ricorrenza
```

Se implementato:

* la spesa resta;
* `recurrenceRuleId` diventa `null`;
* non viene più aggiornata da modifiche bulk future;
* mantenere eventualmente un campo storico `generatedByRecurrence`.

Non è obbligatorio per questa fase.

Se non implementato, documentare la limitazione.

---

# Eliminazione di una spesa generata

Eliminare una singola spesa generata non deve cancellare la ricorrenza.

La ricorrenza non deve rigenerare automaticamente la stessa occorrenza eliminata.

Per evitare la rigenerazione, il soft-deleted record con chiave di occorrenza deve continuare a bloccare il duplicato.

Non rimuovere la chiave idempotente durante il soft delete.

---

# Saltare un’occorrenza

Implementare preferibilmente un’azione:

```text
Salta occorrenza
```

Una occorrenza saltata non deve essere rigenerata.

Possibili strategie:

* generare la spesa e impostarla `CANCELLED`;
* creare un record `RecurrenceException`;
* mantenere una chiave di esclusione.

Strategia consigliata:

```text
RecurrenceException
```

## RecurrenceException

```prisma
model RecurrenceException {
  id               String   @id @default(uuid()) @db.Char(36)
  recurrenceRuleId String   @map("recurrence_rule_id") @db.Char(36)
  occurrenceDate   DateTime @map("occurrence_date") @db.Date
  reason           String?  @db.VarChar(255)
  createdAt        DateTime @default(now()) @map("created_at")

  recurrenceRule RecurrenceRule @relation(fields: [recurrenceRuleId], references: [id], onDelete: Cascade)

  @@unique([recurrenceRuleId, occurrenceDate])
  @@index([recurrenceRuleId])
  @@map("recurrence_exceptions")
}
```

Lo scheduler deve ignorare le date escluse.

Se questa funzionalità rende la fase eccessivamente complessa, può essere rinviata, ma la decisione deve essere dichiarata.

---

# Pausa

Endpoint dedicato:

```http
PATCH /api/v1/recurrences/:id/pause
```

Comportamento:

* impostare `status = PAUSED`;
* impostare `pausedAt`;
* non generare nuove spese;
* mantenere le spese già generate;
* non cancellare promemoria delle spese già generate.

Consentire opzionalmente di annullare le occorrenze future già generate, ma soltanto tramite scelta esplicita.

---

# Riattivazione

Endpoint:

```http
PATCH /api/v1/recurrences/:id/resume
```

Alla riattivazione scegliere una strategia chiara.

Strategia consigliata:

```text
Riprendere dalla prima occorrenza futura valida rispetto a oggi.
```

Non generare automaticamente tutte le occorrenze passate durante la pausa.

Esempio:

* ricorrenza mensile;
* sospesa per 3 mesi;
* riattivata oggi;
* calcolare la prossima data futura;
* non creare arretrati.

Consentire eventualmente un’opzione futura per recuperare le occorrenze saltate, ma non implementarla ora.

---

# Terminazione

Endpoint:

```http
PATCH /api/v1/recurrences/:id/cancel
```

Comportamento:

* impostare `status = CANCELLED`;
* impostare `cancelledAt`;
* impedire nuove generazioni;
* mantenere le spese già generate.

Chiedere se:

```text
Mantenere le spese future già generate
Annullare le spese future già generate
```

Se l’utente sceglie di annullarle:

* aggiornare soltanto spese `PLANNED`;
* non modificare spese completate;
* non eliminare fisicamente;
* impostare `CANCELLED`.

---

# Completamento automatico

Impostare `COMPLETED` quando:

* viene superata `endDate`;
* viene raggiunto `maxOccurrences`;
* non esistono più date valide.

Impostare:

```text
completedAt
```

Una ricorrenza completata non può essere riattivata automaticamente.

È possibile consentire una modifica esplicita che estenda:

* data di fine;
* numero massimo di occorrenze.

In tal caso riportarla a `ACTIVE` dopo validazione.

---

# Soft delete della ricorrenza

L’eliminazione deve essere consentita soltanto con regole chiare.

## Regola mai utilizzata

Può essere soft deleted.

## Regola con spese generate

Preferire:

* terminazione;
* archiviazione;
* non cancellazione.

Endpoint:

```http
DELETE /api/v1/recurrences/:id
```

Può:

* impostare `deletedAt`;
* impedire nuove generazioni;
* mantenere le spese.

Non eliminare in cascata le spese generate.

---

# Backend NestJS

Creare:

```text
RecurrencesModule
```

Struttura indicativa:

```text
apps/backend/src/recurrences/
├── dto/
│   ├── create-recurrence.dto.ts
│   ├── update-recurrence.dto.ts
│   ├── recurrence-query.dto.ts
│   ├── recurrence-preview.dto.ts
│   ├── update-recurrence-scope.dto.ts
│   ├── pause-recurrence.dto.ts
│   └── cancel-recurrence.dto.ts
├── recurrences.controller.ts
├── recurrences.service.ts
├── recurrence-generator.service.ts
├── recurrence-scheduler.service.ts
├── recurrence-calculator.service.ts
├── recurrences.mapper.ts
├── recurrences.types.ts
├── recurrences.utils.ts
├── recurrences.module.ts
└── recurrences.service.spec.ts
```

Responsabilità:

## RecurrencesController

* CRUD;
* pausa;
* ripresa;
* terminazione;
* anteprima;
* lista delle occorrenze.

## RecurrencesService

* ownership;
* validazione;
* creazione;
* modifica;
* stato;
* query.

## RecurrenceCalculatorService

* calcolo date;
* frequenze;
* intervalli;
* giorni mancanti;
* ultimo giorno del mese;
* anno bisestile.

Deve contenere funzioni pure e facilmente testabili.

## RecurrenceGeneratorService

* creazione Expense;
* copia etichette;
* copia template promemoria;
* transazioni;
* idempotenza.

## RecurrenceSchedulerService

* ricerca regole dovute;
* generazione entro orizzonte;
* gestione errori;
* log.

Non inserire business logic nel controller.

---

# Endpoint REST

Utilizzare il prefisso:

```text
/api/v1/recurrences
```

Tutti gli endpoint devono essere autenticati.

Implementare almeno:

```http
GET    /api/v1/recurrences
POST   /api/v1/recurrences
GET    /api/v1/recurrences/:id
PATCH  /api/v1/recurrences/:id
DELETE /api/v1/recurrences/:id

GET    /api/v1/recurrences/:id/expenses
GET    /api/v1/recurrences/:id/preview

PATCH  /api/v1/recurrences/:id/pause
PATCH  /api/v1/recurrences/:id/resume
PATCH  /api/v1/recurrences/:id/cancel
```

È possibile aggiungere:

```http
POST /api/v1/recurrences/:id/generate
```

soltanto in development o per un’azione manuale amministrativa controllata.

Non esporre un endpoint che permetta generazione arbitraria e duplicata.

---

# Lista ricorrenze

Endpoint:

```http
GET /api/v1/recurrences
```

Query parameter:

```text
page
pageSize
search
status
frequency
categoryId
paymentMethod
sortBy
sortDirection
```

Default:

```text
page=1
pageSize=20
sortBy=nextOccurrenceDate
sortDirection=asc
```

Risposta indicativa:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Affitto appartamento",
      "description": "Affitto mensile",
      "amount": "800.00",
      "frequency": "MONTHLY",
      "interval": 1,
      "status": "ACTIVE",
      "startDate": "2026-01-01",
      "endDate": null,
      "nextOccurrenceDate": "2026-08-01",
      "generatedCount": 7,
      "maxOccurrences": null,
      "category": {
        "id": "uuid",
        "name": "Affitto",
        "color": "#A8B9E0",
        "icon": "bi-building"
      },
      "labels": []
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 4,
    "totalPages": 1
  }
}
```

---

# Creazione ricorrenza

Endpoint:

```http
POST /api/v1/recurrences
```

Esempio:

```json
{
  "name": "Affitto appartamento",
  "description": "Affitto mensile",
  "amount": "800.00",
  "categoryId": "uuid",
  "labelIds": ["uuid-label"],
  "merchant": "Proprietario",
  "paymentMethod": "BANK_TRANSFER",
  "notes": null,
  "frequency": "MONTHLY",
  "interval": 1,
  "startDate": "2026-08-01",
  "endDate": null,
  "maxOccurrences": null,
  "expenseTime": "09:00",
  "generateDaysAhead": 60,
  "reminderTemplates": [
    {
      "type": "THREE_DAYS_BEFORE"
    },
    {
      "type": "SAME_DAY"
    }
  ]
}
```

Il backend deve:

1. validare il DTO;
2. recuperare l’utente dal JWT;
3. validare categoria;
4. validare etichette;
5. validare importo;
6. validare date;
7. validare frequenza e intervallo;
8. calcolare la prima occorrenza;
9. creare la regola;
10. creare le relazioni;
11. creare i template promemoria;
12. generare le occorrenze nell’orizzonte, se previsto;
13. restituire la ricorrenza tramite mapper.

---

# Anteprima delle occorrenze

Endpoint:

```http
GET /api/v1/recurrences/:id/preview?limit=10
```

Per una regola non ancora salvata è possibile aggiungere:

```http
POST /api/v1/recurrences/preview
```

Body con i dati temporali della ricorrenza.

Restituire le prossime date previste senza creare record.

Esempio:

```json
{
  "dates": [
    "2026-08-01",
    "2026-09-01",
    "2026-10-01"
  ]
}
```

Limitare:

```text
1–50 date
```

L’anteprima deve usare esattamente lo stesso calcolatore della generazione reale.

Non duplicare algoritmi frontend e backend.

---

# Dettaglio ricorrenza

Endpoint:

```http
GET /api/v1/recurrences/:id
```

Restituire:

* dati principali;
* categoria;
* etichette;
* promemoria template;
* prossima occorrenza;
* ultima occorrenza generata;
* numero generato;
* limite;
* stato;
* riepilogo delle prossime date;
* conteggio delle spese collegate.

Restituire `404` per ricorrenze:

* inesistenti;
* altrui;
* eliminate.

---

# Spese generate

Endpoint:

```http
GET /api/v1/recurrences/:id/expenses
```

Query:

```text
page
pageSize
status
dateFrom
dateTo
sortDirection
```

Mostrare esclusivamente spese:

```text
recurrenceRuleId = :id
```

Riutilizzare mapper e modelli della Fase 4.

Non duplicare il CRUD delle spese.

---

# Modifica ricorrenza

Endpoint:

```http
PATCH /api/v1/recurrences/:id
```

Body indicativo:

```json
{
  "amount": "850.00",
  "endDate": "2027-12-01",
  "updateScope": "RULE_AND_FUTURE_PLANNED_EXPENSES"
}
```

Scope supportati:

```text
RULE_ONLY
RULE_AND_FUTURE_PLANNED_EXPENSES
```

Validare lo scope.

Le modifiche bulk devono essere eseguite in transazione.

Non modificare spese:

* completate;
* annullate;
* eliminate;
* passate, salvo decisione esplicita e sicura.

---

# DTO backend

Creare almeno:

```text
CreateRecurrenceDto
UpdateRecurrenceDto
RecurrenceQueryDto
RecurrencePreviewDto
RecurrenceExpensesQueryDto
UpdateRecurrenceScopeDto
CancelRecurrenceDto
```

Validazioni minime:

## Name

* obbligatorio;
* massimo 150 caratteri.

## Description

* obbligatoria;
* massimo 150 caratteri.

## Amount

* maggiore di zero;
* massimo due decimali;
* compatibile con `Decimal(12,2)`.

## Frequency

* enum valido.

## Interval

* intero;
* minimo 1;
* massimo ragionevole, per esempio 365.

## Start date

* formato `YYYY-MM-DD`;
* data valida.

## End date

* opzionale;
* formato valido;
* non precedente alla data iniziale.

## Max occurrences

* opzionale;
* intero;
* minimo 1;
* massimo ragionevole.

## Generate days ahead

* intero;
* minimo 1;
* massimo configurato.

## Category and labels

* UUID validi;
* ownership e accessibilità verificate.

## Reminder templates

* preset validi;
* nessun duplicato;
* valori compatibili con la frequenza e le date.

---

# Mapper backend

Creare:

```text
RecurrencesMapper
```

Responsabilità:

* Decimal → stringa;
* date locali;
* ora;
* categoria;
* etichette;
* frequenza;
* stato;
* prossima occorrenza;
* contatori;
* template promemoria;
* dati tecnici consentiti.

Non restituire oggetti Prisma direttamente.

Non esporre:

* chiavi idempotenti;
* dettagli interni dello scheduler;
* campi non necessari.

---

# Logging scheduler

Produrre log sintetici:

```text
Recurrence scheduler processed 8 active rules.
Recurrence scheduler generated 5 expenses.
Recurrence scheduler completed 1 rule.
Recurrence scheduler skipped 2 existing occurrences.
```

Per errori isolati:

* registrare ID regola;
* continuare;
* non bloccare l’intero ciclo.

Non inserire:

* token;
* note complete;
* informazioni sensibili.

---

# Swagger

Documentare:

* endpoint;
* autenticazione Bearer;
* frequenze;
* stati;
* intervalli;
* date;
* orizzonte di generazione;
* scope di aggiornamento;
* pausa;
* ripresa;
* terminazione;
* anteprima;
* importi;
* idempotenza;
* casi limite mensili;
* comportamento del 29 febbraio;
* comportamento del giorno 31;
* errori.

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

Creare o completare le route:

```text
/recurrences
/recurrences/new
/recurrences/:id
/recurrences/:id/edit
```

Le route devono essere:

* protette da auth guard;
* lazy loaded, se coerente;
* collegate alla sidebar.

Aggiungere alla sidebar:

```text
Spese ricorrenti
```

Icona suggerita:

```text
bi-arrow-repeat
```

---

# Pagina ricorrenze

Creare:

```text
RecurrencesPageComponent
```

Struttura:

1. header;
2. card riepilogo;
3. filtri;
4. tabella o lista;
5. paginazione.

Header:

```text
Spese ricorrenti
Gestisci abbonamenti, rate e spese periodiche
```

Azioni:

```text
Nuova ricorrenza
```

---

# Riepilogo

Mostrare informazioni leggere:

* ricorrenze attive;
* ricorrenze in pausa;
* prossime occorrenze entro 30 giorni;
* totale previsto delle prossime occorrenze.

Non implementare analisi avanzate o grafici se non richiesti.

Le aggregazioni devono provenire dal backend se riguardano l’intero dataset.

---

# Filtri

Supportare:

* ricerca;
* stato;
* frequenza;
* categoria;
* metodo di pagamento.

La sezione può essere collassabile.

Usare `ng-select` già installato.

Sincronizzare i filtri con i query parameter.

Esempio:

```text
/recurrences?status=ACTIVE&frequency=MONTHLY&page=1
```

---

# Tabella ricorrenze

Colonne desktop:

* nome;
* importo;
* frequenza;
* categoria;
* prossima occorrenza;
* stato;
* numero generato;
* azioni.

Azioni:

* dettaglio;
* modifica;
* pausa;
* riprendi;
* termina;
* elimina, quando consentito.

Mostrare frequenza in forma leggibile:

```text
Ogni mese
Ogni 2 settimane
Ogni 3 mesi
Ogni anno
```

---

# Vista mobile

Su mobile usare card con:

* nome;
* importo;
* frequenza;
* prossima data;
* stato;
* categoria;
* menu azioni.

Non comprimere la tabella desktop.

---

# Form ricorrenza

Creare:

```text
RecurrenceFormComponent
```

Campi:

* nome;
* descrizione della spesa;
* importo;
* categoria;
* etichette;
* metodo di pagamento;
* esercente;
* note;
* frequenza;
* intervallo;
* data di inizio;
* data di fine opzionale;
* massimo numero di occorrenze opzionale;
* ora opzionale;
* orizzonte di generazione;
* promemoria predefiniti.

Usare Angular Reactive Forms.

Non usare `any`.

---

# Form frequenza

Mostrare campi dinamici.

Esempi:

## Giornaliera

```text
Ripeti ogni [3] giorni
```

## Settimanale

```text
Ripeti ogni [2] settimane
```

## Mensile

```text
Ripeti ogni [1] mese
```

## Annuale

```text
Ripeti ogni [1] anno
```

Mostrare sempre una frase riepilogativa.

Esempio:

```text
La spesa verrà pianificata ogni mese a partire dal 1 agosto 2026.
```

---

# Anteprima date

Il form deve mostrare le prossime occorrenze.

Esempio:

```text
Prossime date

1 agosto 2026
1 settembre 2026
1 ottobre 2026
1 novembre 2026
```

L’anteprima deve provenire dal backend o utilizzare una utility condivisa verificata contro il backend.

Preferire l’endpoint backend per garantire coerenza.

Applicare debounce durante la modifica del form.

Non inviare richieste finché i dati minimi non sono validi.

---

# Data di fine e numero occorrenze

Consentire:

* nessuna fine;
* data di fine;
* numero massimo di occorrenze.

È possibile consentire entrambi, applicando il primo limite raggiunto.

Mostrare chiaramente il comportamento.

Esempio:

```text
Termina dopo 36 occorrenze o il 1 agosto 2029, a seconda di quale condizione si verifica prima.
```

---

# Promemoria nel form

Riutilizzare:

```text
ExpenseReminderFormComponent
```

Adattarlo per creare template.

Consentire:

* giorno stesso;
* 1 giorno prima;
* 3 giorni prima;
* 7 giorni prima;
* ora del promemoria.

Non usare date assolute personalizzate per una serie ricorrente.

---

# Dettaglio ricorrenza

Creare:

```text
RecurrenceDetailComponent
```

Mostrare:

* nome;
* descrizione;
* importo;
* categoria;
* etichette;
* frequenza;
* intervallo;
* stato;
* data iniziale;
* data finale;
* massimo occorrenze;
* numero generato;
* ultima data generata;
* prossima data;
* orizzonte;
* promemoria;
* spese collegate.

Azioni:

* modifica;
* pausa;
* riprendi;
* termina;
* apri prossima spesa;
* visualizza tutte le spese generate.

---

# Conferme

## Pausa

Messaggio:

```text
La ricorrenza verrà sospesa e non genererà nuove spese.
```

## Ripresa

Messaggio:

```text
La ricorrenza riprenderà dalla prossima data futura disponibile.
```

## Terminazione

Chiedere:

```text
Cosa vuoi fare con le spese future già generate?
```

Opzioni:

```text
Mantienile pianificate
Annullale
```

## Modifica

Chiedere:

```text
Dove vuoi applicare le modifiche?
```

Opzioni:

```text
Solo alle nuove occorrenze
Anche alle spese future pianificate
```

---

# Indicazione nelle spese

Nella pagina e nel dettaglio spesa mostrare un indicatore:

```text
Spesa ricorrente
```

Mostrare anche:

```text
Generata da: Affitto appartamento
```

Azione:

```text
Apri ricorrenza
```

Non mostrare l’indicatore per spese manuali.

---

# Calendario

Le spese generate devono comparire automaticamente nel calendario come normali spese `PLANNED`.

È possibile mostrare un’icona:

```text
bi-arrow-repeat
```

per distinguerle.

Non modificare l’endpoint calendario se il mapping delle spese è già sufficiente.

Aggiungere soltanto il campo necessario:

```text
generatedByRecurrence
```

e il riferimento sintetico alla regola.

---

# Dashboard e report

Le spese generate:

* sono incluse nelle spese pianificate;
* non incidono sui totali effettivi finché non diventano `COMPLETED`;
* compaiono nelle prossime spese;
* compaiono nei report pianificati;
* rispettano le stesse regole delle altre spese.

Non aggiungere direttamente i valori della regola alle aggregazioni.

Aggregare soltanto le spese realmente generate.

---

# Notifiche

I promemoria delle spese generate devono funzionare tramite il sistema della Fase 8.

La ricorrenza non deve generare direttamente notifiche.

Flusso:

```text
RecurrenceRule
→ Expense PLANNED
→ ExpenseReminder
→ Notification
```

Mantenere questa separazione.

---

# Servizi Angular

Creare:

```text
RecurrenceService
```

Responsabilità:

* lista;
* dettaglio;
* creazione;
* modifica;
* eliminazione;
* pausa;
* ripresa;
* terminazione;
* anteprima;
* spese generate.

È possibile creare:

```text
RecurrenceStore
```

basato su Signals.

Stato indicativo:

```text
recurrences
selectedRecurrence
previewDates
loading
previewLoading
error
filters
pagination
```

Non introdurre NgRx.

---

# Modelli TypeScript

Definire almeno:

```text
RecurrenceRule
RecurrenceFrequency
RecurrenceStatus
RecurrenceCategory
RecurrenceLabel
RecurrenceReminderTemplate
CreateRecurrenceRequest
UpdateRecurrenceRequest
RecurrenceQueryParams
RecurrencePreviewRequest
RecurrencePreviewResponse
RecurrenceUpdateScope
CancelRecurrenceRequest
PaginatedRecurrenceResponse
```

Non usare `any`.

Separare:

* risposta API;
* form value;
* payload;
* stato UI;
* anteprima.

---

# Query parameter frontend

Lista:

```text
/recurrences?page=1&status=ACTIVE&frequency=MONTHLY
```

Regole:

* refresh conserva filtri;
* avanti e indietro funzionano;
* reset rimuove parametri;
* cambio filtro torna a pagina 1;
* evitare richieste duplicate;
* non inserire valori vuoti.

---

# Toast e messaggi

Successo:

```text
Ricorrenza creata.
Ricorrenza aggiornata.
Ricorrenza sospesa.
Ricorrenza riattivata.
Ricorrenza terminata.
Spese future aggiornate.
```

Errori:

```text
Non è stato possibile salvare la ricorrenza.
La data di fine non è valida.
L’intervallo deve essere maggiore di zero.
La categoria selezionata non è disponibile.
Una o più etichette non sono valide.
Non è stato possibile generare le prossime occorrenze.
```

Non mostrare errori tecnici.

---

# Empty state

## Nessuna ricorrenza

```text
Non hai ancora configurato spese ricorrenti.
```

Azioni:

```text
Crea la prima ricorrenza
```

## Nessun risultato

```text
Nessuna ricorrenza corrisponde ai filtri applicati.
```

Azione:

```text
Azzera filtri
```

## Nessuna spesa generata

```text
Questa ricorrenza non ha ancora generato spese.
```

---

# Loading state

Mostrare skeleton per:

* lista;
* dettaglio;
* anteprima;
* spese generate.

Durante l’anteprima:

* non bloccare tutto il form;
* mostrare uno spinner locale;
* cancellare richieste obsolete con `switchMap`.

---

# Accessibilità

Garantire:

* label associate ai campi;
* riepilogo leggibile della frequenza;
* anteprima accessibile;
* focus visibile;
* conferme comprensibili;
* stato non indicato soltanto dal colore;
* pulsanti icona con `aria-label`;
* modali con focus trap;
* messaggi di errore associati ai campi;
* alternativa alle interazioni complesse.

---

# Responsive design

## Desktop

* tabella completa;
* form su più colonne;
* anteprima laterale;
* dettaglio con riepilogo e spese generate.

## Tablet

* form in griglia;
* anteprima sotto i campi;
* tabella con scroll controllato.

## Mobile

* card;
* campi impilati;
* anteprima compatta;
* azioni in menu;
* modali quasi a schermo intero.

Mantenere:

* Reddit Sans;
* tema light;
* palette pastello;
* stile gestionale;
* `ng-select`;
* datepicker già adottato dal progetto.

---

# Prestazioni

Lo scheduler deve recuperare soltanto ricorrenze:

* attive;
* non eliminate;
* con prossima data entro l’orizzonte.

Non scansionare tutte le ricorrenze senza filtri.

La lista deve essere paginata server-side.

Le spese generate devono usare inserimenti controllati e transazioni.

Non generare migliaia di occorrenze in una singola operazione.

Imporre un limite massimo di sicurezza per ciclo, per esempio:

```text
500 occorrenze
```

Configurabile se necessario.

---

# Sicurezza e ownership

Ogni endpoint deve verificare l’utente autenticato.

Un utente non deve poter:

* leggere ricorrenze altrui;
* modificarle;
* sospenderle;
* riattivarle;
* terminarle;
* visualizzarne le spese;
* utilizzare categorie o etichette altrui;
* generare spese per altri utenti.

Non accettare `userId` dal client.

Restituire `404` per risorse inesistenti o altrui.

---

# Seed development

Aggiornare il seed development con almeno:

* un affitto mensile;
* un abbonamento mensile;
* una rata con massimo numero di occorrenze;
* una ricorrenza annuale;
* una ricorrenza settimanale;
* una ricorrenza in pausa;
* una ricorrenza completata;
* spese generate;
* template promemoria;
* almeno una categoria personalizzata.

Il seed deve essere:

* idempotente;
* legato all’utente demo;
* eseguito soltanto in development.

Non creare ricorrenze demo in produzione.

---

# Test backend

Scrivere test almeno per:

## Calcolo date

* giornaliera;
* giornaliera con intervallo;
* settimanale;
* settimanale con intervallo;
* mensile;
* mensile giorno 31;
* febbraio;
* anno bisestile;
* annuale;
* 29 febbraio;
* data finale;
* numero massimo occorrenze.

## Creazione

* ricorrenza valida;
* importo non valido;
* intervallo zero;
* data finale precedente;
* categoria altrui;
* etichetta altrui;
* promemoria duplicati;
* ownership.

## Generazione

* generazione singola;
* più occorrenze nell’orizzonte;
* nessuna occorrenza dovuta;
* idempotenza;
* scheduler ripetuto;
* concorrenza;
* soft-deleted occurrence non rigenerata;
* copia categoria;
* copia etichette;
* copia promemoria;
* stato iniziale `PLANNED`;
* aggiornamento contatore;
* aggiornamento prossima data;
* completamento automatico.

## Stati

* pausa;
* nessuna generazione in pausa;
* ripresa senza arretrati;
* terminazione;
* mantenimento spese future;
* annullamento spese future;
* completamento.

## Modifica

* solo regola;
* regola e spese future;
* esclusione completate;
* esclusione annullate;
* ricalcolo prossima data;
* cambio importo;
* cambio categoria;
* cambio etichette;
* modifica dopo generazione.

## Sicurezza

* isolamento utenti;
* `404` per ricorrenza altrui;
* impossibilità di associare dati altrui.

---

# Test frontend

Scrivere test almeno per:

* lista;
* filtri;
* paginazione;
* creazione;
* validazione form;
* frequenza;
* intervallo;
* data finale;
* numero occorrenze;
* anteprima;
* debounce anteprima;
* stato loading;
* errore anteprima;
* dettaglio;
* modifica;
* scelta scope;
* pausa;
* ripresa;
* terminazione;
* scelta sulle spese future;
* spese generate;
* indicatore nella spesa;
* collegamento alla ricorrenza;
* empty state;
* error state;
* query parameter;
* responsive essenziale;
* accessibilità.

---

# Verifica manuale

Al termine verificare almeno:

1. effettuare il login;
2. aprire le ricorrenze;
3. creare un affitto mensile;
4. verificare l’anteprima;
5. aggiungere etichette;
6. aggiungere promemoria;
7. generare o attendere il ciclo scheduler;
8. verificare la spesa nella pagina Spese;
9. verificare la spesa nel calendario;
10. verificare la spesa nella dashboard;
11. verificare i promemoria;
12. modificare l’importo solo per nuove occorrenze;
13. modificare importo anche sulle future pianificate;
14. verificare che le completate non cambino;
15. sospendere la ricorrenza;
16. verificare che non generi;
17. riattivarla;
18. verificare l’assenza di arretrati;
19. terminare una ricorrenza;
20. scegliere di mantenere le spese future;
21. terminare un’altra ricorrenza annullando le future;
22. verificare giorno 31;
23. verificare 29 febbraio;
24. eseguire due volte lo scheduler;
25. verificare l’assenza di duplicati;
26. accedere con un secondo utente;
27. confermare l’isolamento.

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
14. verificare scheduler;
15. verificare idempotenza;
16. verificare calendario, dashboard, report e notifiche;
17. verificare desktop e mobile;
18. correggere tutti gli errori trovati.

Eseguire i comandi separatamente se l’ambiente presenta problemi con stdout o stderr.

Non dichiarare superate verifiche non realmente eseguite.

---

# Variabili d’ambiente

Aggiornare `.env.example` con almeno:

```env
RECURRENCE_SCHEDULER_CRON=0 * * * *
DEFAULT_RECURRENCE_GENERATION_DAYS_AHEAD=30
MAX_RECURRENCE_GENERATION_DAYS_AHEAD=365
MAX_RECURRENCE_OCCURRENCES_PER_RUN=500
```

Validare i valori all’avvio.

Non inserire segreti.

---

# README

Documentare:

* frequenze supportate;
* intervalli;
* giorno 31;
* 29 febbraio;
* orizzonte di generazione;
* scheduler;
* idempotenza;
* pausa;
* ripresa;
* terminazione;
* modifica delle future occorrenze;
* integrazione con promemoria;
* variabili d’ambiente;
* limiti della prima versione.

---

# Vincoli

* Non creare un sistema parallelo di spese.
* Non generare spese `COMPLETED`.
* Non generare occorrenze infinite anticipatamente.
* Non modificare automaticamente spese completate.
* Non rigenerare spese eliminate.
* Non generare arretrati alla riattivazione.
* Non duplicare scheduler o business logic.
* Non duplicare notifiche.
* Non accettare `userId` dal client.
* Non usare `any`.
* Non disabilitare TypeScript strict.
* Non effettuare chiamate HTTP direttamente nei componenti.
* Non introdurre NgRx.
* Non introdurre code esterne.
* Non introdurre Redis.
* Non usare `prisma db push` come soluzione finale.
* Non forzare dipendenze incompatibili.
* Non lasciare TODO bloccanti.
* Non ignorare errori di test, lint o build.
* Non riscrivere funzionalità funzionanti delle fasi precedenti.

---

# Output finale richiesto all’agente

Concludere con un riepilogo contenente:

* funzionalità implementate;
* modelli Prisma aggiunti;
* migrazione creata;
* enum aggiunti;
* endpoint disponibili;
* frequenze supportate;
* strategia per giorni 31 e 29 febbraio;
* strategia di generazione anticipata;
* orizzonte configurato;
* strategia di idempotenza;
* comportamento di pausa e ripresa;
* comportamento di terminazione;
* scope di modifica;
* integrazione con spese;
* integrazione con calendario;
* integrazione con notifiche;
* componenti Angular creati o riutilizzati;
* test realmente eseguiti;
* build realmente eseguite;
* verifica Swagger;
* verifica Docker;
* verifica scheduler;
* problemi corretti;
* eventuali limitazioni residue reali.

Non limitarsi al riepilogo: implementare prima integralmente la fase.
