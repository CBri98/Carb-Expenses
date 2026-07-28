# Chiusura Fase 10.9 — 28 luglio 2026

La Fase 10.9 è completata. La specifica autorevole è
`PHASE_10_9_THEME_HEADERS_AND_TABLES.md`.

## Tema e transizioni

- `--bs-link-color-rgb` segue ora `--primary-rgb` e quindi il colore accent;
- body, card, celle tabella, form, modali, dropdown, toast, sidebar e topbar
  animano in modo breve colore, background, bordo e ombra;
- gli hover interattivi mantengono transizioni dedicate;
- `prefers-reduced-motion` continua ad azzerare le animazioni per chi lo
  richiede.

## Gerarchia delle pagine

- Dashboard usa `Panoramica`;
- Spese, Spese ricorrenti, Categorie, Etichette, form e dettagli usano
  `Gestione`;
- Calendario, Report mensile e Confronto mensile usano `Analisi`;
- Notifiche e Impostazioni usano `Area personale`;
- il sovratitolo di `PageHeaderComponent` è ora obbligatorio e non può più
  ricadere implicitamente su “Impostazioni”.

## Sidebar, Dashboard e Ricorrenze

- il margine verticale delle voci sidebar è `0.25rem`;
- link, icone, stato attivo e controllo collasso hanno transizioni coerenti;
- la scadenza nelle card “Prossime spese” usa il colore accent primario e non
  più il giallo warning;
- la tabella Spese ricorrenti usa `table-hover`, background animato e focus
  visibile come la tabella Spese;
- le card Ricorrenze mobile hanno un hover equivalente.

## Verifiche

- TypeScript strict frontend e backend: superato;
- ESLint: superato senza errori o warning;
- frontend: 49 file e 123 test superati;
- backend: 24 file e 150 test superati;
- build frontend e backend: superata;
- Docker Compose: frontend, backend e MariaDB healthy;
- E2E browser reale: superato;
- link RGB, transizioni, margine sidebar, sovratitoli, colore scadenza e hover
  Ricorrenze verificati nel browser;
- responsive verificato a 320, 390, 768 e 1440 px senza overflow.

## Avvertenze note

Restano i due warning di budget frontend già documentati:

- bundle iniziale 870,91 kB rispetto al budget 700 kB;
- SCSS Calendario 8,38 kB rispetto al budget 8 kB.
