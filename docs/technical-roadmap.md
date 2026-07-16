# Roadmap tecnica

La realizzazione procede per incrementi avviabili. Ogni fase termina con build, test, migrazioni e documentazione aggiornati.

## Fase 1 — Setup (completata)

- monorepo npm con frontend Angular standalone strict e backend NestJS;
- Prisma, MariaDB, migrazioni, seed e stack Docker Compose con healthcheck;
- Bootstrap 5, locale italiano, euro e fuso `Europe/Rome`.

## Fase 2 — Autenticazione (completata)

- registrazione, login, logout, `/auth/me` e refresh token ruotati/revocabili;
- Argon2id, JWT separati, cookie HttpOnly, rate limiting e guard frontend/backend;
- Swagger e test automatici dei flussi di autenticazione.

## Fase 3 — Categorie ed etichette (completata)

- catalogo globale di 20 categorie con preferenze personali;
- CRUD, ricerca, stato, riordino, soft delete e ownership delle etichette;
- pagine Angular responsive, form reattivi e componenti condivisi.

## Fase 4 — Spese (completata)

- modelli `Expense` ed `ExpenseLabel`, enum, migrazione e seed dimostrativo idempotente;
- CRUD protetto da ownership, mapper, soft delete, duplicazione e cambio stato;
- ricerca, filtri, ordinamento, paginazione server-side ed export CSV;
- pagina gestionale responsive, form condiviso, dettaglio e inserimento rapido globale;
- test backend/frontend, lint, type checking, build e verifica Docker.

## Fasi 5–6 — Dashboard e report (completate)

- KPI e aggregazioni autorevoli sul backend;
- grafici Chart.js, ultimi inserimenti e prossime spese;
- consultazione mensile e confronto tra periodi.

## Fase 7 — Calendario (completata)

- viste mensile, settimanale ed elenco sull’intervallo visibile;
- filtri URL, creazione, dettaglio, modifica e cambio stato riutilizzando i flussi spesa;
- gestione delle pianificate scadute e spostamento con rollback.

## Fase 8 — Avvisi e ricorrenze

- notifiche interne e scheduler;
- generazione idempotente delle ricorrenze.

## Fase 9 — Rifinitura

- accessibilità e responsive design;
- copertura test, hardening finale e documentazione operativa.
