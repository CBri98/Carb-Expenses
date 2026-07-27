# PHASE_10_SETTINGS.md

## Obiettivo

Implementare la **Fase 10 — Impostazioni account e personalizzazione dell’esperienza** dell’applicazione descritta in `AGENTS.md`.

Al termine della fase, l’utente autenticato deve poter:

* visualizzare e modificare le informazioni del proprio account;
* modificare la password;
* gestire alcune preferenze applicative;
* scegliere il tema light, dark oppure quello di sistema;
* scegliere il colore principale dell’interfaccia;
* personalizzare le icone disponibili nei form di creazione e modifica di categorie ed etichette;
* configurare valori predefiniti per i form;
* configurare alcune preferenze della dashboard, del calendario e delle tabelle;
* configurare preferenze predefinite per i promemoria;
* ripristinare le preferenze iniziali;
* ritrovare le proprie impostazioni dopo logout, login o accesso da un altro dispositivo.

Le impostazioni devono essere salvate nel database e associate all’utente.

Non limitarsi a salvare tutte le preferenze soltanto in `localStorage`.

`localStorage` può essere usato come cache per applicare immediatamente il tema, ma il database deve restare la fonte autorevole.

Implementare direttamente il codice nel repository.

Non limitarsi a descrivere la soluzione.

---

# Nuova numerazione delle fasi

Con questa fase la roadmap finale diventa:

```text
Fase 10 — Impostazioni e personalizzazione
Fase 11 — Gestione centralizzata dei promemoria
Fase 12 — Polish, testing e release
```

Il precedente file:

```text
docs/PHASE_10_POLISH_RELEASE.md
```

deve essere rinominato in:

```text
docs/PHASE_12_POLISH_RELEASE.md
```

Aggiornare nel documento:

* titolo;
* numero della fase;
* riferimenti interni;
* prompt breve;
* roadmap.

Non eseguire ancora la Fase 12 durante questo passaggio.

---

# Operazioni preliminari

Prima di modificare il codice:

1. leggere integralmente `AGENTS.md`;
2. leggere integralmente `docs/PHASE_10_SETTINGS.md`;
3. analizzare lo stato reale del repository;
4. eseguire `git status` e `git diff`;
5. verificare che le Fasi 1–9 siano funzionanti;
6. verificare:

   * autenticazione;
   * modello `User`;
   * gestione refresh token;
   * categorie;
   * etichette;
   * form delle spese;
   * dashboard;
   * calendario;
   * notifiche;
   * promemoria;
   * ricorrenze;
   * layout;
   * topbar;
   * sidebar;
   * tema light esistente;
   * design token;
   * `ng-select`;
   * Bootstrap Icons;
7. individuare le preferenze già eventualmente salvate;
8. non creare campi o modelli duplicati;
9. correggere soltanto problemi realmente bloccanti;
10. evitare refactoring non necessari;
11. non ricominciare da zero.

---

# Ambito della fase

Implementare:

* modello delle preferenze utente;
* migrazione Prisma;
* preferenze predefinite;
* API impostazioni;
* pagina `/settings`;
* modifica informazioni account;
* modifica password;
* tema light;
* tema dark;
* tema di sistema opzionale;
* selezione del colore principale;
* personalizzazione icone categoria;
* personalizzazione icone etichetta;
* preferenze dei form;
* preferenze dashboard;
* preferenze calendario;
* preferenze tabelle;
* preferenze promemoria;
* ripristino delle impostazioni;
* applicazione delle preferenze all’avvio;
* sincronizzazione tra database e frontend;
* test backend;
* test frontend;
* Swagger;
* aggiornamento README.

Non implementare:

* avatar o upload immagini;
* autenticazione a due fattori;
* passkey;
* cancellazione completa dell’account;
* esportazione completa dei dati personali;
* personalizzazione arbitraria di tutti i colori;
* editor CSS;
* temi scaricabili;
* caricamento di icone personalizzate;
* font personalizzati;
* impostazioni amministrative;
* preferenze condivise tra utenti.

---

# Principi generali

Le impostazioni devono essere:

* legate all’utente autenticato;
* persistenti;
* validate;
* tipizzate;
* applicate senza ricaricare l’intera applicazione quando possibile;
* coerenti tra dispositivi;
* sicure;
* accessibili;
* retrocompatibili con utenti già esistenti.

Non accettare:

```text
userId
```

dal client.

L’utente deve essere ricavato dal token JWT.

---

# Route frontend

Creare:

```text
/settings
/settings/account
/settings/appearance
/settings/experience
/settings/icons
/settings/notifications
```

È possibile implementare:

* route figlie;
* tab;
* navigazione laterale interna.

La route principale può reindirizzare a:

```text
/settings/account
```

Le route devono essere:

* protette da auth guard;
* lazy loaded, se coerente con l’architettura;
* collegate alla sidebar o al menu utente.

Aggiungere una voce:

```text
Impostazioni
```

Icona suggerita:

```text
bi-gear
```

---

# Struttura della pagina

La pagina deve mantenere uno stile gestionale.

Navigazione interna consigliata:

```text
Account
Aspetto
Esperienza
Icone
Promemoria
```

Su desktop:

* menu laterale interno;
* contenuto principale a destra.

Su mobile:

* tab scrollabili;
* oppure selettore di sezione;
* contenuti impilati.

Non creare una singola pagina eccessivamente lunga senza navigazione interna.

---

# Impostazioni account

La sezione Account deve mostrare almeno:

* nome visualizzato;
* email;
* data di creazione account;
* ultima modifica;
* azione cambio password;
* azione logout dalle altre sessioni, se il sistema supporta sessioni multiple.

Campi modificabili:

```text
displayName
email
```

Adattare i nomi al modello `User` realmente esistente.

---

# Modifica nome

La modifica del nome deve:

* validare lunghezza;
* rimuovere spazi inutili;
* aggiornare immediatamente topbar e menu utente;
* non richiedere logout;
* mostrare feedback di successo.

Validazioni indicative:

```text
minimo 2 caratteri
massimo 100 caratteri
```

Non consentire un valore composto soltanto da spazi.

---

# Modifica email

La modifica email deve:

* richiedere la password corrente;
* normalizzare l’indirizzo;
* verificare l’unicità;
* evitare user enumeration;
* invalidare le altre sessioni;
* aggiornare il contesto utente;
* essere registrata nei log senza esporre password.

Se non esiste un sistema di verifica email:

* documentare chiaramente la limitazione;
* non simulare una verifica inesistente;
* richiedere almeno la password corrente;
* invalidare i refresh token precedenti.

Se l’applicazione dispone già della verifica email, usare il flusso esistente.

---

# Modifica password

Aggiungere un form con:

```text
password corrente
nuova password
conferma nuova password
```

Regole:

* verificare la password corrente;
* usare la stessa password policy della registrazione;
* impedire che la nuova password sia uguale alla vecchia;
* aggiornare l’hash;
* revocare tutti i refresh token;
* effettuare logout dopo il cambio;
* richiedere un nuovo login;
* non registrare password nei log.

Messaggio indicativo:

```text
Password aggiornata. Accedi nuovamente con la nuova password.
```

---

# Sessioni

Se il progetto gestisce più refresh token o sessioni:

```http
POST /api/v1/settings/account/revoke-other-sessions
```

Comportamento:

* mantenere la sessione corrente;
* revocare le altre;
* restituire il numero di sessioni revocate.

Se il modello attuale non consente di distinguere le sessioni:

* non introdurre un sistema nuovo e complesso;
* documentare la limitazione;
* consentire eventualmente la revoca di tutte le sessioni.

---

# Modello preferenze Prisma

Analizzare lo schema esistente e adattare nomi e tipi.

Creare un modello uno-a-uno associato all’utente.

Struttura indicativa:

```prisma
model UserPreference {
  userId String @id @map("user_id") @db.Char(36)

  themeMode     ThemeMode  @default(SYSTEM) @map("theme_mode")
  accentColor   AccentColor @default(INDIGO) @map("accent_color")

  sidebarCollapsedByDefault Boolean @default(false) @map("sidebar_collapsed_by_default")
  compactTables             Boolean @default(false) @map("compact_tables")
  defaultPageSize           Int     @default(20) @map("default_page_size")
  rememberExpenseFilters    Boolean @default(true) @map("remember_expense_filters")

  defaultExpenseStatus      ExpenseStatus @default(COMPLETED) @map("default_expense_status")
  defaultPaymentMethod      PaymentMethod? @map("default_payment_method")

  defaultCalendarView       CalendarViewPreference @default(MONTH) @map("default_calendar_view")
  dashboardTrendMonths      Int @default(6) @map("dashboard_trend_months")

  defaultReminderTime       DateTime? @map("default_reminder_time") @db.Time(0)
  defaultReminderTypes      Json?     @map("default_reminder_types")

  enabledCategoryIcons      Json? @map("enabled_category_icons")
  enabledLabelIcons         Json? @map("enabled_label_icons")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_preferences")
}
```

Adattare i tipi UUID allo schema reale.

Non aggiungere campi già presenti altrove.

---

# Enum tema

Creare:

```prisma
enum ThemeMode {
  LIGHT
  DARK
  SYSTEM
}
```

Se si preferisce non supportare il tema di sistema, usare soltanto:

```text
LIGHT
DARK
```

La scelta consigliata è supportare anche:

```text
SYSTEM
```

per seguire automaticamente il sistema operativo.

Etichette:

```text
Chiaro
Scuro
Sistema
```

---

# Colore principale

L’utente deve poter cambiare esclusivamente il colore principale dell’interfaccia.

Non consentire la modifica arbitraria di:

* sfondo;
* testo;
* successo;
* errore;
* warning;
* ogni singolo componente.

Usare preset controllati per mantenere:

* contrasto;
* leggibilità;
* coerenza;
* accessibilità.

Enum indicativo:

```prisma
enum AccentColor {
  INDIGO
  LAVENDER
  SKY
  MINT
  CORAL
  ROSE
}
```

Palette indicativa:

```text
INDIGO    #7C83D6
LAVENDER  #9B8FD9
SKY       #70AFCB
MINT      #72B5A4
CORAL     #D98978
ROSE      #C98191
```

Adattare i colori alla palette realmente implementata.

Non permettere inizialmente un colore HEX arbitrario.

Un colore personalizzato libero potrebbe produrre:

* contrasto insufficiente;
* focus invisibile;
* pulsanti illeggibili;
* grafici incoerenti.

---

# Applicazione del colore principale

Centralizzare i token:

```css
:root {
  --primary: var(--accent-primary);
  --primary-hover: var(--accent-primary-hover);
  --primary-soft: var(--accent-primary-soft);
  --primary-contrast: var(--accent-primary-contrast);
  --focus-ring: var(--accent-focus-ring);
}
```

Applicare il preset tramite attributo:

```html
<html data-accent="indigo">
```

oppure tramite classi equivalenti.

Il colore deve aggiornare almeno:

* pulsanti principali;
* link;
* focus ring;
* sidebar attiva;
* checkbox;
* radio;
* ng-select;
* datepicker;
* paginazione;
* tab;
* elementi attivi;
* grafici temporali principali.

Non sovrascrivere i colori specifici delle categorie.

---

# Tema light

Il tema light deve continuare a usare:

* sfondo ambient chiaro;
* superfici bianche o leggermente colorate;
* bordi morbidi;
* testo scuro;
* palette pastello.

Esempio indicativo:

```css
[data-theme="light"] {
  --app-bg: #f5f7fb;
  --surface: #ffffff;
  --surface-soft: #f8f4ff;
  --sidebar-bg: #eef2ff;

  --text-primary: #303342;
  --text-secondary: #727789;
  --border-color: #e1e4ee;

  --shadow-color: rgba(48, 51, 66, 0.08);
}
```

Adattare ai token già presenti.

---

# Tema dark

Implementare un vero tema dark.

Non limitarsi a invertire i colori.

Definire token dedicati:

```css
[data-theme="dark"] {
  --app-bg: #171820;
  --surface: #20212b;
  --surface-soft: #272833;
  --sidebar-bg: #1c1d26;

  --text-primary: #f2f2f7;
  --text-secondary: #a9adbd;
  --border-color: #343644;

  --shadow-color: rgba(0, 0, 0, 0.28);
}
```

Verificare in dark mode:

* sidebar;
* topbar;
* card;
* form;
* input;
* ng-select;
* datepicker;
* dropdown;
* tabelle;
* modali;
* toast;
* grafici;
* FullCalendar;
* tooltip;
* badge;
* skeleton;
* empty state;
* scrollbar, quando stilizzata.

Non lasciare componenti con sfondo bianco hardcoded.

---

# Tema di sistema

Per `SYSTEM` usare:

```text
prefers-color-scheme
```

Ascoltare le variazioni tramite:

```text
window.matchMedia
```

Quando cambia il tema del sistema:

* aggiornare l’interfaccia;
* non modificare la preferenza salvata;
* mantenere `SYSTEM` nel database.

Rimuovere correttamente i listener alla distruzione.

---

# Prevenzione del flash del tema

Per evitare il lampeggio del tema light prima del caricamento:

1. salvare una copia della preferenza tema in `localStorage`;
2. applicarla prima del bootstrap Angular;
3. caricare le preferenze reali dopo il login;
4. riconciliare il valore locale con quello del server;
5. aggiornare `localStorage` dopo il salvataggio.

La fonte autorevole resta il database.

Non memorizzare dati sensibili nel browser.

---

# Personalizzazione delle icone

L’utente deve poter decidere quali icone mostrare nei selettori dei form:

```text
Nuova categoria
Modifica categoria
Nuova etichetta
Modifica etichetta
```

Gestire separatamente:

```text
icone categoria
icone etichetta
```

Una stessa icona può essere disponibile in entrambi gli elenchi.

---

# Catalogo delle icone

Centralizzare il catalogo frontend in un file, per esempio:

```text
apps/frontend/src/app/shared/icons/icon-catalog.ts
```

Struttura indicativa:

```typescript
export interface AppIconDefinition {
  key: string;
  bootstrapClass: string;
  label: string;
  group: IconGroup;
  recommendedForCategories: boolean;
  recommendedForLabels: boolean;
}
```

Gruppi indicativi:

```text
Generali
Casa
Alimentazione
Trasporti
Salute
Lavoro
Shopping
Tempo libero
Finanza
Viaggi
Servizi
```

Usare Bootstrap Icons già presenti.

Non memorizzare nel database classi CSS arbitrarie.

Memorizzare soltanto chiavi come:

```text
basket
car-front
house
heart-pulse
controller
briefcase
```

Il frontend deve trasformare la chiave in una classe conosciuta.

---

# Sicurezza delle icone

Quando il backend riceve una lista di icone:

* accettare soltanto stringhe;
* imporre una lunghezza massima;
* imporre un numero massimo di elementi;
* rimuovere duplicati;
* rifiutare stringhe non valide;
* non renderle direttamente come HTML;
* non usare `innerHTML`.

Pattern indicativo:

```text
^[a-z0-9-]+$
```

Il frontend deve intersecare le chiavi salvate con il catalogo conosciuto.

Le chiavi obsolete devono essere ignorate in sicurezza.

---

# Pagina personalizzazione icone

La sezione `/settings/icons` deve consentire:

* ricerca;
* filtro per gruppo;
* anteprima;
* selezione;
* deselezione;
* seleziona tutte;
* deseleziona tutte;
* ripristina predefinite;
* configurazione distinta categoria/etichetta.

Mostrare il numero selezionato.

Esempio:

```text
Icone categorie: 24 selezionate
Icone etichette: 18 selezionate
```

Imporre almeno una icona disponibile per ogni tipo.

Non consentire di salvare un catalogo completamente vuoto.

---

# Comportamento delle icone nascoste

Se un’icona viene rimossa dalle preferenze:

* non deve più essere mostrata nei nuovi selettori;
* deve continuare a essere visualizzata sulle categorie o etichette esistenti;
* non deve essere rimossa dai record già salvati;
* deve essere mostrata nel form di modifica se è già assegnata;
* deve essere disponibile come valore corrente, anche se non compare nell’elenco normale.

Non modificare automaticamente icone esistenti.

---

# Componente Icon Picker

Creare o rifinire:

```text
IconPickerComponent
```

Responsabilità:

* ricerca;
* gruppi;
* selezione;
* navigazione da tastiera;
* visualizzazione icona;
* stato selezionato;
* supporto lista filtrata;
* supporto icona corrente nascosta.

Riutilizzarlo in:

* form categoria;
* form etichetta;
* impostazioni icone.

Non creare tre implementazioni separate.

---

# Preferenze esperienza

La sezione `/settings/experience` deve consentire almeno:

## Sidebar

```text
Sidebar aperta di default
Sidebar compatta di default
```

Non serve memorizzare ogni apertura temporanea.

La preferenza rappresenta soltanto lo stato iniziale.

## Densità tabelle

Opzioni:

```text
Comoda
Compatta
```

Applicare almeno a:

* spese;
* notifiche;
* promemoria;
* ricorrenze;
* report.

## Numero righe predefinito

Opzioni consigliate:

```text
10
20
50
100
```

Valore predefinito:

```text
20
```

Il valore non deve superare i limiti backend.

## Memorizzazione filtri

Opzione:

```text
Ricorda gli ultimi filtri della pagina Spese
```

Se disabilitata:

* non ripristinare filtri precedenti;
* i query parameter espliciti devono comunque funzionare.

---

# Preferenze form spesa

Consentire:

## Stato predefinito

```text
COMPLETED
PLANNED
```

Non usare `CANCELLED` come valore predefinito.

## Metodo di pagamento predefinito

Valore opzionale tra quelli supportati.

Esempio:

```text
Carta di debito
Contanti
Bonifico
```

## Valori iniziali

Quando si apre un nuovo form:

* applicare le preferenze;
* non sovrascrivere valori ricevuti dalla route;
* non sovrascrivere valori precompilati dal calendario;
* non sovrascrivere valori durante duplicazione.

Ordine di priorità:

```text
valori espliciti del flusso
→ valori duplicati
→ valori da route/calendario
→ preferenze utente
→ default applicativi
```

---

# Preferenze dashboard

Consentire almeno:

```text
Andamento predefinito: 6 mesi
Andamento predefinito: 12 mesi
```

Valori validi:

```text
6
12
```

Applicare alla dashboard senza impedire la modifica temporanea locale.

---

# Preferenze calendario

Consentire:

```text
Mese
Settimana
Elenco
```

La preferenza deve essere usata soltanto quando:

* la route non contiene `view`;
* non esiste una vista esplicita.

I query parameter devono avere precedenza.

Su mobile il calendario può comunque adattarsi se una vista non è utilizzabile.

---

# Preferenze promemoria

La sezione `/settings/notifications` deve consentire di configurare valori predefiniti per le nuove spese pianificate.

Opzioni:

```text
Orario predefinito del promemoria
Preset promemoria suggeriti
Notifica per il giorno stesso
Notifica per spese scadute
```

Preset disponibili:

```text
SAME_DAY
ONE_DAY_BEFORE
THREE_DAYS_BEFORE
SEVEN_DAYS_BEFORE
```

Queste impostazioni rappresentano valori predefiniti o suggerimenti.

Non devono modificare automaticamente i promemoria già esistenti.

Esempio:

```text
Per le nuove spese pianificate proponi:
✓ 3 giorni prima
✓ Il giorno stesso
```

L’utente deve comunque poterli modificare nel form.

---

# Distinzione dalla Fase 11

La Fase 10 gestisce:

* preferenze predefinite dei promemoria;
* orario predefinito;
* comportamento suggerito nei nuovi form.

La Fase 11 gestirà invece:

* pagina globale di tutti i promemoria;
* filtri;
* ricerca;
* modifica;
* disattivazione;
* eliminazione;
* collegamento alle spese;
* operazioni massive.

Non implementare la pagina globale dei promemoria in questa fase.

---

# Ripristino impostazioni

Aggiungere:

```text
Ripristina impostazioni predefinite
```

L’azione deve:

* richiedere conferma;
* ripristinare soltanto le preferenze;
* non modificare account;
* non modificare categorie;
* non modificare etichette;
* non modificare spese;
* non eliminare promemoria;
* non eliminare ricorrenze.

Dopo il ripristino:

* aggiornare immediatamente il tema;
* aggiornare il colore;
* aggiornare icone;
* aggiornare store;
* mostrare toast.

Endpoint:

```http
POST /api/v1/settings/preferences/reset
```

---

# Backend NestJS

Creare:

```text
SettingsModule
```

Struttura indicativa:

```text
apps/backend/src/settings/
├── dto/
│   ├── update-account.dto.ts
│   ├── change-password.dto.ts
│   ├── update-appearance-preferences.dto.ts
│   ├── update-experience-preferences.dto.ts
│   ├── update-icon-preferences.dto.ts
│   └── update-notification-preferences.dto.ts
├── settings.controller.ts
├── settings.service.ts
├── settings.mapper.ts
├── settings.defaults.ts
├── settings.types.ts
├── settings.module.ts
└── settings.service.spec.ts
```

Responsabilità:

## SettingsController

* recupero impostazioni;
* aggiornamento account;
* cambio password;
* aggiornamento preferenze;
* reset;
* revoca sessioni.

## SettingsService

* ownership;
* recupero;
* creazione lazy delle preferenze;
* aggiornamento;
* validazione;
* reset;
* delega a `UsersService` e `AuthService`.

## SettingsMapper

* serializzazione;
* valori predefiniti;
* esclusione campi sensibili.

Non duplicare:

* hashing password;
* gestione refresh token;
* validazione email;
* business logic dell’autenticazione.

---

# Creazione delle preferenze

Per nuovi utenti:

* creare automaticamente `UserPreference` durante la registrazione;
* usare valori predefiniti.

Per utenti esistenti:

* usare `upsert`;
* oppure creazione lazy al primo accesso;
* non causare errori se il record non esiste.

Il servizio `GET /settings` deve sempre restituire un oggetto completo.

Non restituire preferenze parziali con molti valori `null`.

---

# API impostazioni

Utilizzare il prefisso:

```text
/api/v1/settings
```

Tutti gli endpoint devono essere autenticati.

Implementare almeno:

```http
GET   /api/v1/settings

PATCH /api/v1/settings/account
PATCH /api/v1/settings/account/password
POST  /api/v1/settings/account/revoke-other-sessions

PATCH /api/v1/settings/appearance
PATCH /api/v1/settings/experience
PATCH /api/v1/settings/icons
PATCH /api/v1/settings/notifications

POST  /api/v1/settings/preferences/reset
```

Se l’architettura preferisce un solo endpoint:

```http
PATCH /api/v1/settings/preferences
```

mantenere comunque DTO distinti e validazione chiara.

---

# Risposta impostazioni

Esempio indicativo:

```json
{
  "account": {
    "id": "uuid",
    "displayName": "Cristian",
    "email": "utente@example.com",
    "createdAt": "2026-01-15T12:00:00.000Z",
    "updatedAt": "2026-07-18T14:00:00.000Z"
  },
  "appearance": {
    "themeMode": "DARK",
    "resolvedTheme": "DARK",
    "accentColor": "MINT"
  },
  "experience": {
    "sidebarCollapsedByDefault": false,
    "compactTables": false,
    "defaultPageSize": 20,
    "rememberExpenseFilters": true,
    "defaultExpenseStatus": "COMPLETED",
    "defaultPaymentMethod": "DEBIT_CARD",
    "defaultCalendarView": "MONTH",
    "dashboardTrendMonths": 6
  },
  "icons": {
    "enabledCategoryIcons": [
      "basket",
      "car-front",
      "house"
    ],
    "enabledLabelIcons": [
      "star",
      "bookmark",
      "calendar-check"
    ]
  },
  "notifications": {
    "defaultReminderTime": "09:00",
    "defaultReminderTypes": [
      "THREE_DAYS_BEFORE",
      "SAME_DAY"
    ],
    "dueTodayEnabled": true,
    "overdueEnabled": true
  }
}
```

Adattare la risposta al wrapper standard del progetto.

Non restituire:

* password hash;
* refresh token;
* deduplication key;
* campi interni;
* segreti.

---

# DTO backend

Creare almeno:

```text
UpdateAccountDto
ChangePasswordDto
UpdateAppearancePreferencesDto
UpdateExperiencePreferencesDto
UpdateIconPreferencesDto
UpdateNotificationPreferencesDto
```

Validare:

## Account

* nome;
* email;
* password corrente per cambio email.

## Aspetto

* tema enum;
* colore enum.

## Esperienza

* page size consentita;
* stato spesa consentito;
* metodo pagamento;
* vista calendario;
* mesi dashboard.

## Icone

* array;
* stringhe;
* nessun duplicato;
* almeno un elemento;
* massimo ragionevole;
* pattern valido.

## Promemoria

* orario valido;
* enum validi;
* nessun duplicato.

Usare whitelist globale.

Non accettare campi sconosciuti.

---

# Migrazione Prisma

Creare una migrazione descrittiva:

```text
add_user_preferences
```

La migrazione deve:

* aggiungere enum necessari;
* aggiungere `user_preferences`;
* aggiungere relazione con `User`;
* aggiungere vincolo uno-a-uno;
* preservare gli utenti esistenti.

Non modificare migrazioni già applicate.

Non usare `prisma db push` come soluzione finale.

Eseguire:

```text
prisma format
prisma validate
prisma generate
```

---

# Frontend Angular

Creare:

```text
SettingsPageComponent
SettingsNavigationComponent
AccountSettingsComponent
AppearanceSettingsComponent
ExperienceSettingsComponent
IconSettingsComponent
NotificationSettingsComponent
```

Componenti aggiuntivi:

```text
ThemeSelectorComponent
AccentColorSelectorComponent
IconPickerComponent
IconCatalogManagerComponent
SettingsSectionComponent
DangerActionCardComponent
```

Riutilizzare:

* page header;
* form control;
* ng-select;
* toast;
* confirm dialog;
* loading skeleton;
* error state.

Non creare componenti duplicati.

---

# SettingsService

Creare:

```text
SettingsService
```

Responsabilità:

* recupero impostazioni;
* aggiornamento account;
* cambio password;
* aggiornamento sezioni;
* reset;
* revoca sessioni.

Le chiamate HTTP non devono risiedere nei componenti.

---

# SettingsStore

Creare preferibilmente:

```text
SettingsStore
```

basato su Signals.

Stato indicativo:

```text
settings
loading
savingSection
error
resolvedTheme
isDirty
```

Computed:

```text
themeMode
accentColor
enabledCategoryIcons
enabledLabelIcons
defaultPageSize
defaultCalendarView
```

Responsabilità:

* caricamento;
* applicazione immediata;
* salvataggio;
* rollback in caso di errore;
* aggiornamento cache locale;
* reset.

Non introdurre NgRx.

---

# ThemeService

Creare:

```text
ThemeService
```

Responsabilità:

* applicare tema;
* risolvere `SYSTEM`;
* applicare colore principale;
* aggiornare attributi root;
* ascoltare `prefers-color-scheme`;
* sincronizzare cache locale;
* aggiornare componenti interessati.

Non distribuire la logica del tema in più componenti.

---

# Applicazione all’avvio

Flusso consigliato:

1. leggere tema e colore da cache locale;
2. applicarli prima del rendering;
3. avviare Angular;
4. dopo autenticazione caricare impostazioni server;
5. aggiornare store;
6. correggere eventuali differenze;
7. mantenere le impostazioni durante la navigazione.

Se il caricamento fallisce:

* usare i default;
* non bloccare il login;
* mostrare errore non invasivo;
* consentire retry dalla pagina Impostazioni.

---

# Aggiornamento immediato

Quando l’utente cambia:

* tema;
* colore;
* densità;
* sidebar;

mostrare un’anteprima immediata.

Strategia:

1. applicare localmente;
2. chiamare API;
3. in caso di successo mantenere;
4. in caso di errore ripristinare il valore precedente;
5. mostrare toast.

Per modifiche account e password non usare aggiornamento ottimistico.

---

# Dirty state

I form con più valori devono indicare modifiche non salvate.

Comportamento:

* pulsante Salva disabilitato senza cambiamenti;
* pulsante Ripristina sezione;
* conferma in uscita soltanto quando esistono modifiche reali;
* non mostrare conferme per il semplice cambio tab senza modifiche.

---

# Formattazione e localizzazione

Usare:

```text
it-IT
Europe/Rome
EUR
```

Le impostazioni non devono introdurre ancora una selezione completa di:

* lingua;
* valuta;
* fuso orario.

È possibile mostrare questi valori come informazioni correnti non modificabili.

L’internazionalizzazione completa può essere una fase futura.

---

# Accessibilità

Garantire:

* label;
* descrizioni;
* focus visibile;
* selezione tema da tastiera;
* selezione colore non indicata soltanto dal colore;
* nome testuale del colore;
* anteprima con contrasto;
* icon picker da tastiera;
* checkbox con label;
* errori associati;
* conferme accessibili;
* tema dark con contrasto sufficiente.

Per i colori mostrare sempre:

```text
nome
campione
stato selezionato
```

---

# Responsive design

## Desktop

* navigazione impostazioni laterale;
* form a larghezza controllata;
* anteprime affiancate;
* catalogo icone a griglia.

## Tablet

* navigazione superiore;
* form su una o due colonne;
* catalogo responsive.

## Mobile

* sezioni impilate;
* tab scrollabili o select;
* pulsanti a larghezza completa quando utile;
* catalogo icone con celle sufficientemente grandi;
* nessuno scroll orizzontale.

---

# Dark mode e librerie esterne

Verificare esplicitamente:

## ng-select

* menu;
* ricerca;
* elemento selezionato;
* placeholder;
* disabilitato;
* errore;
* focus.

## Datepicker

* calendario;
* intestazione;
* giorni;
* selezione;
* hover;
* giorni disabilitati.

## Chart.js

* testo;
* griglia;
* tooltip;
* legenda;
* colori temporali.

## FullCalendar

* header;
* celle;
* eventi;
* today;
* popover;
* lista.

## Toast e modali

* overlay;
* superficie;
* testo;
* focus.

Non usare stili hardcoded separati per ogni pagina.

---

# Prestazioni

Le impostazioni devono essere caricate:

* una volta all’avvio della sessione;
* aggiornate dopo modifica;
* riutilizzate tramite store.

Non chiamare `GET /settings` a ogni cambio pagina.

Il catalogo icone deve essere:

* statico;
* tree-shakable;
* non recuperato ripetutamente dal backend.

Non memorizzare centinaia di icone complete nel database.

Memorizzare soltanto le chiavi selezionate.

---

# Sicurezza

## Account

* richiedere password corrente per email e password;
* nessuna password nei log;
* revoca sessioni;
* ownership.

## Preferenze

* enum validi;
* array limitati;
* nessun CSS arbitrario;
* nessun HTML arbitrario;
* nessun nome classe arbitrario renderizzato;
* nessun `userId` client.

## Errori

Non distinguere pubblicamente:

```text
utente inesistente
email di un altro utente
```

con dettagli eccessivi.

---

# Seed development

Aggiornare il seed demo con preferenze idempotenti.

Esempio:

```text
themeMode = LIGHT
accentColor = INDIGO
defaultPageSize = 20
defaultCalendarView = MONTH
dashboardTrendMonths = 6
```

Aggiungere un sottoinsieme ragionevole di icone.

Non creare preferenze demo in production.

---

# Test backend

Scrivere test almeno per:

## Recupero

* utente con preferenze;
* utente senza preferenze;
* creazione lazy;
* default completi;
* ownership.

## Account

* modifica nome;
* nome non valido;
* cambio email;
* email duplicata;
* password corrente errata;
* revoca sessioni.

## Password

* password corrente corretta;
* password errata;
* nuova password non valida;
* nuova uguale alla vecchia;
* revoca refresh token.

## Aspetto

* tema valido;
* tema non valido;
* colore valido;
* colore non valido;
* reset.

## Esperienza

* page size;
* valore non consentito;
* metodo pagamento;
* stato default;
* calendario;
* dashboard 6/12 mesi.

## Icone

* liste valide;
* lista vuota;
* duplicati;
* troppe icone;
* chiave non valida;
* isolamento tra utenti.

## Promemoria

* orario valido;
* orario non valido;
* preset validi;
* duplicati;
* preferenze non applicate retroattivamente.

---

# Test frontend

Scrivere test almeno per:

* caricamento impostazioni;
* route protette;
* navigazione interna;
* modifica nome;
* modifica email;
* cambio password;
* errore password;
* tema light;
* tema dark;
* tema system;
* cambio sistema operativo simulato;
* cambio colore;
* rollback colore;
* applicazione prima del rendering;
* persistenza locale;
* riconciliazione server;
* sidebar;
* densità;
* page size;
* default form;
* vista calendario;
* mesi dashboard;
* selezione icone categoria;
* selezione icone etichetta;
* ricerca icone;
* reset icone;
* icona nascosta già assegnata;
* preferenze promemoria;
* reset completo;
* dirty state;
* loading;
* error state;
* retry;
* accessibilità essenziale;
* responsive essenziale.

---

# Verifica manuale

Al termine verificare almeno:

1. effettuare il login;
2. aprire Impostazioni;
3. modificare il nome;
4. verificare topbar e menu;
5. cambiare email;
6. verificare revoca sessioni;
7. cambiare password;
8. effettuare nuovamente login;
9. selezionare tema dark;
10. verificare tutte le pagine;
11. selezionare tema light;
12. selezionare tema system;
13. cambiare colore principale;
14. verificare pulsanti, link e focus;
15. ridurre le icone categoria;
16. aprire Nuova categoria;
17. verificare il nuovo elenco;
18. modificare una categoria con icona nascosta;
19. ridurre le icone etichetta;
20. aprire Nuova etichetta;
21. impostare metodo pagamento predefinito;
22. aprire Nuova spesa;
23. verificare il valore;
24. cambiare vista calendario predefinita;
25. aprire il calendario senza query parameter;
26. cambiare intervallo dashboard;
27. impostare promemoria predefiniti;
28. creare una spesa pianificata;
29. verificare i suggerimenti;
30. effettuare logout e login;
31. verificare persistenza;
32. provare da un secondo browser;
33. ripristinare i default;
34. verificare mobile;
35. accedere con un secondo utente;
36. confermare l’isolamento delle preferenze.

---

# Verifica finale obbligatoria

Al termine:

1. eseguire `prisma format`;
2. eseguire `prisma validate`;
3. generare Prisma Client;
4. applicare la migrazione;
5. eseguire seed development;
6. eseguire test backend;
7. eseguire test frontend;
8. eseguire lint;
9. eseguire type checking;
10. eseguire build backend;
11. eseguire build frontend;
12. verificare Swagger;
13. verificare Docker Compose;
14. verificare light mode;
15. verificare dark mode;
16. verificare system mode;
17. verificare tutti i colori principali;
18. verificare categorie ed etichette;
19. verificare form spesa;
20. verificare desktop e mobile;
21. correggere tutti gli errori trovati.

Non dichiarare superate verifiche non realmente eseguite.

---

# README

Documentare:

* pagina Impostazioni;
* temi;
* colore principale;
* preferenze icone;
* valori predefiniti;
* cache locale;
* persistenza database;
* comportamento del tema di sistema;
* limitazioni;
* assenza di colori arbitrari;
* assenza di upload icone personalizzate.

---

# Vincoli

* Non implementare la pagina globale dei promemoria.
* Non implementare ancora il polish release.
* Non introdurre avatar.
* Non introdurre upload file.
* Non introdurre temi scaricabili.
* Non consentire CSS arbitrario.
* Non consentire HTML arbitrario.
* Non consentire colori arbitrari non validati.
* Non rimuovere icone dai record esistenti.
* Non salvare le preferenze soltanto in `localStorage`.
* Non duplicare hashing o autenticazione.
* Non accettare `userId` dal client.
* Non usare `any`.
* Non disabilitare TypeScript strict.
* Non introdurre NgRx.
* Non effettuare chiamate HTTP direttamente nei componenti.
* Non usare `--force`.
* Non usare `--legacy-peer-deps`.
* Non lasciare TODO bloccanti.
* Non ignorare errori di test, lint o build.
* Non riscrivere componenti funzionanti delle fasi precedenti.

---

# Output finale richiesto all’agente

Concludere con un riepilogo contenente:

* modello Prisma aggiunto;
* migrazione creata;
* enum aggiunti;
* endpoint disponibili;
* impostazioni account implementate;
* temi implementati;
* colori disponibili;
* strategia anti-flash;
* strategia cache/server;
* preferenze esperienza;
* preferenze form;
* preferenze calendario;
* preferenze dashboard;
* preferenze promemoria;
* gestione catalogo icone;
* componenti Angular creati o riutilizzati;
* test realmente eseguiti;
* build realmente eseguite;
* verifica Swagger;
* verifica Docker;
* problemi corretti;
* eventuali limitazioni residue reali.

Non limitarsi al riepilogo: implementare prima integralmente la fase.
