# Chiusura Fase 10.8 — 28 luglio 2026

La Fase 10.8 è completata. La specifica autorevole è
`PHASE_10_8_COUNTERS_ICONS_AND_THEME.md`.

## Counter card

- Spese, Spese ricorrenti, Categorie ed Etichette mostrano sempre come valore
  principale il totale globale, indipendente dalla query corrente;
- quando ricerca o filtri sono attivi compare anche il valore autorevole
  “Risultato filtrato”;
- paginazione e ordinamento non attivano il valore filtrato;
- le card Ricorrenze filtrano Attive/In pausa o aprono le occorrenze pianificate
  dei prossimi 30 giorni;
- le card Etichette applicano un filtro URL/backend per associate a categoria,
  senza categoria e non utilizzate;
- tutte le interazioni sono disponibili anche da tastiera.

## Icone

- la whitelist API contiene tutte le 97 chiavi del catalogo frontend;
- i preset categoria ed etichetta sono allineati tra frontend e backend;
- `bi-cart-check`, `bi-trophy`, `bi-feather`, `bi-shield-check` e le altre icone
  selezionabili possono essere salvate da Impostazioni;
- valori arbitrari, duplicati, cataloghi vuoti e classi CSS composte restano
  rifiutati dal DTO.

## Tema e layout

- `--sidebar-bg`, `--topbar-translucent` e `--surface-soft` derivano
  dinamicamente dal colore accent con una miscelazione contenuta;
- la derivazione è verificata in tema chiaro e scuro;
- le voci della sidebar hanno un margine verticale minimo uniforme;
- il body della card Dashboard “Prossima spesa” cresce nello spazio disponibile
  e non spezza più prematuramente le parole;
- conteggi, importi, percentuali, date e massimo storico utili nelle card
  Dashboard hanno enfasi semantica tramite `strong`.

## Verifiche

- TypeScript strict frontend e backend: superato;
- ESLint: superato senza errori o warning;
- frontend: 48 file e 122 test superati;
- backend: 24 file e 150 test superati;
- build di produzione frontend e backend: superata;
- Docker Compose: immagini ricostruite e tre servizi healthy;
- E2E browser reale: superato;
- cambio accent verificato su nav attiva, sidebar, topbar e surface-soft in light
  e dark mode;
- responsive verificato a 320, 390, 768 e 1440 px senza overflow;
- larghezza body “Prossima spesa”, enfasi numeriche e margine sidebar verificati
  nel browser.

## Avvertenze note

Restano invariati i due warning di budget frontend già documentati:

- bundle iniziale 870,57 kB rispetto al budget 700 kB;
- SCSS Calendario 8,38 kB rispetto al budget 8 kB.
