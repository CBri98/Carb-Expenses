# PHASE_3_CATEGORIES_LABELS.md

> Stato: completata il 14 luglio 2026. Implementazione verificata con build, test automatici e flusso end-to-end su Docker Compose.

## Obiettivo

Implementare la **Fase 3 — Categorie ed etichette** dell’applicazione di nota spese descritta in `AGENTS.md`.

Prima di iniziare:

1. leggere integralmente `AGENTS.md`;
2. analizzare lo stato attuale del repository;
3. verificare che la Fase 1 e la Fase 2 siano funzionanti;
4. correggere soltanto eventuali problemi bloccanti;
5. evitare refactoring non necessari.

Implementare direttamente il codice nel repository.

Non limitarsi a proporre una soluzione o mostrare esempi.

---

# Ambito della fase

Questa fase deve implementare:

* categorie predefinite;
* categorie personalizzate;
* etichette personalizzate;
* associazione opzionale tra etichetta e categoria;
* gestione colore e icona;
* attivazione e disattivazione;
* ordinamento;
* ricerca e filtri;
* seed delle categorie predefinite;
* API REST NestJS;
* pagine Angular;
* componenti condivisi;
* test backend e frontend.

Non implementare ancora:

* CRUD completo delle spese;
* dashboard con dati reali;
* grafici Chart.js;
* calendario;
* notifiche;
* ricorrenze;
* confronto mensile.

È consentito usare una pagina placeholder per le sezioni non ancora implementate.

---

# Requisiti funzionali

## Categorie

L’applicazione deve avere un set di categorie predefinite disponibili per tutti gli utenti.

Ogni utente deve inoltre poter creare categorie personalizzate.

Una categoria deve avere:

* nome;
* slug;
* colore;
* icona;
* descrizione opzionale;
* ordine di visualizzazione;
* stato attivo o disattivato;
* indicazione se è predefinita;
* riferimento all’utente, soltanto per le categorie personalizzate;
* data di creazione;
* data di modifica.

Le categorie predefinite:

* sono globali;
* hanno `userId = null`;
* non possono essere modificate nel nome;
* non possono essere eliminate;
* possono essere nascoste o disattivate per il singolo utente.

Le categorie personalizzate:

* appartengono a un solo utente;
* possono essere create;
* possono essere modificate;
* possono essere disattivate;
* possono essere riordinate;
* possono essere eliminate soltanto quando non sono utilizzate;
* dovranno essere predisposte per il soft delete.

---

## Etichette

Ogni utente deve poter creare etichette personalizzate.

Un’etichetta deve avere:

* nome;
* slug;
* colore;
* icona opzionale;
* descrizione opzionale;
* categoria di riferimento opzionale;
* ordine di visualizzazione;
* stato attivo o disattivato;
* data di creazione;
* data di modifica;
* data di eliminazione opzionale.

Le etichette:

* appartengono sempre a un utente;
* non devono essere visibili ad altri utenti;
* possono essere associate a una categoria;
* possono esistere senza categoria;
* potranno essere associate a più spese nelle fasi successive;
* devono essere predisposte per il soft delete.

Esempi di etichette:

* Pranzo di lavoro
* Spese condivise
* Casa nuova
* Vacanza 2026
* Rimborso previsto
* Spesa straordinaria
* Abbonamenti annuali
* Spese auto
* Regali di Natale

---

# Categorie predefinite

Creare tramite seed almeno le seguenti categorie:

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
* Animali
* Altro

Ogni categoria predefinita deve avere:

* uno slug stabile;
* un’icona Bootstrap Icons;
* un colore predefinito;
* un ordine coerente;
* `isDefault = true`;
* `isActive = true`;
* `userId = null`.

Esempi di icone Bootstrap:

```text
Casa                  bi-house
Affitto               bi-building
Bollette              bi-receipt
Spesa alimentare      bi-basket
Ristoranti            bi-cup-hot
Trasporti             bi-bus-front
Carburante            bi-fuel-pump
Auto                   bi-car-front
Salute                 bi-heart-pulse
Farmacia               bi-capsule
Shopping               bi-bag
Intrattenimento        bi-controller
Viaggi                 bi-airplane
Abbonamenti            bi-arrow-repeat
Istruzione             bi-mortarboard
Regali                 bi-gift
Tasse                  bi-bank
Lavoro                 bi-briefcase
Animali                bi-heart
Altro                  bi-three-dots
```

Il seed deve essere idempotente.

Eseguire più volte il seed non deve creare duplicati.

---

# Modello dati Prisma

Analizzare lo schema Prisma esistente e aggiungere o completare i modelli necessari.

Una possibile struttura è la seguente.

## Category

```prisma
model Category {
  id          String   @id @default(uuid()) @db.Char(36)
  userId      String?  @map("user_id") @db.Char(36)
  name        String   @db.VarChar(100)
  slug        String   @db.VarChar(120)
  description String?  @db.VarChar(255)
  color       String   @db.VarChar(20)
  icon        String   @db.VarChar(100)
  sortOrder   Int      @default(0) @map("sort_order")
  isDefault   Boolean  @default(false) @map("is_default")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  user   User?   @relation(fields: [userId], references: [id], onDelete: Cascade)
  labels Label[]

  @@unique([userId, slug])
  @@index([userId])
  @@index([isDefault])
  @@index([isActive])
  @@map("categories")
}
```

## Label

```prisma
model Label {
  id          String    @id @default(uuid()) @db.Char(36)
  userId      String    @map("user_id") @db.Char(36)
  categoryId  String?   @map("category_id") @db.Char(36)
  name        String    @db.VarChar(100)
  slug        String    @db.VarChar(120)
  description String?   @db.VarChar(255)
  color       String    @db.VarChar(20)
  icon        String?   @db.VarChar(100)
  sortOrder   Int       @default(0) @map("sort_order")
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)

  @@unique([userId, slug])
  @@index([userId])
  @@index([categoryId])
  @@index([isActive])
  @@map("labels")
}
```

Adattare tipi, nomi e relazioni allo schema già presente.

Non duplicare campi o relazioni già esistenti.

Creare una migrazione Prisma descrittiva.

Non utilizzare `prisma db push` come sostituto permanente delle migrazioni.

---

# Gestione delle categorie predefinite per utente

Le categorie globali non devono essere modificate direttamente per memorizzare preferenze specifiche di un utente.

Per permettere a un utente di disattivare o personalizzare l’ordine delle categorie predefinite, implementare una tabella di preferenze dedicata.

## UserCategoryPreference

```prisma
model UserCategoryPreference {
  userId     String  @map("user_id") @db.Char(36)
  categoryId String  @map("category_id") @db.Char(36)
  isActive   Boolean @default(true) @map("is_active")
  sortOrder  Int     @default(0) @map("sort_order")

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([userId, categoryId])
  @@index([categoryId])
  @@map("user_category_preferences")
}
```

La lista delle categorie disponibili per l’utente deve unire:

* categorie globali predefinite;
* preferenze personali;
* categorie personalizzate dell’utente.

Non copiare nel database tutte le categorie globali per ogni nuovo utente.

---

# Regole di business

## Nome e slug

* Il nome è obbligatorio.
* Il nome deve essere normalizzato rimuovendo spazi superflui.
* Lo slug deve essere generato dal backend.
* Lo slug deve essere univoco nell’ambito dell’utente.
* Le categorie globali devono avere slug univoci globalmente.
* Il confronto deve essere case-insensitive.
* Non permettere nomi duplicati con differenze soltanto di maiuscole o spazi.

Esempio:

```text
"Pranzo di Lavoro"
"pranzo di lavoro"
"  Pranzo di lavoro  "
```

Devono essere considerati duplicati per lo stesso utente.

---

## Colore

Il colore deve essere validato.

Accettare preferibilmente colori esadecimali nel formato:

```text
#RRGGBB
```

Esempio:

```text
#4F46E5
```

Non accettare stringhe CSS arbitrarie.

---

## Icona

Utilizzare Bootstrap Icons.

L’API deve accettare soltanto nomi di icone con prefisso:

```text
bi-
```

Esempio:

```text
bi-house
bi-car-front
bi-tag
```

Il frontend deve mostrare una selezione curata di icone, non l’intero catalogo.

---

## Eliminazione

Le categorie predefinite non possono essere eliminate.

Le categorie personalizzate:

* possono essere eliminate soltanto se non sono in uso;
* in questa fase devono usare soft delete;
* non devono apparire nelle liste normali dopo l’eliminazione.

Le etichette devono essere eliminate tramite soft delete.

Poiché il CRUD delle spese non è ancora implementato, predisporre comunque i controlli necessari per l’associazione futura.

---

## Ownership

Ogni query relativa a categorie personalizzate, preferenze ed etichette deve verificare l’utente autenticato.

Non accettare `userId` dal body o dai query parameter.

Il backend deve ricavare l’utente dal token JWT.

Un utente non deve poter:

* leggere etichette altrui;
* modificare etichette altrui;
* eliminare etichette altrui;
* modificare categorie personalizzate altrui;
* cambiare le preferenze di altri utenti.

---

# Backend NestJS

Creare o completare i moduli:

```text
CategoriesModule
LabelsModule
```

Ogni modulo deve contenere:

* controller;
* service;
* DTO;
* mapping delle risposte;
* test unitari;
* test di integrazione essenziali.

Non inserire business logic nei controller.

---

# API categorie

Usare il prefisso:

```text
/api/v1/categories
```

## Lista categorie

```http
GET /api/v1/categories
```

Query parameter supportati:

```text
search
active
type
sortBy
sortDirection
```

Dove `type` può essere:

```text
all
default
custom
```

La risposta deve includere sia le categorie predefinite sia quelle personalizzate visibili all’utente.

Per ogni categoria restituire almeno:

```json
{
  "id": "uuid",
  "name": "Casa",
  "slug": "casa",
  "description": null,
  "color": "#4F46E5",
  "icon": "bi-house",
  "sortOrder": 1,
  "isDefault": true,
  "isCustom": false,
  "isActive": true
}
```

---

## Creazione categoria personalizzata

```http
POST /api/v1/categories
```

Body:

```json
{
  "name": "Casa nuova",
  "description": "Spese relative alla nuova abitazione",
  "color": "#2563EB",
  "icon": "bi-house-door",
  "sortOrder": 50
}
```

Non permettere la creazione di categorie globali tramite API utente.

---

## Modifica categoria personalizzata

```http
PATCH /api/v1/categories/:id
```

Campi modificabili:

* nome;
* descrizione;
* colore;
* icona;
* ordine;
* stato attivo.

Le categorie predefinite non devono poter essere modificate direttamente tramite questo endpoint.

---

## Eliminazione categoria personalizzata

```http
DELETE /api/v1/categories/:id
```

Applicare soft delete.

Restituire un errore chiaro se:

* la categoria è predefinita;
* la categoria non appartiene all’utente;
* la categoria è in uso.

---

## Attivazione e disattivazione

```http
PATCH /api/v1/categories/:id/status
```

Body:

```json
{
  "isActive": false
}
```

Per una categoria predefinita aggiornare `UserCategoryPreference`.

Per una categoria personalizzata aggiornare direttamente la categoria.

---

## Riordinamento

```http
PATCH /api/v1/categories/reorder
```

Body:

```json
{
  "items": [
    {
      "id": "uuid-1",
      "sortOrder": 1
    },
    {
      "id": "uuid-2",
      "sortOrder": 2
    }
  ]
}
```

Validare che tutti gli ID siano visibili all’utente.

Eseguire l’aggiornamento in transazione.

---

# API etichette

Usare il prefisso:

```text
/api/v1/labels
```

## Lista etichette

```http
GET /api/v1/labels
```

Query parameter:

```text
search
categoryId
active
sortBy
sortDirection
```

---

## Dettaglio etichetta

```http
GET /api/v1/labels/:id
```

---

## Creazione etichetta

```http
POST /api/v1/labels
```

Body:

```json
{
  "name": "Pranzo di lavoro",
  "description": "Pasti sostenuti durante giornate lavorative",
  "color": "#F59E0B",
  "icon": "bi-briefcase",
  "categoryId": "uuid-opzionale",
  "sortOrder": 10
}
```

Se `categoryId` è valorizzato, verificare che la categoria sia accessibile all’utente.

---

## Modifica etichetta

```http
PATCH /api/v1/labels/:id
```

Campi modificabili:

* nome;
* descrizione;
* colore;
* icona;
* categoria;
* ordine;
* stato attivo.

---

## Eliminazione etichetta

```http
DELETE /api/v1/labels/:id
```

Applicare soft delete.

---

## Attivazione e disattivazione

```http
PATCH /api/v1/labels/:id/status
```

Body:

```json
{
  "isActive": false
}
```

---

## Riordinamento

```http
PATCH /api/v1/labels/reorder
```

Utilizzare la stessa struttura prevista per le categorie.

Eseguire l’aggiornamento in transazione.

---

# DTO backend

Creare DTO separati.

Almeno:

```text
CreateCategoryDto
UpdateCategoryDto
UpdateCategoryStatusDto
ReorderCategoriesDto
CategoryQueryDto

CreateLabelDto
UpdateLabelDto
UpdateLabelStatusDto
ReorderLabelsDto
LabelQueryDto
```

Usare:

* `class-validator`;
* `class-transformer`;
* whitelist globale;
* rifiuto dei campi non previsti, se coerente con la configurazione esistente.

Validazioni minime:

```text
name:
  obbligatorio
  stringa
  massimo 100 caratteri

description:
  opzionale
  massimo 255 caratteri

color:
  obbligatorio
  formato #RRGGBB

icon:
  opzionale per le etichette
  obbligatorio per le categorie
  prefisso bi-

sortOrder:
  intero
  minimo 0

categoryId:
  UUID valido
  opzionale
```

---

# Swagger

Documentare:

* tutti gli endpoint;
* DTO;
* query parameter;
* codici di risposta;
* errori di validazione;
* autenticazione Bearer;
* esempi di request e response.

Verificare che gli endpoint protetti mostrino correttamente il requisito JWT in Swagger.

---

# Frontend Angular

Creare le pagine:

```text
/settings/categories
/settings/labels
```

Oppure adattare le rotte alla struttura già esistente.

Le rotte devono essere protette da auth guard.

La sidebar deve includere una sezione:

```text
Gestione
  Categorie
  Etichette
```

Evidenziare la route attiva.

---

# Pagina categorie

La pagina deve avere un’impostazione gestionale.

## Header

Mostrare:

* titolo “Categorie”;
* breve descrizione;
* pulsante “Nuova categoria”.

## Toolbar

Includere:

* ricerca;
* filtro tutte/predefinite/personalizzate;
* filtro attive/disattivate;
* pulsante reset filtri.

## Tabella

Colonne:

* ordine;
* icona;
* nome;
* tipo;
* colore;
* stato;
* azioni.

Azioni:

* modifica;
* attiva o disattiva;
* elimina, soltanto per categorie personalizzate.

Per le categorie predefinite:

* mostrare badge “Predefinita”;
* disabilitare modifica ed eliminazione;
* consentire attivazione e disattivazione.

Per le categorie personalizzate:

* mostrare badge “Personalizzata”.

---

# Pagina etichette

## Header

Mostrare:

* titolo “Etichette”;
* breve descrizione;
* pulsante “Nuova etichetta”.

## Toolbar

Includere:

* ricerca;
* filtro categoria;
* filtro stato;
* reset filtri.

## Tabella

Colonne:

* ordine;
* icona;
* nome;
* categoria associata;
* colore;
* stato;
* azioni.

Azioni:

* modifica;
* attiva o disattiva;
* elimina.

---

# Form categoria

Realizzare come modale Bootstrap oppure pannello laterale.

Campi:

* nome;
* descrizione;
* colore;
* icona;
* ordine;
* stato attivo.

Usare Angular Reactive Forms.

Mostrare:

* validazioni inline;
* preview del badge;
* preview dell’icona;
* stato loading;
* errore API;
* pulsante annulla;
* pulsante salva.

Per il colore usare:

* input color;
* input testuale sincronizzato;
* palette di colori suggeriti.

Non introdurre una libreria esterna soltanto per il color picker.

---

# Form etichetta

Campi:

* nome;
* descrizione;
* colore;
* icona opzionale;
* categoria opzionale;
* ordine;
* stato attivo.

Mostrare una preview dell’etichetta.

La categoria deve essere selezionabile tra:

* categorie globali attive;
* categorie personalizzate attive.

---

# Componenti condivisi

Creare componenti riutilizzabili.

Almeno:

```text
CategoryBadgeComponent
LabelBadgeComponent
IconPickerComponent
ColorPickerComponent
StatusBadgeComponent
ConfirmDialogComponent
EmptyStateComponent
LoadingSkeletonComponent
SearchInputComponent
PageHeaderComponent
```

Riutilizzare componenti già esistenti quando adeguati.

Non creare duplicati con nomi o funzioni simili.

---

# CategoryBadgeComponent

Input minimi:

```text
name
color
icon
```

Deve mostrare:

* icona;
* nome;
* sfondo o bordo derivato dal colore;
* testo leggibile anche con colori chiari.

Non usare direttamente HTML non sanificato per le icone.

---

# LabelBadgeComponent

Input minimi:

```text
name
color
icon opzionale
```

Deve essere utilizzabile successivamente nelle tabelle delle spese.

---

# IconPickerComponent

Mostrare una selezione curata di Bootstrap Icons.

Funzionalità:

* ricerca;
* selezione;
* stato selezionato;
* preview;
* navigazione da tastiera.

Non caricare dinamicamente HTML da stringhe arbitrarie.

---

# ColorPickerComponent

Funzionalità:

* input colore;
* campo esadecimale;
* palette predefinita;
* validazione;
* anteprima.

Usare un insieme di colori leggibili in tema chiaro e scuro.

Non salvare valori RGB o nomi CSS se il backend richiede esadecimale.

---

# Gestione stato frontend

Creare servizi:

```text
CategoryService
LabelService
```

Le chiamate HTTP non devono risiedere nei componenti.

Usare:

* Angular Signals per lo stato locale;
* computed per liste filtrate e contatori;
* RxJS per chiamate asincrone;
* `takeUntilDestroyed`;
* gestione centralizzata degli errori quando disponibile.

Non introdurre NgRx.

---

# Modelli TypeScript frontend

Definire interfacce tipizzate.

Almeno:

```text
Category
CreateCategoryRequest
UpdateCategoryRequest
CategoryQueryParams
Label
CreateLabelRequest
UpdateLabelRequest
LabelQueryParams
ReorderItem
```

Non usare `any`.

Non usare lo stesso modello per:

* risposta API;
* form;
* payload di creazione;
* payload di modifica;

quando hanno strutture differenti.

---

# Esperienza utente

Implementare:

* toast di conferma;
* toast di errore;
* modale di conferma eliminazione;
* loading state;
* empty state;
* disabilitazione pulsanti durante il salvataggio;
* messaggi chiari;
* aggiornamento della lista dopo le modifiche;
* gestione ottimistica soltanto dove sicura.

Esempi di messaggi:

```text
Categoria creata correttamente.
Categoria aggiornata correttamente.
Categoria disattivata.
Etichetta eliminata.
Esiste già un’etichetta con questo nome.
Non puoi eliminare una categoria predefinita.
```

---

# Responsive design

## Desktop

* tabella completa;
* toolbar su una riga;
* modale o pannello laterale;
* drag handle per l’ordinamento, se implementato.

## Tablet

* toolbar su più righe;
* tabella con scroll orizzontale.

## Mobile

* filtri collassabili;
* righe trasformabili in card;
* azioni in menu dropdown;
* modale a schermo quasi intero;
* pulsanti facilmente selezionabili.

---

# Ordinamento

Implementare almeno il riordinamento tramite pulsanti:

* sposta su;
* sposta giù.

Il drag and drop è facoltativo.

Se viene implementato drag and drop:

* usare Angular CDK;
* non introdurre librerie aggiuntive;
* supportare anche una modalità accessibile da tastiera;
* salvare il nuovo ordine tramite endpoint bulk.

---

# Accessibilità

Garantire:

* label collegate ai campi;
* focus visibile;
* pulsanti icona con `aria-label`;
* preview colore accompagnata dal valore testuale;
* stato attivo non indicato soltanto dal colore;
* modali con focus trap;
* conferme comprensibili;
* navigazione da tastiera nell’icon picker.

---

# Sicurezza

Verificare:

* ownership lato backend;
* autenticazione su tutti gli endpoint;
* validazione degli UUID;
* normalizzazione dei nomi;
* prevenzione di duplicati;
* nessuna fiducia nei dati provenienti dal frontend;
* nessun `userId` accettato dal client;
* nessun campo Prisma restituito accidentalmente;
* nessuna possibilità di modificare categorie globali.

---

# Test backend

Scrivere test almeno per:

## Categorie

* restituzione delle categorie predefinite;
* creazione categoria personalizzata;
* duplicato case-insensitive;
* modifica categoria personale;
* impossibilità di modificare categoria altrui;
* impossibilità di modificare una categoria predefinita;
* disattivazione categoria predefinita tramite preferenza;
* soft delete categoria personalizzata;
* riordinamento;
* validazione colore;
* validazione icona.

## Etichette

* creazione etichetta;
* creazione con categoria valida;
* rifiuto di categoria non accessibile;
* duplicato case-insensitive;
* modifica;
* soft delete;
* filtro per categoria;
* isolamento dati tra utenti;
* riordinamento.

---

# Test frontend

Scrivere test almeno per:

* rendering lista categorie;
* rendering lista etichette;
* validazione form categoria;
* validazione form etichetta;
* colore non valido;
* nome obbligatorio;
* apertura modale;
* chiusura modale;
* conferma eliminazione;
* disabilitazione azioni sulle categorie predefinite;
* applicazione filtri;
* aggiornamento lista dopo creazione;
* CategoryBadgeComponent;
* LabelBadgeComponent;
* IconPickerComponent;
* ColorPickerComponent.

---

# Gestione errori

Gestire almeno:

```text
400 dati non validi
401 utente non autenticato
403 operazione non consentita
404 categoria o etichetta non trovata
409 nome già esistente
500 errore interno
```

Il frontend deve mostrare messaggi leggibili.

Non mostrare stack trace o dettagli tecnici all’utente.

---

# Verifica manuale

Al termine verificare manualmente almeno questo flusso:

1. effettuare il login;
2. aprire la pagina Categorie;
3. visualizzare le categorie predefinite;
4. disattivare una categoria predefinita;
5. creare una categoria personalizzata;
6. modificarla;
7. riordinarla;
8. aprire la pagina Etichette;
9. creare un’etichetta associata a una categoria;
10. modificare l’etichetta;
11. disattivarla;
12. eliminarla;
13. verificare che un secondo utente non possa accedere ai dati del primo.

---

# Verifica finale obbligatoria

Al termine:

1. eseguire `prisma format`;
2. generare Prisma Client;
3. eseguire la migrazione;
4. eseguire il seed;
5. eseguire i test backend;
6. eseguire i test frontend;
7. eseguire la build backend;
8. eseguire la build frontend;
9. verificare lint e type checking;
10. verificare l’avvio tramite Docker Compose;
11. correggere tutti gli errori rilevati.

Non dichiarare superati test che non sono stati realmente eseguiti.

---

# Output finale richiesto all’agente

Concludere con un riepilogo sintetico contenente:

* funzionalità implementate;
* modelli Prisma aggiunti o modificati;
* migrazione creata;
* endpoint disponibili;
* pagine Angular create;
* componenti condivisi creati;
* test eseguiti;
* build eseguite;
* problemi corretti;
* eventuali limitazioni residue reali.

Non implementare funzionalità appartenenti alle fasi successive.
