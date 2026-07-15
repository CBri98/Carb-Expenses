Leggi interamente `AGENTS.md` e analizza lo stato attuale del repository.

Verifica prima che la Fase 1 sia realmente completa e funzionante:

* frontend Angular avviabile;
* backend NestJS avviabile;
* MariaDB raggiungibile;
* Prisma configurato correttamente;
* migrazioni eseguibili;
* seed funzionante;
* Docker Compose funzionante;
* variabili d’ambiente documentate;
* build frontend e backend senza errori.

Correggi eventuali problemi bloccanti della Fase 1, ma non effettuare refactoring non necessari.

Successivamente implementa esclusivamente la **Fase 2 — Autenticazione**.

## Backend NestJS

Implementa:

* registrazione;
* login;
* logout;
* refresh token;
* endpoint `GET /api/v1/auth/me`;
* hashing sicuro delle password con Argon2;
* access token JWT a breve durata;
* refresh token JWT a lunga durata;
* salvataggio nel database esclusivamente dell’hash del refresh token;
* revoca del refresh token al logout;
* rotazione del refresh token;
* protezione degli endpoint tramite guard JWT;
* decoratore per recuperare l’utente autenticato;
* validazione DTO con `class-validator`;
* rate limiting sugli endpoint di autenticazione;
* Swagger aggiornato.

Crea o completa i moduli:

* `AuthModule`;
* `UsersModule`;
* eventuali guard, decorator, strategy e service condivisi.

Gli endpoint richiesti sono:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

### Registrazione

Campi:

* email;
* password;
* nome;
* cognome opzionale.

Regole minime:

* email valida e normalizzata;
* email univoca;
* password di almeno 8 caratteri;
* password contenente almeno una lettera e un numero;
* password mai restituita nelle risposte;
* errore comprensibile se l’email è già registrata.

### Login

Accetta:

* email;
* password.

Restituisce:

* utente;
* access token;
* refresh token.

Non rivelare se l’errore dipende dall’email o dalla password.

### Refresh token

* verificare firma e scadenza;
* verificare che il token non sia stato revocato;
* confrontare il token con l’hash salvato;
* revocare il vecchio token;
* generare una nuova coppia di token;
* prevenire il riutilizzo di refresh token precedenti.

### Modello dati

Aggiungi o completa i modelli Prisma necessari, inclusi almeno:

```text
User
RefreshToken
```

Il modello `User` deve includere:

```text
id
email
passwordHash
firstName
lastName nullable
currency
timezone
createdAt
updatedAt
```

Il modello `RefreshToken` deve includere:

```text
id
userId
tokenHash
expiresAt
revokedAt nullable
createdAt
```

Crea una migrazione Prisma con un nome descrittivo.

Non modificare manualmente il database senza migrazione.

## Frontend Angular

Implementa:

* pagina login;
* pagina registrazione;
* layout separato per l’autenticazione;
* `AuthService`;
* gestione dello stato dell’utente autenticato tramite Angular Signals;
* interceptor HTTP per aggiungere l’access token;
* interceptor per gestire il refresh automatico;
* auth guard;
* guest guard;
* logout;
* ripristino della sessione all’avvio tramite `/auth/me`;
* redirect alla dashboard dopo il login;
* redirect al login quando la sessione non è valida.

Rotte richieste:

```text
/auth/login
/auth/register
/dashboard
```

La dashboard può restare una pagina placeholder minimale protetta, senza implementare ancora grafici o funzionalità gestionali.

### Form

Usa Angular Reactive Forms.

Il form di login deve avere:

* email;
* password;
* mostra/nascondi password;
* validazioni;
* stato loading;
* messaggi di errore.

Il form di registrazione deve avere:

* nome;
* cognome opzionale;
* email;
* password;
* conferma password;
* validazione della corrispondenza delle password;
* stato loading;
* messaggi di errore.

Non usare `any`.

Non effettuare chiamate HTTP direttamente nei componenti.

## Gestione token

Per questa prima versione:

* mantieni l’access token in memoria tramite `AuthService`;
* conserva il refresh token in modo coerente con l’architettura esistente;
* preferisci cookie `HttpOnly`, `Secure` e `SameSite` se frontend e backend sono configurati per supportarli correttamente;
* non salvare token sensibili in chiaro nel database;
* non inserire token nei log.

Se scegli cookie HttpOnly:

* configura correttamente CORS e `withCredentials`;
* documenta il comportamento;
* gestisci ambiente development e production.

Evita soluzioni ibride incoerenti.

## Test backend

Scrivi test per almeno:

* registrazione valida;
* registrazione con email duplicata;
* password non valida;
* login valido;
* login con credenziali errate;
* accesso a `/auth/me` senza token;
* accesso a `/auth/me` con token valido;
* refresh valido;
* refresh token revocato;
* logout;
* impossibilità di riutilizzare un vecchio refresh token.

## Test frontend

Scrivi test per almeno:

* validazione login;
* validazione registrazione;
* password non corrispondenti;
* auth guard;
* guest guard;
* aggiornamento dello stato dopo il login;
* logout;
* gestione di una sessione scaduta.

## Vincoli

* Non implementare ancora CRUD spese, categorie, etichette, grafici o calendario.
* Non usare dati mock nel flusso di autenticazione.
* Non disabilitare TypeScript strict.
* Non ignorare errori ESLint o build.
* Non modificare dipendenze senza una necessità concreta.
* Non sostituire parti funzionanti della Fase 1.
* Mantieni frontend, backend, Prisma e Docker coerenti.
* Aggiorna `.env.example`, Swagger e README.
* Non lasciare TODO bloccanti o codice placeholder nell’autenticazione.

## Verifica finale obbligatoria

Al termine:

1. esegui la migrazione Prisma;
2. esegui i test backend;
3. esegui i test frontend;
4. esegui la build backend;
5. esegui la build frontend;
6. verifica registrazione, login, refresh, `/auth/me` e logout;
7. verifica l’avvio tramite Docker Compose;
8. correggi tutti gli errori rilevati.

Concludi con un riepilogo contenente:

* file principali creati o modificati;
* migrazioni aggiunte;
* endpoint disponibili;
* strategia usata per i token;
* test eseguiti;
* eventuali limitazioni residue reali.

Non limitarti a descrivere il codice: implementalo direttamente nel repository.
