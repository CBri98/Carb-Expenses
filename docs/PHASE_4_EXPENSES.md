# PHASE_4_EXPENSES.md

> Stato: implementata il 14 luglio 2026. Migrazione, seed, API, interfaccia Angular e verifiche eseguite sono riepilogati nel `README.md` e nella roadmap tecnica.

## Obiettivo

Implementare la **Fase 4 — Gestione delle spese** dell’applicazione descritta in `AGENTS.md`.

Al termine di questa fase l’utente autenticato deve poter:

* inserire una spesa;
* inserire rapidamente una spesa da qualsiasi pagina;
* consultare l’elenco delle proprie spese;
* cercare, filtrare, ordinare e paginare i risultati;
* visualizzare il dettaglio di una spesa;
* modificare una spesa;
* duplicare una spesa;
* cambiarne rapidamente lo stato;
* eliminarla tramite soft delete;
* esportare le spese filtrate in CSV.

Implementare direttamente il codice nel repository.

Non limitarsi a descrivere la soluzione.

---

# Operazioni preliminari

Prima di modificare il codice:

1. leggere integralmente `AGENTS.md`;
2. leggere integralmente `docs/PHASE_4_EXPENSES.md`;
3. analizzare la struttura corrente del repository;
4. eseguire `git status` e `git diff`;
5. verificare che autenticazione, categorie ed etichette siano funzionanti;
6. controllare schema Prisma, migrazioni, seed e API esistenti;
7. riutilizzare componenti, servizi e convenzioni già presenti;
8. correggere soltanto eventuali problemi bloccanti delle fasi precedenti;
9. evitare refactoring non necessari;
10. non ricominciare da zero.

---

# Ambito della fase

Implementare:

* modello Prisma delle spese;
* relazione tra spese, categorie ed etichette;
* enum dello stato;
* enum del metodo di pagamento;
* migrazione Prisma;
* seed di alcune spese demo solo in development;
* CRUD NestJS;
* ownership e isolamento dei dati;
* ricerca server-side;
* filtri server-side;
* ordinamento server-side;
* paginazione server-side;
* duplicazione;
* cambio rapido di stato;
* soft delete;
* esportazione CSV;
* pagina Angular delle spese;
* dettaglio della spesa;
* form di creazione e modifica;
* inserimento rapido globale;
* tabella gestionale responsive;
* test backend;
* test frontend;
* Swagger;
* aggiornamento README.

Non implementare ancora:

* dashboard con KPI reali;
* grafici Chart.js;
* confronto mensile;
* calendario;
* notifiche;
* promemoria automatici;
* ricorrenze;
* allegati o ricevute;
* importazione bancaria;
* budget mensili.

È possibile registrare spese future con stato `PLANNED`, ma la visualizzazione a calendario sarà implementata successivamente.

---

# Requisiti della spesa

Ogni spesa deve appartenere a un singolo utente.

Campi richiesti:

* descrizione;
* importo;
* data della spesa;
* categoria;
* metodo di pagamento;
* stato.

Campi opzionali:

* ora;
* una o più etichette;
* esercente o beneficiario;
* note.

Campi tecnici:

* ID;
* utente proprietario;
* data di creazione;
* data di modifica;
* data di eliminazione opzionale.

Non accettare mai `userId` dal frontend.

L’utente deve essere ricavato esclusivamente dal token JWT.

---

# Stati della spesa

Utilizzare:

```text
COMPLETED
PLANNED
CANCELLED
```

Significato:

* `COMPLETED`: spesa già sostenuta;
* `PLANNED`: spesa futura o ancora prevista;
* `CANCELLED`: spesa annullata.

Regole:

* quando il frontend rileva una data futura, deve proporre automaticamente `PLANNED`;
* non sovrascrivere lo stato se l’utente lo ha modificato manualmente;
* una spesa futura può essere impostata come completata;
* una spesa passata può restare pianificata;
* una spesa annullata non deve essere eliminata;
* lo stato deve essere sempre validato anche dal backend.

---

# Metodi di pagamento

Utilizzare almeno:

```text
CASH
DEBIT_CARD
CREDIT_CARD
BANK_TRANSFER
DIRECT_DEBIT
DIGITAL_WALLET
CHECK
OTHER
```

Etichette frontend:

```text
CASH             Contanti
DEBIT_CARD       Carta di debito
CREDIT_CARD      Carta di credito
BANK_TRANSFER    Bonifico
DIRECT_DEBIT     Addebito diretto
DIGITAL_WALLET   Portafoglio digitale
CHECK            Assegno
OTHER            Altro
```

Memorizzare nel database esclusivamente i valori enum stabili.

---

# Modello dati Prisma

Analizzare lo schema esistente e adattare nomi, tipi UUID e relazioni alle convenzioni già utilizzate.

Non duplicare modelli o campi già presenti.

## Enum

```prisma
enum ExpenseStatus {
  COMPLETED
  PLANNED
  CANCELLED
}

enum PaymentMethod {
  CASH
  DEBIT_CARD
  CREDIT_CARD
  BANK_TRANSFER
  DIRECT_DEBIT
  DIGITAL_WALLET
  CHECK
  OTHER
}
```

## Expense

Struttura indicativa:

```prisma
model Expense {
  id            String        @id @default(uuid()) @db.Char(36)
  userId        String        @map("user_id") @db.Char(36)
  categoryId    String        @map("category_id") @db.Char(36)
  description   String        @db.VarChar(150)
  amount        Decimal       @db.Decimal(12, 2)
  expenseDate   DateTime      @map("expense_date") @db.Date
  expenseTime   DateTime?     @map("expense_time") @db.Time(0)
  merchant      String?       @db.VarChar(150)
  paymentMethod PaymentMethod @default(OTHER) @map("payment_method")
  notes         String?       @db.Text
  status        ExpenseStatus @default(COMPLETED)
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")
  deletedAt     DateTime?     @map("deleted_at")

  user     User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category       @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  labels   ExpenseLabel[]

  @@index([userId, expenseDate])
  @@index([userId, status])
  @@index([userId, categoryId])
  @@index([userId, paymentMethod])
  @@index([deletedAt])
  @@map("expenses")
}
```

## ExpenseLabel

```prisma
model ExpenseLabel {
  expenseId String @map("expense_id") @db.Char(36)
  labelId   String @map("label_id") @db.Char(36)

  expense Expense @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  label   Label   @relation(fields: [labelId], references: [id], onDelete: Cascade)

  @@id([expenseId, labelId])
  @@index([labelId])
  @@map("expense_labels")
}
```

Aggiungere le relazioni inverse necessarie:

```prisma
model User {
  // campi esistenti
  expenses Expense[]
}
```

```prisma
model Category {
  // campi esistenti
  expenses Expense[]
}
```

```prisma
model Label {
  // campi esistenti
  expenses ExpenseLabel[]
}
```

Verificare la compatibilità dei tipi nativi Prisma con MariaDB.

Creare una migrazione descrittiva, per esempio:

```text
add_expenses
```

Non usare `prisma db push` come sostituto permanente delle migrazioni.

---

# Gestione degli importi

Gli importi devono essere memorizzati come `DECIMAL`.

Regole:

* non utilizzare `Float` o `Double`;
* importo obbligatorio;
* importo maggiore di zero;
* massimo due cifre decimali;
* limite compatibile con `Decimal(12,2)`;
* non affidarsi ai floating point JavaScript per calcoli finanziari;
* centralizzare conversione e formattazione.

Preferire importi API serializzati come stringa:

```json
{
  "amount": "1250.50"
}
```

Il frontend deve visualizzare:

```text
1.250,50 €
```

Creare un mapper dedicato per convertire `Prisma.Decimal`.

Non restituire direttamente oggetti Prisma.

---

# Gestione delle date

La data della spesa deve rappresentare una data locale.

Regole:

* input API nel formato `YYYY-MM-DD`;
* evitare conversioni che cambiano il giorno a causa del fuso orario;
* mantenere l’ora separata;
* accettare l’ora nei formati `HH:mm` oppure `HH:mm:ss`;
* timestamp tecnici in UTC;
* interfaccia con locale `it-IT`;
* fuso orario applicativo `Europe/Rome`.

Centralizzare parsing e serializzazione.

Non inserire conversioni duplicate nei componenti Angular.

---

# Regole di validazione

## Descrizione

* obbligatoria;
* massimo 150 caratteri;
* rimuovere spazi iniziali e finali;
* rifiutare una stringa vuota dopo la normalizzazione.

## Importo

* obbligatorio;
* maggiore di zero;
* massimo due cifre decimali;
* validare sia virgola sia punto nel frontend;
* inviare al backend un formato decimale coerente.

## Data

* obbligatoria;
* formato `YYYY-MM-DD`;
* data valida.

## Ora

* opzionale;
* formato `HH:mm` o `HH:mm:ss`;
* ora valida.

## Categoria

* obbligatoria;
* deve essere visibile all’utente;
* può essere globale predefinita;
* può essere personalizzata dall’utente;
* non può appartenere a un altro utente;
* non può essere soft deleted;
* deve essere attiva per una nuova spesa.

Durante la modifica di una vecchia spesa, una categoria successivamente disattivata deve comunque essere visualizzabile e mantenibile.

## Etichette

* opzionali;
* nessun duplicato;
* devono appartenere all’utente;
* non devono essere soft deleted;
* devono essere attive per un nuovo inserimento;
* durante la modifica, mostrare anche le etichette già associate che successivamente siano state disattivate.

## Esercente

* opzionale;
* massimo 150 caratteri;
* rimuovere spazi superflui.

## Note

* opzionali;
* massimo 5.000 caratteri;
* trattare come testo semplice;
* non renderizzare come HTML.

---

# Ownership e sicurezza

Ogni operazione deve verificare l’utente autenticato.

Un utente non deve poter:

* leggere spese altrui;
* modificare spese altrui;
* eliminare spese altrui;
* duplicare spese altrui;
* esportare spese altrui;
* associare categorie personalizzate altrui;
* associare etichette altrui.

Non distinguere pubblicamente tra:

* spesa inesistente;
* spesa appartenente a un altro utente;
* spesa eliminata.

In questi casi restituire normalmente `404`.

Non accettare `userId` dal client.

Non fidarsi degli ID mostrati dal frontend.

---

# Soft delete

L’eliminazione deve impostare:

```text
deletedAt
```

Regole:

* non eliminare fisicamente la spesa;
* escludere le spese eliminate dalle liste;
* escluderle dai dettagli;
* escluderle dall’esportazione;
* impedire modifica, duplicazione e cambio stato;
* mantenere i dati necessari per eventuali funzionalità future.

Non implementare ancora cestino e ripristino.

---

# Backend NestJS

Creare o completare:

```text
ExpensesModule
```

Struttura consigliata:

```text
apps/backend/src/expenses/
├── dto/
│   ├── create-expense.dto.ts
│   ├── update-expense.dto.ts
│   ├── update-expense-status.dto.ts
│   ├── duplicate-expense.dto.ts
│   ├── expense-query.dto.ts
│   └── expense-export-query.dto.ts
├── expenses.controller.ts
├── expenses.service.ts
├── expenses.module.ts
├── expenses.mapper.ts
├── expenses.types.ts
└── expenses.service.spec.ts
```

I controller devono essere sottili.

La business logic deve essere nei service.

Utilizzare transazioni Prisma quando vengono modificate insieme:

* spesa;
* associazioni con etichette.

---

# Endpoint REST

Prefisso:

```text
/api/v1/expenses
```

Tutti gli endpoint devono essere autenticati.

---

## Creazione

```http
POST /api/v1/expenses
```

Esempio:

```json
{
  "description": "Spesa supermercato",
  "amount": "86.45",
  "expenseDate": "2026-07-14",
  "expenseTime": "18:30",
  "categoryId": "uuid-categoria",
  "labelIds": [
    "uuid-etichetta-1",
    "uuid-etichetta-2"
  ],
  "paymentMethod": "DEBIT_CARD",
  "merchant": "Supermercato",
  "notes": "Spesa settimanale",
  "status": "COMPLETED"
}
```

Il backend deve:

1. validare il DTO;
2. recuperare l’utente dal JWT;
3. validare categoria;
4. validare etichette;
5. normalizzare i valori;
6. creare la spesa;
7. creare le relazioni con le etichette;
8. restituire la risposta tramite mapper.

---

## Lista paginata

```http
GET /api/v1/expenses
```

Query parameter:

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

Esempio:

```text
/api/v1/expenses?page=1&pageSize=20&month=7&year=2026&status=COMPLETED
```

Risposta indicativa:

```json
{
  "data": [
    {
      "id": "uuid",
      "description": "Spesa supermercato",
      "amount": "86.45",
      "expenseDate": "2026-07-14",
      "expenseTime": "18:30",
      "merchant": "Supermercato",
      "paymentMethod": "DEBIT_CARD",
      "status": "COMPLETED",
      "category": {
        "id": "uuid",
        "name": "Spesa alimentare",
        "color": "#16A34A",
        "icon": "bi-basket"
      },
      "labels": []
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 43,
    "totalPages": 3
  }
}
```

Adattare la struttura al formato API standard già presente nel progetto.

---

# Ricerca

Il parametro `search` deve cercare almeno in:

* descrizione;
* esercente;
* note.

La ricerca deve:

* essere limitata alle spese dell’utente;
* escludere le spese eliminate;
* essere combinabile con gli altri filtri;
* usare la collation MariaDB esistente per la ricerca case-insensitive;
* rimuovere spazi superflui.

Non caricare tutte le spese per filtrare nel frontend.

---

# Filtri

## Intervallo di date

Supportare:

```text
dateFrom
dateTo
```

Validazioni:

* date valide;
* `dateFrom` non successiva a `dateTo`.

## Mese e anno

Supportare:

```text
month
year
```

Validazioni:

* mese tra 1 e 12;
* anno in un intervallo ragionevole.

Non accettare contemporaneamente:

* intervallo `dateFrom/dateTo`;
* filtro `month/year`;

se la combinazione crea ambiguità.

Restituire `400` con un messaggio comprensibile.

## Categoria

Supportare:

```text
categoryId
```

## Etichette

Supportare uno o più ID:

```text
labelIds=id1,id2,id3
```

Usare in questa fase semantica `ANY`:

> la spesa deve avere almeno una delle etichette richieste.

Documentare la scelta in Swagger.

## Stato

Supportare un singolo stato:

```text
status=COMPLETED
```

## Metodo di pagamento

Supportare:

```text
paymentMethod=DEBIT_CARD
```

## Importo

Supportare:

```text
minAmount
maxAmount
```

Validare che:

* siano importi validi;
* siano maggiori o uguali a zero;
* `minAmount` non superi `maxAmount`.

---

# Ordinamento

Supportare:

```text
expenseDate
amount
description
createdAt
updatedAt
```

Direzioni:

```text
asc
desc
```

Default:

```text
sortBy=expenseDate
sortDirection=desc
```

Usare una whitelist esplicita.

Non passare al database nomi di colonne arbitrari provenienti dal client.

Aggiungere un ordinamento secondario stabile, per esempio `createdAt desc` oppure `id`.

---

# Paginazione

Regole:

* pagina iniziale: `1`;
* dimensione predefinita: `20`;
* dimensione massima: `100`;
* calcolare `totalItems`;
* calcolare `totalPages`;
* gestire correttamente pagina vuota o fuori intervallo;
* non recuperare l’intero dataset.

Se dopo un’eliminazione la pagina corrente diventa vuota, il frontend deve tornare alla pagina precedente quando disponibile.

---

## Dettaglio

```http
GET /api/v1/expenses/:id
```

Restituire:

* dati completi;
* categoria;
* etichette;
* timestamp tecnici.

Restituire `404` quando la spesa:

* non esiste;
* appartiene a un altro utente;
* è stata eliminata.

---

## Modifica

```http
PATCH /api/v1/expenses/:id
```

Consentire la modifica dei campi della creazione.

Regole:

* DTO dedicato;
* controllo ownership;
* controllo categoria;
* controllo etichette;
* sostituzione coerente delle relazioni `ExpenseLabel`;
* transazione Prisma;
* nessuna modifica di `userId`;
* nessuna modifica diretta di `createdAt`;
* nessuna modifica di spese eliminate.

---

## Cambio rapido di stato

```http
PATCH /api/v1/expenses/:id/status
```

Body:

```json
{
  "status": "COMPLETED"
}
```

Restituire la spesa aggiornata.

Questo endpoint deve essere utilizzato dalle azioni rapide della tabella e del dettaglio.

---

## Duplicazione

```http
POST /api/v1/expenses/:id/duplicate
```

Copiare:

* descrizione;
* importo;
* categoria;
* etichette;
* metodo di pagamento;
* esercente;
* note;
* stato.

Non copiare:

* ID;
* timestamp;
* `deletedAt`.

Usare la stessa data come comportamento predefinito.

Consentire una nuova data opzionale:

```json
{
  "expenseDate": "2026-07-20"
}
```

Restituire la nuova spesa con un nuovo ID.

---

## Eliminazione

```http
DELETE /api/v1/expenses/:id
```

Applicare soft delete.

Usare il formato di risposta già adottato dal progetto:

* `204 No Content`;
* oppure risposta standard con messaggio.

Non introdurre uno stile diverso dagli altri endpoint.

---

# Esportazione CSV

Endpoint:

```http
GET /api/v1/expenses/export
```

Supportare gli stessi filtri principali della lista:

```text
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

Colonne:

```text
Data
Ora
Descrizione
Importo
Categoria
Etichette
Metodo di pagamento
Esercente
Stato
Note
```

Requisiti:

* esportare soltanto le spese dell’utente;
* applicare i filtri correnti;
* escludere le spese eliminate;
* codifica UTF-8;
* gestire correttamente virgole, virgolette e ritorni a capo;
* usare intestazioni italiane;
* usare un nome file descrittivo;
* evitare l’esposizione di ID e campi interni;
* imporre un limite massimo ragionevole.

Nome file indicativo:

```text
spese-2026-07.csv
```

Per una migliore compatibilità con Excel italiano valutare:

* separatore `;`;
* BOM UTF-8.

Documentare la scelta.

---

# DTO backend

Creare almeno:

```text
CreateExpenseDto
UpdateExpenseDto
UpdateExpenseStatusDto
DuplicateExpenseDto
ExpenseQueryDto
ExpenseExportQueryDto
```

Validazioni:

```text
description:
  obbligatoria
  stringa
  massimo 150 caratteri

amount:
  obbligatorio
  formato decimale
  maggiore di zero
  massimo due cifre decimali

expenseDate:
  obbligatoria
  formato YYYY-MM-DD

expenseTime:
  opzionale
  formato HH:mm o HH:mm:ss

categoryId:
  UUID valido

labelIds:
  array opzionale
  UUID validi
  valori univoci

paymentMethod:
  enum valido

merchant:
  opzionale
  massimo 150 caratteri

notes:
  opzionale
  massimo 5000 caratteri

status:
  enum valido
```

Utilizzare:

* `class-validator`;
* `class-transformer`;
* trasformazioni esplicite;
* whitelist globale;
* rifiuto dei campi non previsti, se già previsto dall’architettura.

---

# Mapper backend

Creare:

```text
ExpenseMapper
```

Deve centralizzare:

* conversione importo;
* conversione data;
* conversione ora;
* categoria;
* etichette;
* stato;
* metodo di pagamento;
* timestamp.

Non restituire oggetti Prisma direttamente dai controller.

Non duplicare conversioni nei service.

---

# Swagger

Documentare:

* endpoint;
* autenticazione Bearer;
* DTO;
* enum;
* query parameter;
* paginazione;
* filtri;
* ordinamento;
* esempi di richiesta;
* esempi di risposta;
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

Verificare manualmente la sezione Swagger delle spese.

---

# Frontend Angular

Creare o completare le rotte:

```text
/expenses
/expenses/new
/expenses/:id
/expenses/:id/edit
```

È possibile utilizzare modali o pannelli laterali per creazione e modifica, ma il dettaglio deve essere navigabile.

Proteggere tutte le rotte con auth guard.

Aggiungere alla sidebar:

```text
Spese
```

Icona consigliata:

```text
bi-receipt
```

---

# Pagina Spese

La pagina deve avere impostazione gestionale.

## Header

Mostrare:

* titolo “Spese”;
* descrizione sintetica;
* pulsante “Nuova spesa”;
* pulsante “Esporta CSV”.

## Toolbar

Includere:

* ricerca;
* data iniziale;
* data finale;
* mese;
* anno;
* categoria;
* etichette;
* stato;
* metodo di pagamento;
* importo minimo;
* importo massimo;
* ordinamento;
* direzione;
* reset filtri.

I filtri devono:

* chiamare il backend;
* essere rappresentati nei query parameter;
* sopravvivere al refresh;
* funzionare con avanti e indietro del browser;
* usare debounce per la ricerca;
* evitare chiamate duplicate;
* tornare alla prima pagina quando cambia un filtro rilevante.

Non inserire nell’URL valori vuoti.

---

# Tabella delle spese

Colonne desktop:

* data;
* descrizione;
* importo;
* categoria;
* etichette;
* metodo di pagamento;
* stato;
* azioni.

Colonne opzionali:

* ora;
* esercente.

Comportamento:

* importo allineato a destra;
* importo formattato in euro;
* intestazioni ordinabili;
* categoria tramite `CategoryBadgeComponent`;
* etichette tramite `LabelBadgeComponent`;
* badge per stato;
* menu azioni;
* accesso al dettaglio.

Azioni:

* visualizza;
* modifica;
* duplica;
* segna completata;
* segna pianificata;
* annulla;
* elimina.

Mostrare soltanto azioni coerenti con lo stato corrente.

Richiedere conferma prima dell’eliminazione.

---

# Visualizzazione mobile

Su mobile:

* non mostrare una tabella desktop compressa;
* utilizzare card oppure una lista compatta;
* mostrare descrizione, importo, data, categoria e stato;
* inserire le azioni in un menu;
* rendere i filtri collassabili;
* mantenere ben visibile “Nuova spesa”;
* garantire pulsanti sufficientemente grandi.

---

# Form spesa

Creare:

```text
ExpenseFormComponent
```

Riutilizzarlo per:

* creazione;
* modifica;
* inserimento rapido.

Campi:

* descrizione;
* importo;
* data;
* ora;
* categoria;
* etichette;
* metodo di pagamento;
* esercente;
* note;
* stato.

Utilizzare Angular Reactive Forms.

Non usare `any`.

---

# Comportamento del form

## Data futura

Quando la data diventa futura:

* impostare `PLANNED` soltanto se l’utente non ha modificato lo stato;
* mostrare un messaggio informativo;
* non bloccare altri stati validi.

## Importo

Consentire input con:

```text
12,50
12.50
```

Normalizzare prima dell’invio.

Evitare problemi con `input type="number"` e separatori locali.

## Categoria

Per un nuovo inserimento mostrare:

* categorie globali attive;
* categorie personalizzate attive.

Durante la modifica:

* mostrare anche la categoria corrente se disattivata;
* indicarla come disattivata;
* consentire di mantenerla.

## Etichette

Consentire selezione multipla.

Mostrare:

* nome;
* colore;
* icona;
* categoria collegata opzionale.

Non introdurre una libreria pesante se non necessaria.

## Errori

Mostrare errori:

* sotto il campo;
* in italiano;
* senza dettagli tecnici;
* senza cancellare il contenuto inserito.

---

# Inserimento rapido globale

Aggiungere un pulsante disponibile in tutte le pagine autenticate:

```text
+ Nuova spesa
```

Posizioni possibili:

* topbar desktop;
* sidebar;
* pulsante mobile.

Aprire:

* modale Bootstrap;
* oppure pannello laterale.

Vista iniziale compatta:

* importo;
* descrizione;
* data;
* categoria;
* stato.

Sezione avanzata espandibile:

* ora;
* etichette;
* metodo di pagamento;
* esercente;
* note.

Dopo il salvataggio:

* chiudere il pannello;
* mostrare toast;
* azzerare il form;
* aggiornare la lista, se aperta;
* mantenere i filtri;
* impedire doppi invii.

---

# Dettaglio spesa

Mostrare:

* descrizione;
* importo;
* data;
* ora;
* stato;
* categoria;
* etichette;
* metodo di pagamento;
* esercente;
* note;
* data di creazione;
* data di modifica.

Azioni:

* modifica;
* duplica;
* cambia stato;
* elimina;
* torna alla lista.

Gestire:

* loading;
* errore;
* `404`;
* navigazione di ritorno;
* mantenimento dei query parameter della lista, quando possibile.

---

# Componenti Angular

Creare o riutilizzare:

```text
ExpenseTableComponent
ExpenseCardComponent
ExpenseFormComponent
QuickExpenseModalComponent
ExpenseFiltersComponent
ExpenseDetailComponent
ExpenseStatusBadgeComponent
PaymentMethodBadgeComponent
PaginationComponent
ConfirmDialogComponent
EmptyStateComponent
LoadingSkeletonComponent
```

Riutilizzare quelli già disponibili:

```text
CategoryBadgeComponent
LabelBadgeComponent
PageHeaderComponent
SearchInputComponent
```

Non creare componenti duplicati con funzioni equivalenti.

---

# Servizi Angular

Creare:

```text
ExpenseService
```

Responsabilità:

* lista;
* dettaglio;
* creazione;
* aggiornamento;
* eliminazione;
* duplicazione;
* cambio stato;
* esportazione CSV.

Le chiamate HTTP non devono essere effettuate direttamente nei componenti.

È possibile creare uno store basato su Signals:

```text
ExpenseStore
```

Stato possibile:

* spese;
* loading;
* errore;
* filtri;
* ordinamento;
* paginazione;
* totale risultati.

Non introdurre NgRx.

Usare RxJS e `takeUntilDestroyed` quando appropriato.

---

# Modelli TypeScript frontend

Definire almeno:

```text
Expense
ExpenseListItem
ExpenseDetail
ExpenseStatus
PaymentMethod
CreateExpenseRequest
UpdateExpenseRequest
DuplicateExpenseRequest
ExpenseQueryParams
ExpenseFilters
ExpenseFormValue
PaginatedExpenseResponse
PaginationMeta
```

Separare correttamente:

* modelli API;
* valori del form;
* payload di creazione;
* payload di modifica;
* elementi lista;
* dettaglio.

Non usare `any`.

---

# Sincronizzazione URL e filtri

Esempio:

```text
/expenses?page=2&month=7&year=2026&status=COMPLETED
```

Regole:

* il refresh deve conservare i filtri;
* il pulsante indietro deve funzionare;
* il reset deve rimuovere i parametri;
* non aggiungere parametri vuoti;
* evitare loop tra form, router e API;
* ripristinare correttamente i valori del form dalla route.

---

# Esportazione CSV frontend

Il pulsante deve:

1. usare i filtri correnti;
2. chiamare l’endpoint backend;
3. ricevere un `Blob`;
4. leggere il nome file da `Content-Disposition`, quando disponibile;
5. avviare il salvataggio;
6. mostrare stato loading;
7. mostrare un errore leggibile.

Non generare il CSV usando soltanto le righe visibili nella pagina corrente.

---

# Esperienza utente

Implementare:

* toast di conferma;
* toast di errore;
* loading;
* empty state;
* conferma eliminazione;
* pulsanti disabilitati durante le richieste;
* prevenzione del doppio submit;
* aggiornamento coerente della lista;
* mantenimento dei filtri;
* messaggi in italiano.

Messaggi indicativi:

```text
Spesa creata correttamente.
Spesa aggiornata correttamente.
Spesa duplicata correttamente.
Stato aggiornato.
Spesa eliminata.
La categoria selezionata non è disponibile.
Una o più etichette non sono valide.
Non è stato possibile esportare le spese.
```

---

# Accessibilità

Garantire:

* label collegate ai campi;
* errori collegati tramite ARIA;
* focus visibile;
* focus trap nelle modali;
* pulsanti icona con `aria-label`;
* stato non indicato soltanto dal colore;
* tabella con intestazioni semantiche;
* menu azioni utilizzabile da tastiera;
* conferma eliminazione chiara;
* importi leggibili dagli screen reader.

---

# Responsive design

## Desktop

* sidebar fissa;
* toolbar completa;
* tabella gestionale;
* form in modale o pannello;
* paginazione completa.

## Tablet

* toolbar su più righe;
* tabella con scroll orizzontale;
* filtri organizzati in griglia;
* form adattato alla larghezza.

## Mobile

* sidebar offcanvas;
* lista a card;
* filtri collassabili;
* form quasi a schermo intero;
* azioni in menu dropdown;
* pulsante nuova spesa sempre raggiungibile.

---

# Gestione errori

Gestire almeno:

```text
400 dati non validi
401 utente non autenticato
404 spesa non trovata
409 conflitto applicativo
500 errore interno
```

Il frontend deve mostrare messaggi leggibili.

Non mostrare:

* stack trace;
* query SQL;
* dettagli Prisma;
* messaggi tecnici interni.

---

# Seed development

Aggiornare il seed soltanto per l’ambiente development.

Creare per l’utente demo:

* almeno 20 spese;
* distribuite su almeno 3 mesi;
* categorie differenti;
* metodi di pagamento differenti;
* alcune etichette;
* alcune spese `PLANNED`;
* almeno una spesa `CANCELLED`.

Il seed deve essere idempotente.

Non creare dati demo in produzione.

---

# Test backend

Scrivere test almeno per:

## Creazione

* creazione valida;
* importo non valido;
* data non valida;
* categoria inesistente;
* categoria altrui;
* categoria disattivata;
* etichetta altrui;
* etichette duplicate.

## Lista

* paginazione;
* ricerca;
* filtro data;
* filtro mese e anno;
* filtro categoria;
* filtro etichetta;
* filtro stato;
* filtro metodo di pagamento;
* filtro importo;
* ordinamento;
* esclusione delle spese eliminate;
* isolamento tra utenti.

## Dettaglio e modifica

* dettaglio valido;
* `404` per spesa altrui;
* modifica valida;
* sostituzione etichette;
* impossibilità di modificare spesa eliminata.

## Altre operazioni

* cambio stato;
* duplicazione;
* duplicazione con nuova data;
* soft delete;
* export CSV;
* export limitato all’utente;
* export con filtri.

---

# Test frontend

Scrivere test almeno per:

* rendering lista;
* loading;
* empty state;
* errore API;
* validazione descrizione;
* validazione importo;
* validazione data;
* cambio automatico a `PLANNED`;
* scelta manuale dello stato non sovrascritta;
* selezione categoria;
* selezione multipla etichette;
* applicazione filtri;
* sincronizzazione query parameter;
* reset filtri;
* paginazione;
* ordinamento;
* apertura inserimento rapido;
* creazione;
* modifica;
* duplicazione;
* cambio stato;
* conferma eliminazione;
* export CSV;
* `ExpenseStatusBadgeComponent`;
* `PaymentMethodBadgeComponent`.

---

# Verifica manuale

Al termine verificare almeno questo flusso:

1. effettuare il login;
2. aprire la pagina Spese;
3. verificare la lista paginata;
4. creare una spesa completata;
5. creare una spesa futura;
6. verificare la proposta automatica dello stato pianificato;
7. associare categoria ed etichette;
8. modificare la spesa;
9. filtrare per categoria;
10. filtrare per mese;
11. cercare per descrizione;
12. ordinare per importo;
13. duplicare una spesa;
14. cambiare lo stato;
15. aprire il dettaglio;
16. esportare il CSV;
17. eliminare una spesa;
18. verificare che non ricompaia;
19. accedere con un secondo utente;
20. verificare l’isolamento completo dei dati.

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
14. verificare manualmente il flusso principale;
15. correggere tutti gli errori trovati.

Eseguire i comandi separatamente se l’ambiente presenta problemi nell’inoltro di stdout o stderr.

Non dichiarare superati test o build che non sono stati realmente eseguiti.

---

# Vincoli

* Non implementare funzionalità delle fasi successive.
* Non usare dati mock nel flusso reale.
* Non disabilitare TypeScript strict.
* Non usare `any`.
* Non effettuare chiamate HTTP direttamente nei componenti.
* Non calcolare paginazione e filtri caricando tutte le spese.
* Non usare floating point per gli importi finanziari.
* Non accettare `userId` dal frontend.
* Non restituire oggetti Prisma direttamente.
* Non usare `prisma db push` come soluzione finale.
* Non eliminare fisicamente le spese.
* Non lasciare TODO bloccanti.
* Non ignorare errori di compilazione, test o lint.
* Non sostituire parti funzionanti delle fasi precedenti.
* Non installare dipendenze non necessarie.
* Mantenere frontend, backend, database e Swagger coerenti.

---

# Output finale richiesto all’agente

Concludere con un riepilogo contenente:

* funzionalità implementate;
* modelli Prisma aggiunti o modificati;
* enum aggiunti;
* migrazione creata;
* endpoint disponibili;
* DTO creati;
* pagine Angular create;
* componenti creati o riutilizzati;
* strategia usata per importi e date;
* filtri e ordinamenti disponibili;
* test realmente eseguiti;
* build realmente eseguite;
* verifica Docker;
* problemi corretti;
* eventuali limitazioni residue reali.

Non limitarsi a produrre il riepilogo: implementare prima integralmente la fase.
