# Chiusura Fase 10.7 — 27 luglio 2026

La Fase 10.7 è completata. La specifica autorevole è
`PHASE_10_7_NAVIGATION_AND_BREADCRUMBS.md`.

## Sidebar

- “Gestione” contiene esclusivamente Spese, Spese ricorrenti, Categorie ed
  Etichette;
- “Analisi” contiene Calendario, Report mensile e Confronto mensile;
- “Area personale” è l'ultima sezione e contiene Notifiche e Impostazioni;
- il badge delle notifiche non è stato modificato;
- Impostazioni resta attiva soltanto nelle route delle preferenze e non su
  Categorie o Etichette;
- ordine e contenuti sono identici su desktop e menu mobile.

## Breadcrumb

- introdotto `AppBreadcrumbComponent` standalone condiviso;
- gli elementi intermedi configurati sono link Angular Router reali;
- soltanto l'ultimo elemento è corrente e usa `aria-current="page"`;
- Categorie ed Etichette usano ora il parent “Gestione”, non “Impostazioni”;
- Spese e Spese ricorrenti usano la stessa gerarchia anche nelle pagine Nuova,
  Modifica e Dettaglio;
- Notifiche e Impostazioni usano il parent “Area personale”;
- Calendario, Report mensile e Confronto mensile usano il parent “Analisi”;
- Dashboard usa lo stesso componente con un solo elemento corrente;
- il breadcrumb può andare a capo senza generare overflow.

## Verifiche

- TypeScript strict frontend e backend: superato;
- ESLint: superato senza errori;
- frontend: 47 file e 119 test superati;
- build frontend: superata;
- Docker Compose: frontend, backend e MariaDB healthy;
- E2E browser reale: superato;
- Gestione verificata con esattamente quattro voci;
- Area personale verificata come ultima sezione con due voci;
- click del breadcrumb Gestione verificato verso `/expenses`;
- click del breadcrumb Area personale verificato verso `/notifications`;
- responsive verificato a 320, 390, 768 e 1440 px senza overflow;
- tema chiaro, tema scuro e colore accent continuano a essere coperti dalla
  suite E2E.

## Avvertenze note

Restano invariati i due warning di budget frontend già documentati:

- bundle iniziale 870,33 kB rispetto al budget 700 kB;
- SCSS Calendario 8,38 kB rispetto al budget 8 kB.
