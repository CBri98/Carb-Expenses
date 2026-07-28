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

## Fase 8 — Promemoria e notifiche interne (completata)

- promemoria multipli sulle spese pianificate;
- notifiche interne deduplicate e scheduler NestJS;
- pagina notifiche, campanella e conteggio non letto.

## Fase 9 — Spese ricorrenti (completata)

- regole giornaliere, settimanali, mensili e annuali;
- generazione anticipata idempotente, eccezioni, pausa e terminazione;
- pagina elenco, dettaglio e form ricorrenze.

## Fase 10 — Impostazioni e personalizzazione (completata)

- account, password e revoca delle altre sessioni;
- preferenze persistenti per tema, accento, esperienza, icone e promemoria;
- applicazione immediata delle preferenze e cache locale non sensibile.

## Fase 10.5 — Rifinitura interfaccia (completata)

- reload affidabile delle route protette senza redirect intermedio;
- coerenza light/dark e accenti su layout, grafici e componenti Bootstrap;
- filtri condivisi, responsive di dashboard, report, spese e calendario;
- ricorrenze uniformate, catalogo di 97 icone e date estese centralizzate;
- test unitari completi e test E2E del reload autenticato, responsive, tema e flussi Ricorrenze.

## Fasi 10.6–10.9 — Correzioni e coerenza UI (completate)

- card, filtri, form, date estese e componenti multi-select uniformati;
- navigazione separata in Gestione, Analisi e Area personale con breadcrumb
  funzionanti;
- counter globali con risultato filtrato e interazioni autorevoli;
- catalogo icone frontend/backend allineato;
- colori accent coordinati su sidebar, topbar e superfici soft.
- transizioni tema, gerarchia dei sovratitoli e hover delle tabelle uniformati.

## Fase 11 — Gestione centralizzata dei promemoria (completata)

- modulo e API globali con ownership, paginazione, filtri, ordinamento e riepilogo aggregato;
- stati derivati, origine persistita e regole sicure per modifica, annullamento, riattivazione ed eliminazione;
- pagina Angular responsive con URL state, selezione, operazioni massive e riuso del form spesa;
- integrazione con spese, notifiche, ricorrenze, impostazioni, seed, Swagger e test automatici.

## Fase 12 — Polish, testing e release

- accessibilità e responsive design finali;
- copertura test, hardening, bundle e documentazione operativa.
